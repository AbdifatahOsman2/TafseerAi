import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, IBMPlexSans_100Thin, IBMPlexSans_200ExtraLight, IBMPlexSans_300Light, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';

// Import Firebase configuration
import { app } from './config/firebase';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import TafseerScreen from './screens/TafseerScreen';
import ProfileScreen from './screens/ProfileScreen';
import SurahDetailScreen from './screens/SurahDetailScreen';

// Import Theme Provider
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// Create tab screens with stack navigation
const ExploreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      <Stack.Screen name="SurahDetail" component={SurahDetailScreen} />
    </Stack.Navigator>
  );
};

// Main app component that uses theme
const MainApp = () => {
  const { theme, isDarkMode } = useTheme();
  const [hideTabBar, setHideTabBar] = useState(false);
  
  // Define the default tab bar style to reuse everywhere
  const defaultTabBarStyle = {
    backgroundColor: theme.SURFACE,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingBottom: 5,
    paddingTop: 5,
    shadowColor: theme.SHADOW,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0,
    shadowRadius: 3,
    elevation: 10,
    borderWidth: 0,
    display: 'flex',
  };
  
  // Load IBM Plex Sans font
  const [fontsLoaded] = useFonts({
    IBMPlexSans_100Thin,
    IBMPlexSans_200ExtraLight, 
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.BACKGROUND }]}>
        <Text style={[styles.loadingText, { color: theme.TEXT_PRIMARY }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let icon;
            
            // More modern icon selection with custom rendering
            if (route.name === 'Home') {
              icon = (
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={focused ? 'home' : 'home-outline'} 
                    size={30} 
                    color={color} 
                  />
                </View>
              );
            } else if (route.name === 'Explore') {
              icon = (
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={focused ? 'compass' : 'compass-outline'} 
                    size={30} 
                    color={color} 
                  />
                </View>
              );
            } else if (route.name === 'Tafseer') {
              icon = (
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={focused ? 'book-open-variant' : 'book-open-outline'} 
                    size={30} 
                    color={color} 
                  />
                </View>
              );
            } else if (route.name === 'Profile') {
              icon = (
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name={focused ? 'account' : 'account-outline'} 
                    size={30} 
                    color={color} 
                  />
                </View>
              );
            }
            
            return icon;
          },
          tabBarActiveTintColor: theme.PRIMARY,
          tabBarInactiveTintColor: theme.TEXT_SECONDARY,
          tabBarStyle: defaultTabBarStyle,
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 20,
            height: 65,
          },
          tabBarLabelStyle: {
            fontFamily: 'IBMPlexSans_500Medium',
            fontSize: 12,
            marginTop: -2,
            marginBottom: 5,
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[
                styles.tabBarLabel, 
                { 
                  color: focused ? theme.PRIMARY : theme.TEXT_SECONDARY,
                  fontFamily: focused ? 'IBMPlexSans_600SemiBold' : 'IBMPlexSans_400Regular'
                }
              ]}>
                Home
              </Text>
            )
          }}
        />
        <Tab.Screen 
          name="Explore" 
          component={ExploreStack}
          options={({ route }) => {
            // Get the active route name in the ExploreStack
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ExploreMain';
            
            return {
              tabBarLabel: ({ focused, color }) => (
                <Text style={[
                  styles.tabBarLabel, 
                  { 
                    color: focused ? theme.PRIMARY : theme.TEXT_SECONDARY,
                    fontFamily: focused ? 'IBMPlexSans_600SemiBold' : 'IBMPlexSans_400Regular'
                  }
                ]}>
                  Explore
                </Text>
              ),
              // Only override display property when needed
              tabBarStyle: {
                ...defaultTabBarStyle,
                display: routeName === 'SurahDetail' ? 'none' : 'flex',
              }
            };
          }}
        />
        <Tab.Screen 
          name="Tafseer" 
          component={TafseerScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[
                styles.tabBarLabel, 
                { 
                  color: focused ? theme.PRIMARY : theme.TEXT_SECONDARY,
                  fontFamily: focused ? 'IBMPlexSans_600SemiBold' : 'IBMPlexSans_400Regular'
                }
              ]}>
                Tafseer
              </Text>
            )
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[
                styles.tabBarLabel, 
                { 
                  color: focused ? theme.PRIMARY : theme.TEXT_SECONDARY,
                  fontFamily: focused ? 'IBMPlexSans_600SemiBold' : 'IBMPlexSans_400Regular'
                }
              ]}>
                Profile
              </Text>
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// Wrapper component that provides theme context
export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 18,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 11,
    textAlign: 'center',
  }
});
