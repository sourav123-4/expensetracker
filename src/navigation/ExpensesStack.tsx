import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ExpenseDetailScreen } from '../features/expenses/screens/ExpenseDetailScreen';
import { ExpenseListScreen } from '../features/expenses/screens/ExpenseListScreen';
import { ExpensesStackParamList } from './types';

const Stack = createNativeStackNavigator<ExpensesStackParamList>();

// Add/Edit (ExpenseForm) lives at the navigation root as a global modal — see
// RootNavigator — so it always returns to whichever screen opened it, rather
// than stranding the user on the Expenses tab.
export function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
    </Stack.Navigator>
  );
}
