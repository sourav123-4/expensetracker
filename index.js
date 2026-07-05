/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleNotificationEvent } from './src/services/quickAddNotification';

// Handles quick-add notification action taps while the app is killed/backgrounded
notifee.onBackgroundEvent(async (event) => {
  handleNotificationEvent(event);
});

AppRegistry.registerComponent(appName, () => App);
