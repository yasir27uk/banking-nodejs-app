'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'developer' | 'readonly';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  accountId: string;
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, username: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  allUsers: User[];
}

const defaultUsers: Array<User & { password: string }> = [
  {
    id: 'u-001',
    email: 'admin@vmc-corp.com',
    username: 'admin',
    displayName: 'Admin User',
    role: 'admin',
    accountId: '123456789012',
    avatar: 'AU',
    createdAt: '2024-01-01T00:00:00Z',
    password: 'Admin123!',
  },
  {
    id: 'u-002',
    email: 'developer@vmc-corp.com',
    username: 'dev-user',
    displayName: 'Dev User',
    role: 'developer',
    accountId: '123456789012',
    avatar: 'DU',
    createdAt: '2024-02-01T00:00:00Z',
    password: 'Dev123!',
  },
  {
    id: 'u-003',
    email: 'readonly@vmc-corp.com',
    username: 'ro-user',
    displayName: 'Read Only',
    role: 'readonly',
    accountId: '123456789012',
    avatar: 'RO',
    createdAt: '2024-03-01T00:00:00Z',
    password: 'Readonly123!',
  },
];

const STORAGE_KEY = 'vmc_auth';
const USERS_KEY = 'vmc_users';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<Array<User & { password: string }>>(defaultUsers);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers) setRegisteredUsers(JSON.parse(storedUsers));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const found = registeredUsers.find(
      u => (u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase()) && u.password === password
    );
    if (!found) return { success: false, error: 'Incorrect email or password.' };
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return { success: true };
  };

  const signup = async (email: string, username: string, password: string, role: UserRole) => {
    await new Promise(r => setTimeout(r, 600));
    if (registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username is already taken.' };
    }
    const initials = username.slice(0, 2).toUpperCase();
    const newUser: User & { password: string } = {
      id: `u-${Date.now()}`,
      email,
      username,
      displayName: username,
      role,
      accountId: '123456789012',
      avatar: initials,
      createdAt: new Date().toISOString(),
      password,
    };
    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    const { password: _, ...userData } = newUser;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const allUsers = registeredUsers.map(({ password: _, ...u }) => u);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
