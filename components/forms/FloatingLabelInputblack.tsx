import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  togglePassword?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  togglePassword = false,
  style,
  inputStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    Animated.timing(animatedBorder, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#232323'],
  });

  const labelStyle = {
    position: 'absolute' as const,
    left: 22,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 13],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#b0b0b0', '#fff'],
    }),
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 4,
    zIndex: 2,
  };

  return (
    <Animated.View style={[styles.inputContainer, style, { borderColor }]}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[styles.textInput, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={togglePassword ? !showPassword : secureTextEntry}
        {...rest}
      />
      {togglePassword && (
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setShowPassword((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#6B7280"
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 14,
    paddingBottom: 2,
    minHeight: 52,
    marginBottom: 18,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 44, // space for eye icon
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  icon: {
    position: 'absolute',
    right: 18,
    top: 16,
  },
}); 