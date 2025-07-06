import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CashFlowLineChart } from '../../components/charts/CashFlowLineChart';
import { PieDonutSwipeable } from '../../components/charts/PieDonutSwipeable';
import { CustomText } from '../../components/CustomText';
import { logout } from '../../lib/utils/auth';
import { Language, useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';

const ENTRY_TYPES = [
  { value: 'asset', icon: 'cube-outline', color: '#3b82f6' },
  { value: 'liability', icon: 'git-branch-outline', color: '#f59e42' },
  { value: 'equity', icon: 'people-outline', color: '#a855f7' },
];

export default function DonutTab() {
  const router = useRouter();
  const navigation = useNavigation();
  const { getTranslation, language, setLanguage, currency, setCurrency } = useLanguage();
  const { canAccessDonut, userRole, loading } = useRole();
  const chartRef = React.useRef<any>(null);
  const cashFlowChartRef = React.useRef<any>(null);

  // Redirect if user doesn't have access
  React.useEffect(() => {
    if (!loading && !canAccessDonut) {
      Alert.alert(
        getTranslation('accessDenied'),
        getTranslation('accessDeniedMessage'),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    }
  }, [canAccessDonut, loading]);

  // Refresh chart data when page is focused
  useFocusEffect(
    React.useCallback(() => {
      // Trigger chart data refresh by calling the component's refresh method if available
      if (chartRef.current && typeof chartRef.current.refresh === 'function') {
        chartRef.current.refresh();
      }
      if (cashFlowChartRef.current && typeof cashFlowChartRef.current.refresh === 'function') {
        cashFlowChartRef.current.refresh();
      }
    }, [])
  );

  React.useEffect(() => {
    navigation.setOptions({
      title: '',
      headerStyle: {
        backgroundColor: 'white',
        elevation: 0,         // Android
        shadowOpacity: 0,     // iOS
        borderBottomWidth: 0, // Optional (iOS) to remove line
      },
      headerTitleStyle: { color: 'black', fontWeight: 'bold' },
      headerTitleAlign: 'left',
      headerTintColor: 'black',
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginLeft: 15 }}>
          <Ionicons name="person-circle-outline" size={35} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          {['id', 'ms', 'en'].map((lang) => {
            const isSelected = language === lang;
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang as Language)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 4,
                  borderRadius: 6,
                  backgroundColor: isSelected ? 'black' : 'white',
                  borderWidth: 0,
                  borderColor: '#d4d4d8',
                }}
              >
                <CustomText
                  style={{
                    color: isSelected ? 'white' : 'black',
                    fontSize: 12,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {lang.toUpperCase()}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
      )
      
    });
  }, [navigation, language]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <CustomText>{getTranslation('loading')}</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  if (!canAccessDonut) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="lock-closed" size={64} color="#ef4444" />
          <CustomText className="text-xl font-bold text-red-600 mt-4">{getTranslation('accessDenied')}</CustomText>
          <CustomText className="text-center text-gray-600 mt-2">
            {getTranslation('accessDeniedMessage')}
          </CustomText>
          <TouchableOpacity 
            className="bg-black px-6 py-3 rounded-full mt-6"
            onPress={() => router.replace('/(tabs)')}
          >
            <CustomText className="text-white font-semibold">{getTranslation('goBack')}</CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      alert(getTranslation('errorLoginFailed'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 -mt-[25px]">
        <View className="p-4">

          {/* Cash Flow Line Chart Section */}
          <CashFlowLineChart ref={cashFlowChartRef} />

          {/* Donut Chart Section */}
          <PieDonutSwipeable ref={chartRef} />

          {/* ENTRY_TYPES Card List (only asset, liability, equity) */}
          <View className="bg-white rounded-2xl shadow-sm mb-[70px]">
            {ENTRY_TYPES.map((type, idx) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-row items-center px-4 py-4 ${idx !== ENTRY_TYPES.length - 1 ? 'border-b border-gray-100' : ''}`}
                onPress={() => router.push({ pathname: '/modals/entry-type-list', params: { type: type.value } })}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: type.color + '22' }}>
                  <Ionicons name={type.icon as any} size={26} color={type.color} />
                </View>
                <CustomText className="flex-1 text-base font-semibold text-gray-800">{getTranslation(type.value)}</CustomText>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 