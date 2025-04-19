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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { login } = useUser();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errors = {};
    
    if (!name) errors.name = 'Name is required';
    
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    const auth = getAuth();
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with name
      await updateProfile(user, {
        displayName: name
      });
      
      // Update user context with user data
      login({
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL
      });
      
      // Navigation is handled by the auth state listener in UserContext
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try logging in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }
      
      Alert.alert('Registration Error', errorMessage);
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
              Join TafseerAI and explore the Quran
            </Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.TEXT_SECONDARY }]}>Name</Text>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.SURFACE,
                  borderColor: errors.name ? theme.ERROR : theme.BORDER
                }
              ]}>
                <MaterialCommunityIcons 
                  name="account-outline" 
                  size={20} 
                  color={theme.TEXT_SECONDARY} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.TEXT_PRIMARY }]}
                  placeholder="Your name"
                  placeholderTextColor={theme.TEXT_TERTIARY}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {errors.name && (
                <Text style={[styles.errorText, { color: theme.ERROR }]}>
                  {errors.name}
                </Text>
              )}
            </View>
            
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
                  placeholder="Choose a password"
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
              style={[styles.registerButton, { backgroundColor: theme.PRIMARY }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.WHITE} />
              ) : (
                <Text style={[styles.registerButtonText, { color: theme.WHITE }]}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.TEXT_SECONDARY }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: theme.PRIMARY }]}>
                  {' Sign In'}
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
    padding: 20,
  },
  header: {
    marginTop: StatusBar.currentHeight || 40,
    marginBottom: 30,
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
    marginBottom: 20,
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
  visibilityIcon: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 4,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
});

export default RegisterScreen; 