import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../components/CustomText';
import { FloatingLabelInput } from '../components/forms/FloatingLabelInputblack';
import { userAPI } from '../lib/utils/api';
import { logout } from '../lib/utils/auth';
import { useLanguage } from './contexts/LanguageContext';
import { useRole } from './contexts/RoleContext';

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { getTranslation, language, setLanguage, currency, setCurrency } = useLanguage();
  const { isAkuntan, isUsahawan, canAccessDonut, canAccessAsset, canAccessLiability, canAccessEquity, resetUserRole } = useRole();

  // Set header options
  React.useEffect(() => {
    navigation.setOptions({
      title: 'Profile',
      headerStyle: {
        backgroundColor: '#232323',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTitleStyle: { color: 'white', fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerTintColor: 'white',
    });
  }, [navigation]);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  
  // Edit profile form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      if (response && response.data) {
        setProfile(response.data);
        setEditName(response.data.name);
        setEditEmail(response.data.email);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || getTranslation('failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      getTranslation('logout'),
      getTranslation('logoutConfirm'),
      [
        { text: getTranslation('cancel'), style: 'cancel' },
        {
          text: getTranslation('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            resetUserRole();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', getTranslation('nameRequired'));
      return;
    }

    try {
      setUpdating(true);
      await userAPI.updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      });
      
      Alert.alert('Success', getTranslation('profileUpdated'));
      setShowEditModal(false);
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      Alert.alert('Error', error.message || getTranslation('failedToUpdateProfile'));
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', getTranslation('allPasswordFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', getTranslation('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', getTranslation('passwordMinLength'));
      return;
    }

    try {
      setUpdating(true);
      await userAPI.updateProfile({
        currentPassword,
        newPassword,
      });
      
      Alert.alert('Success', getTranslation('passwordChanged'));
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || getTranslation('failedToChangePassword'));
    } finally {
      setUpdating(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'usahawan':
        return 'Usahawan';
      case 'akuntan':
        return 'Akuntan';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#232323' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <CustomText style={{ color: '#FFFFFF', marginTop: 16 }}>
            {getTranslation('loading')} {getTranslation('profile').toLowerCase()}...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#232323' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Profile Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="person" size={50} color="#232323" />
          </View>
          <CustomText style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>
            {profile?.name || 'User'}
          </CustomText>
          <CustomText style={{ color: '#888888', fontSize: 16 }}>
            {getRoleDisplayName(profile?.role || '')}
          </CustomText>
        </View>

        {/* Profile Information */}
        <View style={{ backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <CustomText style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Profile Information
          </CustomText>
          
          <View style={{ marginBottom: 12 }}>
            <CustomText style={{ color: '#888888', fontSize: 14 }}>
              Name
            </CustomText>
            <CustomText style={{ color: '#FFFFFF', fontSize: 16 }}>
              {profile?.name}
            </CustomText>
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <CustomText style={{ color: '#888888', fontSize: 14 }}>
              Email
            </CustomText>
            <CustomText style={{ color: '#FFFFFF', fontSize: 16 }}>
              {profile?.email}
            </CustomText>
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <CustomText style={{ color: '#888888', fontSize: 14 }}>
              Role
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CustomText style={{ color: '#FFFFFF', fontSize: 16, marginRight: 8 }}>
                {getRoleDisplayName(profile?.role || '')}
              </CustomText>
              <View style={{
                backgroundColor: isAkuntan ? '#22c55e' : '#f59e0b',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}>
                <CustomText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                  {isAkuntan ? 'FULL ACCESS' : 'LIMITED ACCESS'}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Permissions Section */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#444444' }}>
            <CustomText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
              Permissions
            </CustomText>
            
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText style={{ color: '#888888', fontSize: 14 }}>Income & Expense</CustomText>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText style={{ color: '#888888', fontSize: 14 }}>Financial Reports</CustomText>
                <Ionicons name={canAccessDonut ? "checkmark-circle" : "close-circle"} size={20} color={canAccessDonut ? "#22c55e" : "#ef4444"} />
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText style={{ color: '#888888', fontSize: 14 }}>Asset Management</CustomText>
                <Ionicons name={canAccessAsset ? "checkmark-circle" : "close-circle"} size={20} color={canAccessAsset ? "#22c55e" : "#ef4444"} />
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText style={{ color: '#888888', fontSize: 14 }}>Liability Management</CustomText>
                <Ionicons name={canAccessLiability ? "checkmark-circle" : "close-circle"} size={20} color={canAccessLiability ? "#22c55e" : "#ef4444"} />
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CustomText style={{ color: '#888888', fontSize: 14 }}>Equity Management</CustomText>
                <Ionicons name={canAccessEquity ? "checkmark-circle" : "close-circle"} size={20} color={canAccessEquity ? "#22c55e" : "#ef4444"} />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setShowEditModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="create-outline" size={24} color="#232323" />
              <CustomText style={{ color: '#232323', fontSize: 16, marginLeft: 12 }}>
                Edit Profile
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#232323" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="lock-closed-outline" size={24} color="#232323" />
              <CustomText style={{ color: '#232323', fontSize: 16, marginLeft: 12 }}>
                Change Password
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#232323" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cash-outline" size={24} color="#232323" />
              <CustomText style={{ color: '#232323', fontSize: 16, marginLeft: 12 }}>
                {getTranslation('changeCurrency')}
              </CustomText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CustomText style={{ color: '#888888', fontSize: 14, marginRight: 8 }}>
                {currency}
              </CustomText>
              <Ionicons name="chevron-forward" size={24} color="#232323" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#FF4444',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <CustomText style={{ color: '#FFFFFF', fontSize: 16, marginLeft: 12 }}>
              Logout
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#232323' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <CustomText style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>
                Edit Profile
              </CustomText>
            </View>

            <View style={{ flex: 1 }}>
              <FloatingLabelInput
                label="Name"
                value={editName}
                onChangeText={setEditName}
                style={{ 
                  marginBottom: 16,
                  backgroundColor: '#2A2A2A',
                  borderColor: '#444444'
                }}
                inputStyle={{ color: '#FFFFFF' }}
              />
              
              <FloatingLabelInput
                label="Email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ 
                  marginBottom: 24,
                  backgroundColor: '#2A2A2A',
                  borderColor: '#444444'
                }}
                inputStyle={{ color: '#FFFFFF' }}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#232323" />
                ) : (
                  <CustomText style={{ color: '#232323', fontSize: 16, fontWeight: 'bold' }}>
                    Update Profile
                  </CustomText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#232323' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <CustomText style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>
                Change Password
              </CustomText>
            </View>

            <View style={{ flex: 1 }}>
              <FloatingLabelInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                togglePassword={true}
                style={{ 
                  marginBottom: 16,
                  backgroundColor: '#2A2A2A',
                  borderColor: '#444444'
                }}
                inputStyle={{ color: '#FFFFFF' }}
              />
              
              <FloatingLabelInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                togglePassword={true}
                style={{ 
                  marginBottom: 16,
                  backgroundColor: '#2A2A2A',
                  borderColor: '#444444'
                }}
                inputStyle={{ color: '#FFFFFF' }}
              />
              
              <FloatingLabelInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                togglePassword={true}
                style={{ 
                  marginBottom: 24,
                  backgroundColor: '#2A2A2A',
                  borderColor: '#444444',
                }}
                inputStyle={{ color: '#FFFFFF' }}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={handleChangePassword}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#232323" />
                ) : (
                  <CustomText style={{ color: '#232323', fontSize: 16, fontWeight: 'bold' }}>
                    Change Password
                  </CustomText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#232323' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <CustomText style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>
                {getTranslation('changeCurrency')}
              </CustomText>
            </View>

            <View style={{ flex: 1 }}>
              <CustomText style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 16 }}>
                {getTranslation('currency')}
              </CustomText>
              
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: currency === 'IDR' ? '#FFFFFF' : '#2A2A2A',
                    borderRadius: 20,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setCurrency('IDR');
                    setShowCurrencyModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={currency === 'IDR' ? '#232323' : 'transparent'} 
                    />
                    <CustomText style={{ 
                      color: currency === 'IDR' ? '#232323' : '#FFFFFF', 
                      fontSize: 16, 
                      marginLeft: 12 
                    }}>
                      {getTranslation('indonesianRupiah')} (IDR)
                    </CustomText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: currency === 'MYR' ? '#FFFFFF' : '#2A2A2A',
                    borderRadius: 20,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setCurrency('MYR');
                    setShowCurrencyModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={currency === 'MYR' ? '#232323' : 'transparent'} 
                    />
                    <CustomText style={{ 
                      color: currency === 'MYR' ? '#232323' : '#FFFFFF', 
                      fontSize: 16, 
                      marginLeft: 12 
                    }}>
                      {getTranslation('malaysianRinggit')} (MYR)
                    </CustomText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: currency === 'USD' ? '#FFFFFF' : '#2A2A2A',
                    borderRadius: 20,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setCurrency('USD');
                    setShowCurrencyModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={currency === 'USD' ? '#232323' : 'transparent'} 
                    />
                    <CustomText style={{ 
                      color: currency === 'USD' ? '#232323' : '#FFFFFF', 
                      fontSize: 16, 
                      marginLeft: 12 
                    }}>
                      {getTranslation('usDollar')} (USD)
                    </CustomText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
} 