import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Switch, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

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
            <Text style={[styles.userName, { color: theme.TEXT_PRIMARY }]}>User Name</Text>
            <Text style={[styles.userEmail, { color: theme.TEXT_SECONDARY }]}>user@example.com</Text>
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

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="translate" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Language</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="bell-outline" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Notifications</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="help-circle-outline" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Help & Support</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }]}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.TEXT_SECONDARY} />
            <Text style={[styles.logoutText, { color: theme.TEXT_SECONDARY }]}>Log Out</Text>
          </TouchableOpacity>
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