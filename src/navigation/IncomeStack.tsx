import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { IncomeListScreen } from '../features/income/screens/IncomeListScreen';
import { IncomeStackParamList } from './types';

const Stack = createNativeStackNavigator<IncomeStackParamList>();

// Add/Edit (IncomeForm) lives at the navigation root as a global modal — see
// RootNavigator — so it always returns to whichever screen opened it.
export function IncomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IncomeList" component={IncomeListScreen} />
    </Stack.Navigator>
  );
}
