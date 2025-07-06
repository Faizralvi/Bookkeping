import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../components/CustomText';
import { FloatingLabelInput } from '../components/forms/FloatingLabelInput';
import { login } from '../lib/utils/auth';
import { Language, useLanguage } from './contexts/LanguageContext';
import { useRole } from './contexts/RoleContext';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getTranslation, language, setLanguage, currency, setCurrency } = useLanguage();
  const { refreshUserRole } = useRole();

  // Test Alert when component mounts
  useEffect(() => {
    // Remove test alert, or replace with translated alert if needed
    // Alert.alert(getTranslation('test'), getTranslation('alertTest'));
  }, []);

  const validateForm = () => {
    console.log('Validating form with:', { email, password });
    
    if (!email || !password) {
      console.log('Form validation failed: empty fields');
      Alert.alert('Error', getTranslation('errorEmptyFields'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Form validation failed: invalid email format');
      Alert.alert('Error', getTranslation('errorInvalidEmail'));
      return false;
    }

    console.log('Form validation passed');
    return true;
  };

  const handleLogin = async () => {
    console.log('Login button pressed');
    if (!validateForm()) {
      console.log('Login cancelled due to validation failure');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        console.log('TOKEN:', result.token);
        await refreshUserRole();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', getTranslation('errorLoginFailed'));
      }
    } catch (error) {
      Alert.alert('Error', getTranslation('errorLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 0 }}>
          {/* Logo and Title */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={require('../assets/images/icon.png')}
              style={{ width: 96, height: 96, marginBottom: 16 }}
              resizeMode="contain"
            />
            <CustomText className="text-3xl font-bold text-center mb-2">{getTranslation('loginTitle')}</CustomText>
            <CustomText className="text-gray-600 text-center">{getTranslation('loginSubtitle')}</CustomText>
            {/* Language & Currency Switcher */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: 8, gap: 12 }}>
              {/* Language Switcher */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['id', 'ms', 'en'].map(lng => (
                  <TouchableOpacity
                    key={lng}
                    onPress={() => setLanguage(lng as Language)}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: language === lng ? '#232323' : '#fff',
                      minHeight: 38,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.07,
                      shadowRadius: 4,
                      elevation: language === lng ? 2 : 1,
                      borderWidth: language === lng ? 0 : 1,
                      borderColor: '#e5e7eb',
                    }}
                    activeOpacity={0.85}
                  >
                    <CustomText style={{
                      color: language === lng ? '#fff' : '#232323',
                      fontWeight: language === lng ? 'bold' : 'normal',
                      fontSize: 13,
                    }}>
                      {lng.toUpperCase()}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Login Form */}
          <View style={{ gap: 1, alignItems: 'stretch', width: 320, maxWidth: '100%' }}>
            {/* Email Input */}
            <FloatingLabelInput
              label={getTranslation('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* Password Input */}
            <FloatingLabelInput
              label={getTranslation('password')}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              togglePassword
            />

            {/* Login Button */}
            <TouchableOpacity
              style={{ backgroundColor: '#232323', borderRadius: 30, paddingVertical: 16, marginTop: 24 }}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <CustomText className="text-white text-center font-semibold text-base">
                  {getTranslation('loginButton')}
                </CustomText>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <CustomText className="text-gray-600">{getTranslation('dontHaveAccount')} </CustomText>
              <TouchableOpacity 
                onPress={() => router.push('/register')} 
                disabled={isLoading}
              >
                <CustomText className="text-[#232323] font-semibold">{getTranslation('registerLink')}</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
} 