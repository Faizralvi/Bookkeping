import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

const plusIcon = `<?xml version="1.0" encoding="utf-8"?>
<svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 500 500" enable-background="new 0 0 500 500" xml:space="preserve">
<g>
	<path d="M306.6,143.4C291.5,128.3,271.4,120,250,120s-41.5,8.3-56.6,23.4c-31.2,31.2-31.2,81.9,0,113.1
		c15.1,15.1,35.2,23.4,56.6,23.4s41.5-8.3,56.6-23.4S330,221.4,330,200S321.7,158.5,306.6,143.4z M295.3,245.3
		C283.2,257.3,267.1,264,250,264s-33.2-6.7-45.3-18.7c-25-25-25-65.6,0-90.5c12.1-12.1,28.2-18.7,45.3-18.7
		c17.1,0,33.2,6.7,45.3,18.7c12.1,12.1,18.7,28.2,18.7,45.3S307.3,233.2,295.3,245.3z"/>
	<path d="M282,192h-24v-24c0-4.4-3.6-8-8-8s-8,3.6-8,8v24h-24c-4.4,0-8,3.6-8,8s3.6,8,8,8h24v24c0,4.4,3.6,8,8,8s8-3.6,8-8v-24h24
		c4.4,0,8-3.6,8-8S286.4,192,282,192z"/>
</g>
</svg>`;

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          title: 'Dashboard',
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
          tabBarIcon: ({ color }) => (
            <SvgXml
              xml={plusIcon}
              width={100}
              height={100}
              color={color}
              style={{
                position: 'absolute',
                bottom: 10,
                alignSelf: 'center',
              }}
            />
          ),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
          tabBarStyle: {
            display: 'none'
          }
        }}
      />
    </Tabs>
  );
}
