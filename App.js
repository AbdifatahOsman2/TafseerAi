import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, IBMPlexSans_100Thin, IBMPlexSans_200ExtraLight, IBMPlexSans_300Light, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';

// Import Firebase configuration
import { app } from './config/firebase';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import TafseerScreen from './screens/TafseerScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import Theme Provider
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Main app component that uses theme
const MainApp = () => {
  const { theme, isDarkMode } = useTheme();
  const [hideTabBar, setHideTabBar] = useState(false);
  
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
          tabBarStyle: {
            backgroundColor: theme.SURFACE,
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 65,
            paddingBottom: 5,
            paddingTop: 0,
            shadowColor: theme.SHADOW,
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 10,
            borderWidth: 0,
            display: 'flex',
          },
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 5,
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
          component={ExploreScreen}
          options={{
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
            )
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
