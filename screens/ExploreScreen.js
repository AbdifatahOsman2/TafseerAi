import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { createStackNavigator } from '@react-navigation/stack';
import SurahDetailScreen from './SurahDetailScreen';

const { width } = Dimensions.get('window');
const Stack = createStackNavigator();

// Surah List Component
const SurahListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all surahs list on component mount
  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      if (data.code === 200) {
        setSurahs(data.data);
      } else {
        console.error('Error fetching surahs:', data);
      }
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahPress = (surah) => {
    navigation.navigate('SurahDetail', { surahNumber: surah.number, surah });
  };

  const renderSurahCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.surahCard, {
        backgroundColor: theme.SURFACE,
        borderColor: theme.BORDER,
        shadowColor: theme.SHADOW
      }]}
      onPress={() => handleSurahPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.surahNumberCircle, { backgroundColor: theme.PRIMARY }]}>
        <Text style={[styles.surahNumber, { color: theme.WHITE }]}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={[styles.arabicName, { color: theme.TEXT_PRIMARY }]}>{item.name}</Text>
        <Text style={[styles.englishName, { color: theme.TEXT_SECONDARY }]}>{item.englishName}</Text>
        <Text style={[styles.ayahCount, { color: theme.TEXT_SECONDARY }]}>{item.numberOfAyahs} Ayahs</Text>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={theme.PRIMARY} 
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.BACKGROUND }]}>
        <ActivityIndicator size="large" color={theme.PRIMARY} />
        <Text style={[styles.loadingText, { color: theme.TEXT_SECONDARY }]}>Loading Surahs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />

      <FlatList
        data={surahs}
        renderItem={renderSurahCard}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={[styles.surahList, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>Explore Quran</Text>
        )}
      />
    </SafeAreaView>
  );
};

// Main Navigator Component
const ExploreScreen = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="SurahList" component={SurahListScreen} />
      <Stack.Screen 
        name="SurahDetail" 
        component={SurahDetailScreen}
        options={{
          tabBarVisible: false
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
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
  screenTitle: {
    fontSize: 24,
    fontFamily: 'IBMPlexSans_700Bold',
    marginTop: StatusBar.currentHeight || 40,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  contentContainer: {
    flex: 1,
  },
  surahList: {
    padding: 16,
  },
  surahCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  surahNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  surahNumber: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  surahInfo: {
    flex: 1,
  },
  arabicName: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 4,
  },
  englishName: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 2,
  },
  ayahCount: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
  },
});

export default ExploreScreen; 