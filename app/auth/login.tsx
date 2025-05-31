import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, TextInput } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { validateEmail, validateRequired, ValidationError } from '@/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const passwordInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!validateRequired(email)) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (!validateRequired(password)) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      await login(email, password);
    } catch (error: any) {
      setErrors([{ field: 'general', message: error.message || 'Login failed. Please try again.' }]);
      Alert.alert('Login Error', error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            {/* <View style={styles.logoBackground}> */}
            <View>
              <Image 
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            {/* <Text style={styles.appName}>Veriphy</Text> */}
            {/* <Text style={styles.tagline}> Field Operations Management System</Text> */}
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue</Text>
            
            {errors.find(error => error.field === 'general') && (
              <Text style={styles.errorText}>{errors.find(error => error.field === 'general')?.message}</Text>
            )}
            
            <Input 
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors(errors.filter(error => error.field !== 'email'));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={COLORS.neutral[500]} />}
              error={getFieldError('email')}
              returnKeyType="next"
              onSubmitEditing={() => {
                passwordInputRef.current?.focus();
              }}
            />
            
            <Input
              ref={passwordInputRef}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(errors.filter(error => error.field !== 'password'));
              }}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={20} color={COLORS.neutral[500]} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.neutral[500]} />
                  ) : (
                    <Eye size={20} color={COLORS.neutral[500]} />
                  )}
                </TouchableOpacity>
              }
              error={getFieldError('password')}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => router.push('/auth/reset-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <Button
              title="Sign In"
              fullWidth
              loading={isLoading}
              onPress={handleLogin}
              style={styles.loginButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 Frog8. All rights reserved.</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f6ee',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 300,
    height: 300,
  },
  appName: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.neutral[900],
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[600],
    fontFamily: FONTS.regular,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: COLORS.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.neutral[900],
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[600],
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xl,
  },
  errorText: {
    color: COLORS.error.light,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary.light,
    fontFamily: FONTS.medium,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[600],
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  versionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[500],
    fontFamily: FONTS.regular,
  },
});