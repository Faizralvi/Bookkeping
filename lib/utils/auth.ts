import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

const AUTH_TOKEN_KEY = '@auth_token';

export const login = async (email: string, password: string) => {
  try {
    const response = await authAPI.login({ email, password });
    
    if (response.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      return { success: true, token: response.token };
    } else {
      return { 
        success: false, 
        error: response.message || 'Login gagal. Silakan coba lagi.' 
      };
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat login. Silakan coba lagi.' 
    };
  }
};

export const register = async (name: string, email: string, password: string, role: string) => {
  try {
    const response = await authAPI.register({ name, email, password, role });
    
    if (response.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      return { success: true };
    } else {
      return { 
        success: false, 
        error: response.message || 'Registrasi gagal. Silakan coba lagi.' 
      };
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat registrasi. Silakan coba lagi.' 
    };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      error: 'Gagal logout. Silakan coba lagi.' 
    };
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}; 