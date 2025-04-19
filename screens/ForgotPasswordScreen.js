import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errors = {};
    
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    const auth = getAuth();
    
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Email Sent',
        'Password reset email has been sent. Please check your inbox.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      Alert.alert('Reset Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <Text style={[styles.title, { color: theme.TEXT_PRIMARY }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
              Enter your email to receive a password reset link
            </Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.TEXT_SECONDARY }]}>Email</Text>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.SURFACE,
                  borderColor: errors.email ? theme.ERROR : theme.BORDER
                }
              ]}>
                <MaterialCommunityIcons 
                  name="email-outline" 
                  size={20} 
                  color={theme.TEXT_SECONDARY} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.TEXT_PRIMARY }]}
                  placeholder="Your email"
                  placeholderTextColor={theme.TEXT_TERTIARY}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.ERROR }]}>
                  {errors.email}
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.PRIMARY }]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.WHITE} />
              ) : (
                <Text style={[styles.resetButtonText, { color: theme.WHITE }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.loginLinkText, { color: theme.TEXT_SECONDARY }]}>
                Remember your password? <Text style={{ color: theme.PRIMARY, fontFamily: 'IBMPlexSans_600SemiBold' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: StatusBar.currentHeight || 40,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'IBMPlexSans_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 4,
  },
  resetButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
});

export default ForgotPasswordScreen; 