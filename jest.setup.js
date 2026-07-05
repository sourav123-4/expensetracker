import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

// react-native-reanimated 4 / react-native-worklets ship no Jest mock yet for
// this version pairing — a minimal manual mock covers what this app actually
// uses (shared values, animated styles/components, the withX helpers).
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (fn) => fn(),
    withTiming: (toValue, _config, callback) => {
      callback?.(true);
      return toValue;
    },
    withSpring: (toValue, _config, callback) => {
      callback?.(true);
      return toValue;
    },
    withRepeat: (toValue) => toValue,
  };
});

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key) => store.get(key),
      getBoolean: (key) => store.get(key),
      set: (key, value) => store.set(key, value),
      remove: (key) => store.delete(key),
    }),
  };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue('channel'),
    displayNotification: jest.fn().mockResolvedValue('id'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent: jest.fn().mockReturnValue(() => {}),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: { LOW: 2, HIGH: 4 },
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1 },
  EventType: { PRESS: 1, ACTION_PRESS: 2 },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => {
    throw new Error('Firebase not configured in tests');
  }),
  getToken: jest.fn(),
  onMessage: jest.fn(),
  onTokenRefresh: jest.fn(),
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => {
    throw new Error('Firebase not configured in tests');
  }),
  signInWithPhoneNumber: jest.fn(),
}));

jest.mock('react-native-biometrics', () =>
  jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  })),
);

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  isErrorWithCode: jest.fn().mockReturnValue(false),
  isSuccessResponse: jest.fn().mockReturnValue(false),
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));
