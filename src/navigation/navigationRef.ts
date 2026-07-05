import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/** Lets non-screen code (the SMS auto-detect bridge) navigate without a screen's own `navigation` prop. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
