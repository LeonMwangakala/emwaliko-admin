import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bio: string;
  user_code: string;
  country: string;
  region: string;
  postal_code: string;
  profile_picture: string;
  role_id: number;
}

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getProfile();
      setProfile(data as UserProfile);
    } catch (e) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    
    setLoading(true);
    setError('');
    try {
      const updateData = {
        first_name: data.first_name || profile.first_name,
        last_name: data.last_name || profile.last_name,
        email: data.email || profile.email,
        phone_number: data.phone_number || profile.phone_number,
        bio: data.bio || profile.bio,
        country: data.country || profile.country,
        region: data.region || profile.region,
        postal_code: data.postal_code || profile.postal_code,
      };
      
      const updatedProfile = await apiService.updateProfile(updateData);
      setProfile((updatedProfile as any).user);
    } catch (e) {
      setError('Failed to update profile');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePicture = async (file: File) => {
    if (!profile) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await apiService.updateProfilePicture(file);
      setProfile((result as any).user);
    } catch (e) {
      setError('Failed to update profile picture');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    updateProfilePicture,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}; 