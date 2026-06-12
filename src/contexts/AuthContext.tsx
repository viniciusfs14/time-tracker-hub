import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateAvatar: (file: File) => Promise<{ error?: string }>;
  removeAvatar: () => Promise<{ error?: string }>;
  updateName: (name: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function signedUrlFor(path: string | null | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ? `${data.signedUrl}` : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserDetails = useCallback(async (userId: string, fallbackName: string) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('name, avatar_url').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    const isAdmin = (roles ?? []).some((r) => r.role === 'admin');
    const avatarUrl = await signedUrlFor((profile as { avatar_url?: string } | null)?.avatar_url);
    setUser({
      id: userId,
      name: profile?.name || fallbackName,
      role: isAdmin ? 'admin' : 'employee',
      avatarUrl,
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const fallback = newSession.user.email?.split('@')[0] || 'Usuário';
        // Defer Supabase calls to avoid deadlock inside the callback
        setTimeout(() => loadUserDetails(newSession.user.id, fallback), 0);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        const fallback = existing.user.email?.split('@')[0] || 'Usuário';
        loadUserDetails(existing.user.id, fallback);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserDetails]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    return { error: error?.message };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      return { error: result.error instanceof Error ? result.error.message : String(result.error) };
    }
    return {};
  }, []);

  const updateAvatar = useCallback(
    async (file: File) => {
      if (!session?.user) return { error: 'Não autenticado' };
      const userId = session.user.id;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) return { error: uploadError.message };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', userId);
      if (profileError) return { error: profileError.message };

      const avatarUrl = await signedUrlFor(path);
      setUser((u) => (u ? { ...u, avatarUrl } : u));
      return {};
    },
    [session]
  );

  const removeAvatar = useCallback(async () => {
    if (!session?.user) return { error: 'Não autenticado' };
    const userId = session.user.id;
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
    if (error) return { error: error.message };
    await supabase.storage.from('avatars').remove([`${userId}/avatar.png`, `${userId}/avatar.jpg`, `${userId}/avatar.jpeg`, `${userId}/avatar.webp`]);
    setUser((u) => (u ? { ...u, avatarUrl: undefined } : u));
    return {};
  }, [session]);

  const updateName = useCallback(
    async (name: string) => {
      if (!session?.user) return { error: 'Não autenticado' };
      const { error } = await supabase.from('profiles').update({ name }).eq('id', session.user.id);
      if (error) return { error: error.message };
      setUser((u) => (u ? { ...u, name } : u));
      return {};
    },
    [session]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        updateAvatar,
        removeAvatar,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
