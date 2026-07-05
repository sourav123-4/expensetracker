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

/**
 * The Google Sign-In "Web client" OAuth ID — from Firebase Console →
 * Authentication → Sign-in method → Google (enabling it auto-creates this),
 * or Google Cloud Console → Credentials. This must be the SAME id the
 * backend verifies against (GOOGLE_WEB_CLIENT_ID) — using it here as
 * `webClientId` is what makes the native Sign-In SDK issue an ID token with
 * that audience, on both Android and iOS. Empty disables the Google button.
 */
export const GOOGLE_WEB_CLIENT_ID= '364838862855-h2uhtt5qehbjqb4kijhgk4u3k5kpvhfm.apps.googleusercontent.com';
