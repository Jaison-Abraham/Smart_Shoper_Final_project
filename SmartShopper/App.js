import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
//Screens
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import GroceryListScreen from "./screens/GroceryListScreen";
import ExpenseTrackerScreen from "./screens/ExpenseTrackerScreen";
import GroupExpenseScreen from "./screens/GroupExpenseScreen";
import AddGroupExpenseScreen from "./screens/AddGroupExpenseScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import AddGroupScreen from "./screens/AddGroupScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Grocery"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Grocery") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Expenses") {
            iconName = focused ? "wallet" : "wallet-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Grocery" component={GroceryListScreen} />
      <Tab.Screen name="Expenses" component={ExpenseTrackerScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="GroupExpense" component={GroupExpenseScreen} />
        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
        <Stack.Screen
          name="AddGroupExpense"
          component={AddGroupExpenseScreen}
        />
        <Stack.Screen name="AddGroup" component={AddGroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
