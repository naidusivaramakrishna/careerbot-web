// AuthInput — labelled input with trailing icon or password toggle.
// TS port of POC src/components/AuthInput.js.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { authStyles } from '@/features/auth/styles';

export interface AuthInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  returnKeyType?: TextInputProps['returnKeyType'];
  textContentType?: TextInputProps['textContentType'];
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  returnKeyType,
  textContentType,
  icon,
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shouldShowPasswordToggle = Boolean(secureTextEntry);

  return (
    <View style={authStyles.inputGroup}>
      <Text style={authStyles.inputLabel}>{label}</Text>
      <View style={[authStyles.inputWrapper, error ? authStyles.inputError : null]}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8d98a7"
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={authStyles.input}
          textContentType={textContentType}
          value={value}
        />
        {shouldShowPasswordToggle ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={authStyles.passwordToggle}
          >
            <Ionicons
              color="#637083"
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
            />
          </Pressable>
        ) : icon ? (
          <Ionicons color="#9aa6b5" name={icon} size={20} style={authStyles.inputIcon} />
        ) : null}
      </View>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
