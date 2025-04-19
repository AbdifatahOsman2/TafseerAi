import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useReciter, RECITERS } from '../context/ReciterContext';
import * as Haptics from 'expo-haptics';

const ReciterSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { selectedReciter, changeReciter, isLoading } = useReciter();
  const [localLoading, setLocalLoading] = useState(false);

  const handleReciterSelect = async (reciter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalLoading(true);
    await changeReciter(reciter);
    setLocalLoading(false);
  };

  const renderReciterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.reciterItem,
        {
          backgroundColor: theme.SURFACE,
          borderColor: theme.BORDER,
        },
      ]}
      onPress={() => handleReciterSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.reciterInfo}>
        <Text style={[styles.reciterName, { color: theme.TEXT_PRIMARY }]}>
          {item.name}
        </Text>
        <Text style={[styles.reciterLanguage, { color: theme.TEXT_SECONDARY }]}>
          {item.language}
        </Text>
      </View>
      {selectedReciter.id === item.id && (
        <MaterialCommunityIcons
          name="check-circle"
          size={24}
          color={theme.PRIMARY}
        />
      )}
    </TouchableOpacity>
  );

  if (isLoading || localLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.BACKGROUND }]}>
        <ActivityIndicator size="large" color={theme.PRIMARY} />
        <Text style={[styles.loadingText, { color: theme.TEXT_SECONDARY }]}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.TEXT_PRIMARY}
          />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>
          Select Reciter
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <Text style={[styles.description, { color: theme.TEXT_SECONDARY }]}>
        Choose your preferred Quran reciter for audio playback
      </Text>

      <FlatList
        data={RECITERS}
        renderItem={renderReciterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reciterList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  description: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  reciterList: {
    padding: 16,
  },
  reciterItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 4,
  },
  reciterLanguage: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
});

export default ReciterSettingsScreen; 