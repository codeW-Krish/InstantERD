import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { account } from '../lib/appwrite/client';
import type { Models } from 'appwrite';

interface UserContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  checkSession: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      setLoading(true);
      const sessionUser = await account.get();
      setUser(sessionUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, logout, checkSession }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
