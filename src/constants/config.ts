/**
 * Dev API host: the iOS simulator can hit localhost directly; the Android
 * emulator maps the host machine to 10.0.2.2. Point this at your deployed
 * API for release builds.
 */
export const API_BASE_URL = 'https://expensetracker-backend-chi.vercel.app/api/v1';
// __DEV__
//   ? Platform.select({
//       ios: 'http://localhost:8000/api/v1',
//       android: 'http://10.0.2.2:8000/api/v1',
//       default: 'http://localhost:8000/api/v1',
//     })
//   : 
  


export const APP_NAME = 'ExpenseFlow';
export const DEFAULT_CURRENCY_SYMBOL = '₹';
