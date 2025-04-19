import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Switch, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useReciter } from '../context/ReciterContext';

const ProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { selectedReciter } = useReciter();

  // ... existing code ...

            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ReciterSettings')}>
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
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons name="bell-outline" size={24} color={theme.PRIMARY} />
                <Text style={[styles.settingText, { color: theme.TEXT_PRIMARY }]}>Notifications</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>
           
// ... existing code ...

const styles = StyleSheet.create({
  // ... existing styles ...
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginRight: 5,
  },
  // ... existing styles ...
}); 