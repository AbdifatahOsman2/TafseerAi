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
  Alert,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { auth } from '../config/firebase';

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { login, setGuestMode } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errors = {};
    
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user context with user data
      login({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL
      });
      
      // Navigation is handled by the auth state listener in UserContext
    } catch (error) {
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      // Enable guest mode in the user context (now async)
      await setGuestMode(true);
      
      // Explicitly navigate to MainApp
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to continue as guest. Please try again.'
      );
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
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/quran-image.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: theme.TEXT_PRIMARY }]}>
              Welcome to TafseerAI
            </Text>
            <Text style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
              Sign in to explore the Quran
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
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.TEXT_SECONDARY }]}>Password</Text>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.SURFACE,
                  borderColor: errors.password ? theme.ERROR : theme.BORDER
                }
              ]}>
                <MaterialCommunityIcons 
                  name="lock-outline" 
                  size={20} 
                  color={theme.TEXT_SECONDARY} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.TEXT_PRIMARY }]}
                  placeholder="Your password"
                  placeholderTextColor={theme.TEXT_TERTIARY}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.visibilityIcon}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={theme.TEXT_SECONDARY} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { color: theme.ERROR }]}>
                  {errors.password}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPassword, { color: theme.PRIMARY }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.PRIMARY }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.WHITE} />
                ) : (
                  <Text style={[styles.loginButtonText, { color: theme.WHITE }]}>
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.guestButton, { 
                  backgroundColor: theme.SURFACE,
                  borderColor: theme.BORDER
                }]}
                onPress={handleContinueAsGuest}
                disabled={isLoading}
              >
                <Text style={[styles.guestButtonText, { color: theme.TEXT_SECONDARY }]}>
                  Continue as Guest
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: theme.TEXT_SECONDARY }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLink, { color: theme.PRIMARY }]}>
                  {' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
  },
  header: {
    marginTop: StatusBar.currentHeight || 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontFamily: 'IBMPlexSans_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 28,
    width: '85%',
  },
  label: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 10,
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 16,
    paddingVertical: 8,
  },
  visibilityIcon: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 8,
  },
  forgotPasswordContainer: {
    width: '85%',
    alignItems: 'flex-end',
    marginBottom: 36,
  },
  forgotPassword: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    paddingVertical: 4,
  },
  buttonContainer: {
    width: '85%',
    marginBottom: 40,
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  guestButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  guestButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
});

export default LoginScreen; 