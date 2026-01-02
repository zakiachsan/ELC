import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { User, UserRole, SkillCategory, DifficultyLevel } from '../types';
import type { Profile } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map database profile to app User type
const mapProfileToUser = (profile: Profile): User => {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || undefined,
    address: profile.address || undefined,
    role: profile.role as UserRole,
    status: profile.status as 'ACTIVE' | 'INACTIVE',
    linkedStudentId: profile.linked_student_id || undefined,
    branch: profile.branch || undefined,
    teacherNotes: profile.teacher_notes || undefined,
    needsAttention: profile.needs_attention,
    schoolOrigin: profile.school_origin || undefined,
    assignedLocationId: profile.assigned_location_id || undefined,
    assignedSubjects: profile.assigned_subjects || [],
    skillLevels: profile.skill_levels as Partial<Record<SkillCategory, DifficultyLevel>> || {},
    learningHubSubscription: profile.learning_hub_subscription as { isActive: boolean; expiresAt?: string } || { isActive: false },
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    console.log('Fetching profile for user:', userId);
    setError(null); // Clear previous errors

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout - check RLS policies')), 10000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error, status } = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>;

      console.log('Profile fetch response - status:', status, 'data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching profile:', error);
        console.error('Profile may not exist for this user. User ID:', userId);
        if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist
          setError('No profile found for this account. Please contact administrator to create your profile.');
        } else if (status === 406) {
          // RLS policy might be blocking
          setError('Access denied. Please check Row Level Security policies.');
        } else {
          setError('Failed to fetch user profile: ' + error.message);
        }
        return null;
      }

      if (data) {
        console.log('Profile fetched successfully:', data);
        const mappedUser = mapProfileToUser(data);
        console.log('Mapped user:', mappedUser);
        setUser(mappedUser);
        setError(null);
        return mappedUser;
      }

      console.warn('No profile data returned for user:', userId);
      setError('No profile data found. Please contact administrator.');
      return null;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching user profile';
      setError(errorMessage);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session ? 'exists' : 'none');
        setSession(session);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          // If profile fetch failed, sign out to clear the broken session
          if (!profile) {
            console.warn('Profile fetch failed, signing out...');
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err);
        setError('Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Only refresh profile on token refresh
          await fetchUserProfile(session.user.id);
          setLoading(false);
        } else {
          // For SIGNED_IN and other events, just set loading to false
          // Profile is already fetched in getInitialSession or signIn
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    setError(null);
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { error: authError };
      }

      // Create profile (if auth user was created)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            name: userData.name || email.split('@')[0],
            role: userData.role || 'STUDENT',
            status: 'ACTIVE',
            ...userData,
          } as any);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Note: Auth user was created but profile failed
          // You may want to handle this differently
        }
      }

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // Always clear local state, even if server logout fails
      setUser(null);
      setSession(null);
      setError(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh user data
      await fetchUserProfile(user.id);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
    isAdmin: user?.role === UserRole.ADMIN,
    isTeacher: user?.role === UserRole.TEACHER,
    isStudent: user?.role === UserRole.STUDENT,
    isParent: user?.role === UserRole.PARENT,
    isConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
