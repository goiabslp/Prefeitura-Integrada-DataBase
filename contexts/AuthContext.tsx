
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signIn: async () => ({ error: 'Not implemented' }),
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Fallback or handle error (maybe user exists in Auth but not in profiles?)
                setLoading(false);
                return;
            }

            if (data) {
                const appUser: User = {
                    id: data.id,
                    username: data.username || email.split('@')[0], // Fallback username
                    name: data.name || '',
                    role: (data.role as UserRole) || 'collaborator',
                    sector: data.sector,
                    jobTitle: data.job_title,
                    allowedSignatureIds: data.allowed_signature_ids || [],
                    permissions: data.permissions || [],
                    tempPassword: data.temp_password,
                    tempPasswordExpiresAt: data.temp_password_expires_at,
                    email: data.email || email,
                    whatsapp: data.whatsapp,
                    twoFactorEnabled: data.two_factor_enabled,
                    twoFactorSecret: data.two_factor_secret,
                    twoFactorEnabled2: data.two_factor_enabled_2,
                    twoFactorSecret2: data.two_factor_secret_2
                };
                setUser(appUser);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const refreshUser = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id, session.user.email || '');
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
