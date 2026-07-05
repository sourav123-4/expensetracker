import { PaymentMethod } from '../types/api';

export interface ParsedTransaction {
  type: 'expense' | 'income';
  amount: number;
  /** Merchant (card spends) or counterparty name (bank transfers) — becomes the form's Title. */
  title: string;
  paymentMethod: PaymentMethod;
  /** ISO date (yyyy-mm-dd) — best-effort; falls back to today if the SMS date can't be parsed. */
  date: string;
  bank: string;
  raw: string;
}

const MONTHS: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

/** "05 JUL 2026" -> "2026-07-05" */
function fromDdMonYyyy(day: string, mon: string, year: string): string | null {
  const mm = MONTHS[mon.toUpperCase()];
  if (!mm) return null;
  return `${year}-${mm}-${day.padStart(2, '0')}`;
}

/** "04-07-26" or "02/07/26" (dd-mm-yy, the standard Indian bank SMS format) -> "2026-07-04" */
function fromDdMmYy(day: string, month: string, year: string): string {
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

function titleCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Template = (body: string) => ParsedTransaction | null;

/** IDFC FIRST Bank credit card spend: "INR 149.00 spent on your IDFC FIRST Bank Credit Card ending XX8301 at ZEPTOONLINE on 05 JUL 2026" */
const idfcCreditCardSpend: Template = (body) => {
  const m = body.match(
    /INR\s*([\d,]+\.\d{2})\s*spent on your ([\w\s]*?Credit Card) ending (\w+) at ([A-Z0-9]+) on (\d{1,2}) (\w{3}) (\d{4})/i,
  );
  if (!m) return null;
  const date = fromDdMonYyyy(m[5], m[6], m[7]) ?? new Date().toISOString().slice(0, 10);
  return {
    type: 'expense',
    amount: parseAmount(m[1]),
    title: titleCase(m[4]),
    paymentMethod: 'Card',
    date,
    bank: guessBankName(body),
    raw: body,
  };
};

/** IDFC FIRST Bank savings debit (UPI/transfer): "Your A/c XX0438 debited by Rs. 10,000.00 on 02/07/26; SOURAV KUMAR MAHANTY credited." */
const bankAccountDebit: Template = (body) => {
  const m = body.match(
    /A\/?c\.?\s*(?:no\.?\s*)?(\w+)\s+debited by Rs\.?\s*([\d,]+\.\d{2}) on (\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i,
  );
  if (!m) return null;
  const recipient = body.match(/;\s*([A-Z][A-Z\s]+?)\s+credited/i);
  return {
    type: 'expense',
    amount: parseAmount(m[2]),
    title: recipient ? titleCase(recipient[1]) : 'Bank transfer',
    paymentMethod: 'UPI',
    date: fromDdMmYy(m[3], m[4], m[5]),
    bank: guessBankName(body),
    raw: body,
  };
};

/** Bank credit (money received): "Your a/c no. XXXXXXXX1497 is credited by Rs.44600.00 on 04-07-26 by a/c linked to mobile ...-SOURAV KUM (IMPS Ref# ...)-SBI" */
const bankAccountCredit: Template = (body) => {
  const m = body.match(
    /a\/?c\.?\s*(?:no\.?\s*)?(\w+)\s+is credited by Rs\.?\s*([\d,]+\.\d{2}) on (\d{1,2})-(\d{1,2})-(\d{2,4})/i,
  );
  if (!m) return null;
  const sender = body.match(/-([A-Z][A-Z\s]+?)\s*\(/);
  return {
    type: 'income',
    amount: parseAmount(m[2]),
    title: sender ? titleCase(sender[1]) : 'Bank credit',
    paymentMethod: 'UPI',
    date: fromDdMmYy(m[3], m[4], m[5]),
    bank: guessBankName(body),
    raw: body,
  };
};

/** Generic fallback for banks without a dedicated template above — less precise (no merchant/counterparty), but still catches the amount and direction. */
const genericFallback: Template = (body) => {
  const spent = body.match(/(?:INR|Rs\.?)\s*([\d,]+\.?\d*)\s*spent/i);
  if (spent) {
    return {
      type: 'expense',
      amount: parseAmount(spent[1]),
      title: 'Card payment',
      paymentMethod: 'Card',
      date: new Date().toISOString().slice(0, 10),
      bank: guessBankName(body),
      raw: body,
    };
  }
  const debited = body.match(/debited by\s*(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
  if (debited) {
    return {
      type: 'expense',
      amount: parseAmount(debited[1]),
      title: 'Bank transfer',
      paymentMethod: 'UPI',
      date: new Date().toISOString().slice(0, 10),
      bank: guessBankName(body),
      raw: body,
    };
  }
  const credited = body.match(/credited by\s*(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
  if (credited) {
    return {
      type: 'income',
      amount: parseAmount(credited[1]),
      title: 'Bank credit',
      paymentMethod: 'UPI',
      date: new Date().toISOString().slice(0, 10),
      bank: guessBankName(body),
      raw: body,
    };
  }
  return null;
};

const TEMPLATES: Template[] = [idfcCreditCardSpend, bankAccountDebit, bankAccountCredit, genericFallback];

const KNOWN_BANKS = ['IDFC FIRST Bank', 'SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'Canara', 'Yes Bank'];

function guessBankName(body: string): string {
  const found = KNOWN_BANKS.find((bank) => body.toLowerCase().includes(bank.toLowerCase()));
  return found ?? 'Bank';
}

/**
 * Cheap pre-filter before running the full template chain — lets the native
 * SMS listener skip OTPs, promotions, and anything unrelated without paying
 * for regex matching on every single incoming message.
 */
export function looksLikeTransactionSms(body: string): boolean {
  return /\b(spent|debited|credited)\b/i.test(body) && /(INR|Rs\.?)\s*[\d,]/i.test(body);
}

/** Returns a parsed transaction, or null if no template recognizes this SMS. */
export function parseTransactionSms(body: string): ParsedTransaction | null {
  if (!looksLikeTransactionSms(body)) return null;
  for (const template of TEMPLATES) {
    const result = template(body);
    if (result) return result;
  }
  return null;
}
