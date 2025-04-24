import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { CommonActions } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { setGuestMode } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const onboardingData = [
    {
      id: '1',
      title: 'Discover the Depths of the Quran',
      description: 'Explore Surahs, listen to recitations, and unlock AI-powered Tafseer grounded in classical scholarship.',
      image: require('../assets/onboarding/quran.png')
    },
    {
      id: '2',
      title: 'Browse Surahs & Listen',
      description: 'Navigate all 114 Surahs, read translations, and play high-quality recitations.',
      image: require('../assets/onboarding/chat.png')
    },
    {
      id: '3',
      title: 'Ask & Learn',
      description: 'Tap any Ayah to ask questions and receive clear, classical Tafseer explanations.',
      image: require('../assets/onboarding/audiowave.png')
    }
  ];

  const completeOnboarding = async (asGuest = false) => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Set guest mode based on user choice
      await setGuestMode(asGuest);
      
      // Reset navigation to the appropriate screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'Main',
              state: {
                routes: [
                  {
                    name: asGuest ? 'MainApp' : 'Auth',
                    state: asGuest ? {
                      routes: [{ name: 'Home' }]
                    } : {
                      routes: [{ name: 'Login' }]
                    }
                  }
                ]
              }
            },
          ],
        })
      );
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Fallback navigation if the complex reset fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.slide}>
        {/* Top Section - 20% height */}
        <View style={styles.topSection} />

        {/* Middle Section - 50% height */}
        <View style={styles.middleSection}>
          <View style={styles.imageContainer}>
            <Image 
              source={item.image} 
              style={styles.image} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* Bottom Section - 30% height */}
        <View style={styles.bottomSection}>
          {index < onboardingData.length - 1 ? (
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]} 
              onPress={handleNext}
            >
              <Text style={styles.buttonTextPrimary}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.finalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]} 
                onPress={() => completeOnboarding(true)}
              >
                <Text style={styles.buttonTextSecondary}>Continue as Guest</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]} 
                onPress={() => completeOnboarding(false)}
              >
                <Text style={styles.buttonTextPrimary}>Sign in</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {onboardingData.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.paginationDot,
                  { backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' }
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: '#384766' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#384766' }]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSection: {
    height: height * 0.15,
  },
  middleSection: {
    height: height * 0.55,
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  bottomSection: {
    height: height * 0.3,
    width,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: 'IBMPlexSans_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  paginationContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  buttonTextPrimary: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 17,
    color: '#384766',
  },
  buttonTextSecondary: {
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  finalButtons: {
    width: '100%',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  }
});

export default OnboardingScreen; 