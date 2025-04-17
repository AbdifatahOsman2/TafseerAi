import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>TafseerAI</Text>
        
        <View style={styles.content}>
          <View style={[styles.card, { 
            backgroundColor: theme.SURFACE, 
            borderColor: theme.BORDER,
            shadowColor: theme.SHADOW
          }]}>
            <Text style={[styles.title, { color: theme.TEXT_PRIMARY }]}>Home</Text>
            <Text style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>Welcome to TafseerAI</Text>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
});

export default HomeScreen; 