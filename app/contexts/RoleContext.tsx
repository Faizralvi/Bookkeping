import React, { createContext, useContext, useEffect, useState } from 'react';
import { userAPI } from '../../lib/utils/api';

interface UserRole {
  role: string;
  name: string;
  email: string;
}

interface RoleContextType {
  userRole: UserRole | null;
  loading: boolean;
  isAkuntan: boolean;
  isUsahawan: boolean;
  canAccessDonut: boolean;
  canAccessAsset: boolean;
  canAccessLiability: boolean;
  canAccessEquity: boolean;
  refreshUserRole: () => Promise<void>;
  resetUserRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      if (response && response.data) {
        const userData = {
          role: response.data.role,
          name: response.data.name,
          email: response.data.email,
        };
        setUserRole(userData);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const isAkuntan = userRole?.role === 'akuntan';
  const isUsahawan = userRole?.role === 'usahawan';

  // Permission checks - akuntan gets full access, usahawan gets limited access
  const canAccessDonut = !loading && isAkuntan;
  const canAccessAsset = !loading && isAkuntan;
  const canAccessLiability = !loading && isAkuntan;
  const canAccessEquity = !loading && isAkuntan;

  const value: RoleContextType = {
    userRole,
    loading,
    isAkuntan,
    isUsahawan,
    canAccessDonut,
    canAccessAsset,
    canAccessLiability,
    canAccessEquity,
    refreshUserRole: fetchUserRole,
    resetUserRole: () => setUserRole(null),
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

// Add default export to fix the warning
export default RoleProvider; 