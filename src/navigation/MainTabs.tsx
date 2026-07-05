import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, ListIcon, SettingsIcon, WalletIcon } from '../components/icons';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { useTheme } from '../theme/ThemeProvider';
import { ExpensesStack } from './ExpensesStack';
import { IncomeStack } from './IncomeStack';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Slide only, no opacity fade. The built-in "shift" preset fades opacity
 * alongside the slide, but Android elevation shadows don't fade with a
 * view's opacity — they briefly render as a solid dark smudge instead of
 * softening, which read as a stray shadow flashing during the tab switch.
 */
function shiftNoFade({ current }: { current: { progress: Animated.AnimatedInterpolation<number> } }) {
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-50, 0, 50],
          }),
        },
      ],
    },
  };
}

/** No opacity fade or ripple on press — just the icon/label color change already handled by the tab bar. */
function TabBarButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      android_ripple={null}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function MainTabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // Extra breathing room below the icons/labels, on top of the safe-area
  // inset — devices without a home indicator (Android nav bar, older iPhones)
  // still get a comfortable minimum.
  const bottomPadding = Math.max(insets.bottom, 12) + 18;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Animate tab switches: the incoming screen shifts in horizontally
        // from the side of the tab you pressed, instead of an instant swap.
        animation: 'shift',
        sceneStyleInterpolator: shiftNoFade,
        tabBarActiveTintColor: theme.colors.brandPrimary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: Platform.OS === 'android' ? 4 : 0 },
        tabBarItemStyle: { paddingTop: 8 },
        tabBarButton: TabBarButton,
        tabBarStyle: {
          backgroundColor: theme.colors.bgSurface,
          borderTopColor: theme.colors.borderHairline,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesStack}
        options={{
          title: 'Expenses',
          tabBarAccessibilityLabel: 'Expenses',
          tabBarIcon: ({ color, size }) => <ListIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="IncomeTab"
        component={IncomeStack}
        options={{
          title: 'Income',
          tabBarAccessibilityLabel: 'Income',
          tabBarIcon: ({ color, size }) => <WalletIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
