
import React, { createContext } from 'react';
import { useAuthProvider } from './useAuthProvider';
import { AuthContextType } from './types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authValues = useAuthProvider();

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
}
