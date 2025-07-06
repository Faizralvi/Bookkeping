import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../components/CustomText';
import { FloatingLabelInput } from '../components/forms/FloatingLabelInput';
import { register } from '../lib/utils/auth';
import { Language, useLanguage } from './contexts/LanguageContext';

const ROLES = [
  { label: 'Usahawan', value: 'usahawan' },
  { label: 'Akuntan', value: 'akuntan' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('usahawan');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getTranslation, language, setLanguage, currency, setCurrency } = useLanguage();

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', getTranslation('errorEmptyFields'));
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', getTranslation('errorPasswordMismatch'));
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', getTranslation('errorPasswordLength'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', getTranslation('errorInvalidEmail'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await register(name, email, password, role);
      if (result.success) {
        Alert.alert(getTranslation('successRegister'), getTranslation('successRegister'), [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]);
      } else {
        let errorMessage = result.error || getTranslation('errorRegisterFailed');
        if (errorMessage.includes('Duplicate email')) {
          errorMessage = getTranslation('errorInvalidEmail');
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      let errorMessage = getTranslation('errorRegisterFailed');
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('Duplicate email')) {
        errorMessage = getTranslation('errorInvalidEmail');
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 0 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={require('../assets/images/icon.png')}
              style={{ width: 96, height: 96, marginBottom: 16 }}
              resizeMode="contain"
            />
            <CustomText className="text-3xl font-bold text-center mb-2">{getTranslation('registerTitle')}</CustomText>
            <CustomText className="text-gray-600 text-center">{getTranslation('registerSubtitle')}</CustomText>
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
          {/* Register Form */}
          <View style={{ gap: 1, alignItems: 'stretch', width: 320, maxWidth: '100%' }}>
            {/* Name Input */}
            <FloatingLabelInput
              label={getTranslation('name')}
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
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
            {/* Confirm Password Input */}
            <FloatingLabelInput
              label={getTranslation('confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              togglePassword
            />
            {/* Role Selection */}
            <View>
              <CustomText className="text-gray-600 mb-1">{getTranslation('accountType')}</CustomText>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className={`flex-1 border rounded-[30px] py-3 ${role === 'usahawan' ? 'bg-[#232323] border-[#232323]' : 'bg-gray-50 border-gray-200'}`}
                  onPress={() => setRole('usahawan')}
                  disabled={isLoading}
                >
                  <CustomText className={`text-center font-medium ${role === 'usahawan' ? 'text-white' : 'text-gray-700'}`}>{getTranslation('entrepreneur')}</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 border rounded-[30px] py-3 ${role === 'akuntan' ? 'bg-[#232323] border-[#232323]' : 'bg-gray-50 border-gray-200'}`}
                  onPress={() => setRole('akuntan')}
                  disabled={isLoading}
                >
                  <CustomText className={`text-center font-medium ${role === 'akuntan' ? 'text-white' : 'text-gray-700'}`}>{getTranslation('accountant')}</CustomText>
                </TouchableOpacity>
              </View>
            </View>
            {/* Register Button */}
            <TouchableOpacity
              style={{ backgroundColor: '#232323', borderRadius: 30, paddingVertical: 16, marginTop: 24 }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <CustomText className="text-white text-center font-semibold text-base">
                  {getTranslation('registerButton')}
                </CustomText>
              )}
            </TouchableOpacity>
            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <CustomText className="text-gray-600">{getTranslation('alreadyHaveAccount')} </CustomText>
              <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
                <CustomText className="text-[#232323] font-semibold">{getTranslation('loginLink')}</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
} 