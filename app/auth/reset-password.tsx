import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react-native';
import { authApi } from '@/utils/api';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { validateEmail, validatePassword, validateRequired, ValidationError } from '@/utils/validation';

// Password requirement interface
interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    validator: (password) => password.length >= 8
  },
  {
    label: 'At least one uppercase letter',
    validator: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'At least one lowercase letter',
    validator: (password) => /[a-z]/.test(password)
  },
  {
    label: 'At least one number',
    validator: (password) => /[0-9]/.test(password)
  }
];

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!validateRequired(email)) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (!validateRequired(newPassword)) {
      newErrors.push({ field: 'newPassword', message: 'New password is required' });
    } else if (!validatePassword(newPassword)) {
      newErrors.push({ 
        field: 'newPassword', 
        message: 'Password does not meet all requirements' 
      });
    }

    if (!validateRequired(confirmPassword)) {
      newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (newPassword !== confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const response = await authApi.resetPassword(email, newPassword, confirmPassword);
      if (response.status === 'true') {
        Alert.alert('Success', 'Password reset successful. Please login with your new password.', [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]);
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      setErrors([{ field: 'general', message: error.message || 'Password reset failed. Please try again.' }]);
      Alert.alert('Reset Error', error.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const renderPasswordRequirements = () => {
    return (
      <View style={styles.passwordRequirements}>
        <Text style={[styles.requirementsTitle, { color: COLORS.neutral[600] }]}>
          Password Requirements:
        </Text>
        {PASSWORD_REQUIREMENTS.map((requirement, index) => {
          const isMet = requirement.validator(newPassword);
          return (
            <View key={index} style={styles.requirementItem}>
              {isMet ? (
                <CheckCircle2 size={16} color={COLORS.success.light} />
              ) : (
                <Circle size={16} color={COLORS.neutral[400]} />
              )}
              <Text style={[
                styles.requirementText,
                { color: isMet ? COLORS.success.light : COLORS.neutral[600] }
              ]}>
                {requirement.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <View>
              <Image 
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            {/* <Text style={styles.subtitle}>Enter your email and new password to reset your account</Text> */}
            
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
            />
            
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors(errors.filter(error => error.field !== 'newPassword'));
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
              error={getFieldError('newPassword')}
            />

            {renderPasswordRequirements()}

            <Input
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors(errors.filter(error => error.field !== 'confirmPassword'));
              }}
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Lock size={20} color={COLORS.neutral[500]} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={COLORS.neutral[500]} />
                  ) : (
                    <Eye size={20} color={COLORS.neutral[500]} />
                  )}
                </TouchableOpacity>
              }
              error={getFieldError('confirmPassword')}
            />
            
            <Button
              title="Reset Password"
              fullWidth
              loading={isLoading}
              onPress={handleResetPassword}
              style={styles.resetButton}
            />

            <Button
              title="Back to Login"
              variant="outlined"
              fullWidth
              onPress={() => router.back()}
              style={styles.backButton}
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
  logoImage: {
    width: 200,
    height: 200,
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
  resetButton: {
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.sm,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[600],
    fontFamily: FONTS.regular,
  },
  versionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[500],
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  passwordRequirements: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.neutral[100],
    borderRadius: BORDER_RADIUS.md,
  },
  requirementsTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  requirementText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
}); 