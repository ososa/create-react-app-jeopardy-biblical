import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AdminDashboard } from './AdminDashboard';
import { CategoriesScreen } from './CategoriesScreen';
import { QuestionsScreen } from './QuestionsScreen';
import { UsersScreen } from './UsersScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Categories: undefined;
  Questions: undefined;
  Users: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Questions" component={QuestionsScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
    </Stack.Navigator>
  );
};

export { AdminDashboard } from './AdminDashboard';
export { CategoriesScreen } from './CategoriesScreen';
export { QuestionsScreen } from './QuestionsScreen';
export { UsersScreen } from './UsersScreen';
