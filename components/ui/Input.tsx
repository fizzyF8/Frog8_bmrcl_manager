import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, FONT_SIZES } from '@/constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';
import { useTheme } from '@/context/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperText?: string;
  onFocus?: (e: any) => void;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperText,
  secureTextEntry,
  onFocus,
  ...props
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { theme } = useTheme();

  const togglePasswordVisibility = () => {
    haptics.selection();
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleFocus = (e: any) => {
    haptics.light();
    onFocus?.(e);
  };

  const renderPasswordIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconContainer}>
          {isPasswordVisible ? (
            <EyeOff size={20} color={COLORS.neutral[500]} />
          ) : (
            <Eye size={20} color={COLORS.neutral[500]} />
          )}
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { borderColor: theme.border, backgroundColor: theme.card },
          error ? { borderColor: theme.error } : null,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: theme.text },
            leftIcon ? { paddingLeft: 0 } : null,
            (rightIcon || secureTextEntry) ? { paddingRight: 0 } : null,
            inputStyle,
          ]}
          placeholderTextColor={theme.secondaryText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          {...props}
        />
        {renderPasswordIcon() || (rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>)}
      </View>
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            error ? { color: theme.error } : { color: theme.secondaryText },
            errorStyle,
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[700],
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[900],
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  inputError: {
    borderColor: COLORS.error.light,
  },
  iconContainer: {
    paddingHorizontal: SPACING.sm,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[500],
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error.light,
  },
});

export default Input;