import { parseTransactionSms, looksLikeTransactionSms } from './smsParser';

describe('parseTransactionSms', () => {
  it('parses an IDFC FIRST Bank credit card spend', () => {
    const sms =
      'Transaction Successful! INR 100.00 spent on your IDFC FIRST Bank Credit Card ending XX8301 at MZOES3IUS on 05 JUL 2026 at 08:12 PM Avbl Limit: INR 104515.68 If not done by you, call 180010888 for dispute or to block your card SMS CCBLOCK 8301 to 5676732';

    expect(parseTransactionSms(sms)).toEqual({
      type: 'expense',
      amount: 100,
      title: 'Mzoes3ius',
      paymentMethod: 'Card',
      date: '2026-07-05',
      bank: 'IDFC FIRST Bank',
      raw: sms,
    });
  });

  it('parses a second IDFC credit card spend (different merchant)', () => {
    const sms =
      'Happy Shopping! INR 149.00 spent on your IDFC FIRST Bank Credit Card ending XX8301 at ZEPTOONLINE on 05 JUL 2026 at 05:50 PM Avbl Limit: INR 104615.68 If not done by you, call 180010888 for dispute or to block your card SMS CCBLOCK 8301 to 5676732';

    const result = parseTransactionSms(sms);
    expect(result?.type).toBe('expense');
    expect(result?.amount).toBe(149);
    expect(result?.title).toBe('Zeptoonline');
    expect(result?.paymentMethod).toBe('Card');
    expect(result?.date).toBe('2026-07-05');
  });

  it('parses an SBI account credit (IMPS)', () => {
    const sms =
      'Dear Customer, Your a/c no. XXXXXXXX1497 is credited by Rs.44600.00 on 04-07-26 by a/c linked to mobile 7XXXXXX135-SOURAV KUM (IMPS Ref# 618505797008)-SBI';

    const result = parseTransactionSms(sms);
    expect(result?.type).toBe('income');
    expect(result?.amount).toBe(44600);
    expect(result?.title).toBe('Sourav Kum');
    expect(result?.paymentMethod).toBe('UPI');
    expect(result?.date).toBe('2026-07-04');
    expect(result?.bank).toBe('SBI');
  });

  it('parses an IDFC FIRST Bank savings account debit', () => {
    const sms =
      'Your A/c XX0438 debited by Rs. 10,000.00 on 02/07/26; SOURAV KUMAR MAHANTY credited. RRN 918832269876. Available balance Rs. 4,297.37. Team IDFC FIRST Bank';

    const result = parseTransactionSms(sms);
    expect(result?.type).toBe('expense');
    expect(result?.amount).toBe(10000);
    expect(result?.title).toBe('Sourav Kumar Mahanty');
    expect(result?.paymentMethod).toBe('UPI');
    expect(result?.date).toBe('2026-07-02');
    expect(result?.bank).toBe('IDFC FIRST Bank');
  });

  it('ignores unrelated SMS (OTPs, promotions)', () => {
    expect(parseTransactionSms('Your OTP for login is 482913. Do not share it with anyone.')).toBeNull();
    expect(parseTransactionSms('Get 50% off on your next order! Use code SAVE50.')).toBeNull();
  });

  it('falls back to a generic match for an unrecognized bank format', () => {
    const sms = 'INR 250.00 spent using your HDFC Bank Debit Card at AMAZON on 01-07-26.';
    const result = parseTransactionSms(sms);
    expect(result?.type).toBe('expense');
    expect(result?.amount).toBe(250);
    expect(result?.bank).toBe('HDFC');
  });
});

describe('looksLikeTransactionSms', () => {
  it('accepts messages with a transaction keyword and an amount', () => {
    expect(looksLikeTransactionSms('INR 100.00 spent on your card')).toBe(true);
    expect(looksLikeTransactionSms('Your account is credited by Rs.500')).toBe(true);
  });

  it('rejects messages without both signals', () => {
    expect(looksLikeTransactionSms('Your OTP is 123456')).toBe(false);
    expect(looksLikeTransactionSms('spent time with family this weekend')).toBe(false);
  });
});
