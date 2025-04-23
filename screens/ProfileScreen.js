import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Switch, TouchableOpacity, StatusBar, ScrollView, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useReciter } from '../context/ReciterContext';
import { useUser } from '../context/UserContext';
import { getAuth, deleteUser } from 'firebase/auth';
import { useFonts, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';

const ProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { selectedReciter } = useReciter();
  const { user, isGuest, logout, setGuestMode } = useUser();
  const auth = getAuth();

  const PRIVACY_POLICY_URL = 'https://www.termsfeed.com/live/aa077d46-786f-4681-8390-b2e2ccf3a939';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            // No need to navigate as the AppNavigator will handle it
          }
        }
      ]
    );
  };

  const handleSignIn = async () => {
    // Disable guest mode with the updated function
    await setGuestMode(false);
    
    // Reset navigation to the root navigator which will show the Auth flow
    // because we just set isGuest to false
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              
              if (currentUser) {
                await deleteUser(currentUser);
                // Log out the user after account deletion
                handleLogout();
                Alert.alert('Success', 'Your account has been deleted successfully.');
              } else {
                Alert.alert('Error', 'No user is currently signed in.');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', `Failed to delete account: ${error.message}`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const openPrivacyPolicy = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_POLICY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        Alert.alert('Error', 'Cannot open the privacy policy. Please try again later.');
      }
    } catch (error) {
      console.error('Error opening privacy policy:', error);
      Alert.alert('Error', 'Could not open the privacy policy. Please try again later.');
    }
  };

  const showLanguageOptions = () => {
    Alert.alert(
      'Language Selection',
      'Please select a language:',
      [
        {
          text: 'English (Current)',
          onPress: () => console.log('English selected')
        },
        {
          text: 'Arabic (Coming Soon)',
          onPress: () => Alert.alert('Coming Soon', 'Arabic language support will be available in a future update.')
        },
        {
          text: 'Somali (Coming Soon)',
          onPress: () => Alert.alert('Coming Soon', 'Somali language support will be available in a future update.')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>Profile</Text>

        <View style={styles.content}>
          <View style={[styles.profileCard, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }]}>
            <View style={styles.profileImageContainer}>
              <View style={[styles.profileImage, { backgroundColor: theme.PRIMARY }]}>
                <MaterialCommunityIcons name="account" size={50} color={theme.WHITE} />
              </View>
            </View>
            <Text style={[styles.userName, { color: theme.TEXT_PRIMARY }]}>
              {isGuest ? 'Guest User' : (user?.displayName || 'User')}
            </Text>
            {!isGuest && user?.email && (
              <Text style={[styles.userEmail, { color: theme.TEXT_SECONDARY }]}>
                {user.email}
              </Text>
            )}
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }]}>
            <Text style={[styles.settingsTitle, { color: theme.TEXT_PRIMARY }]}>Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons 
                  name={isDarkMode ? "weather-night" : "weather-sunny"} 
                  size={24} 
                  color={theme.PRIMARY} 
                />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>
              <Switch
                trackColor={{ false: theme.DISABLED, true: theme.PRIMARY }}
                thumbColor={theme.WHITE}
                ios_backgroundColor={theme.DISABLED}
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
            </View>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={showLanguageOptions}
            >
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="translate" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Language</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('ReciterSettings')}
            >
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="microphone" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Quran Reciter</Text>
              </View>
              <View style={styles.settingValueContainer}>
                <Text style={[styles.settingValue, { color: theme.TEXT_SECONDARY }]}>
                  {selectedReciter.name.split(' ')[0]}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={openPrivacyPolicy}
            >
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="help-circle-outline" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Help & Support</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>

            {!isGuest && (
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleDeleteAccount}
              >
                <View style={styles.settingInfo}>
                  <MaterialCommunityIcons name="account-remove" size={24} color={theme.ERROR_LIGHT || '#ff6b6b'} />
                  <Text style={[styles.settingText, { color: theme.ERROR_LIGHT || '#ff6b6b' }]}>Delete Account</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.ERROR_LIGHT || '#ff6b6b'} />
              </TouchableOpacity>
            )}
          </View>

          {isGuest ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.PRIMARY }]}
              onPress={handleSignIn}
            >
              <MaterialCommunityIcons name="login" size={20} color={theme.WHITE} />
              <Text style={[styles.actionButtonText, { color: theme.WHITE }]}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }]}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={20} color={theme.TEXT_SECONDARY} />
                <Text style={[styles.logoutText, { color: theme.TEXT_SECONDARY }]}>Log Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'IBMPlexSans_700Bold',
    marginTop: StatusBar.currentHeight || 40,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 15,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  settingsCard: {
    borderRadius: 15,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    marginLeft: 15,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginRight: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
    marginLeft: 10,
  },
});

export default ProfileScreen; 