import React, { useState, useRef, useEffect, RefObject } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';

const RESEND_COOLDOWN = 30; // seconds

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  autoFocus?: boolean;
}

function OtpInput({ value, onChange, length = 6, autoFocus = true }: OtpInputProps) {
  const inputs = useRef<Array<RefObject<TextInput | null>>>(
    Array.from({ length }, () => React.createRef<TextInput>())
  );
  const { theme } = useTheme();

  const handleChange = (text: string, idx: number) => {
    if (/^\d*$/.test(text)) {
      let newValueArr = value.split('');
      newValueArr[idx] = text[text.length - 1] || '';
      const newValue = newValueArr.join('').slice(0, length);
      onChange(newValue);
      if (text && idx < length - 1) {
        inputs.current[idx + 1]?.current?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.current?.focus();
    }
  };

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.current?.focus();
  }, [autoFocus]);

  return (
    <View style={styles.otpContainer}>
      {Array.from({ length }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={inputs.current[idx]}
          style={[styles.otpInput, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
          keyboardType="number-pad"
          maxLength={1}
          value={value[idx] || ''}
          onChangeText={text => handleChange(text, idx)}
          onKeyPress={e => handleKeyPress(e, idx)}
          autoFocus={autoFocus && idx === 0}
          textContentType="oneTimeCode"
          importantForAutofill="yes"
          selectionColor={theme.primary}
        />
      ))}
    </View>
  );
}

export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (data.status) {
        Alert.alert('Success', 'Email verified successfully!', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('https://demo.ctrmv.com/veriphy/public/api/v1/email/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.status) {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        setCooldown(RESEND_COOLDOWN);
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Enter the 6-digit code sent to your email</Text>
        <OtpInput value={code} onChange={setCode} length={6} />
        {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}
        <Button
          title="Verify"
          fullWidth
          loading={isLoading}
          onPress={handleVerify}
          style={styles.verifyButton}
        />
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResend}
          disabled={cooldown > 0 || isLoading}
        >
          <Text style={{ color: cooldown > 0 ? theme.secondaryText : theme.primary }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.alreadyContainer} onPress={() => setCode('')}>
          <Text style={{ color: theme.primary }}>Already have a code?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    width: '100%',
  },
  otpInput: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.xl,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  verifyButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resendContainer: {
    marginBottom: SPACING.sm,
  },
  alreadyContainer: {
    marginTop: SPACING.xs,
  },
}); 