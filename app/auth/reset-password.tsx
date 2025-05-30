import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { authApi } from '@/utils/api';
import { router } from 'expo-router';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

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
      setError(error.message || 'Password reset failed. Please try again.');
      Alert.alert('Reset Error', error.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <Text style={styles.subtitle}>Enter your email and new password to reset your account</Text>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <Input 
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={COLORS.neutral[500]} />}
            error={error ? ' ' : undefined}
          />
          
          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError('');
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
            error={error ? ' ' : undefined}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError('');
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
            error={error ? ' ' : undefined}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f6ee',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.xs,
  },
  versionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[500],
    fontFamily: FONTS.regular,
  },
}); 