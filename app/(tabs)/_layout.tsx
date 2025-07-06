import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { CustomText } from '../../components/CustomText';
import { useRole } from '../contexts/RoleContext';

export default function TabLayout() {
  const { canAccessDonut, loading, userRole } = useRole();

  // Don't render tabs while loading user role
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#232323' }}>
        <CustomText style={{ color: 'white' }}>Loading...</CustomText>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#888888',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#232323',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 100,
          position: 'absolute',
          bottom: 0,
          left: 16,
          right: 16,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 10,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'summary',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={26} color={color} />
          ),
          headerStyle: { backgroundColor: '#232323' },
          headerTitleStyle: { color: 'white', fontWeight: 'bold' },
          headerTitleAlign: 'center',
          headerTintColor: 'white',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Platform.OS === 'ios' ? 30 : 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}>
              <Ionicons name="add" size={36} color="#232323" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="donut"
        options={{
          title: 'Cashflow',
          tabBarIcon: ({ color }) => (
            <Ionicons name="pie-chart-outline" size={26} color={color} />
          ),
          headerStyle: { backgroundColor: '#232323' },
          headerTitleStyle: { color: 'white', fontWeight: 'bold' },
          headerTitleAlign: 'center',
          headerTintColor: 'white',
        }}
      />
    </Tabs>
  );
}
