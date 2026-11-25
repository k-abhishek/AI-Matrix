import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useSession as useClerkSession,
  useClerk,
} from '@clerk/react';
import apiClient from '../api/client';

export type AppUser = ReturnType<typeof useClerkUser>['user'];

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  hasPendingSession: boolean;
  sessionStatus: string | null;
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  orgPermissions: string[];
  isOrganization: boolean;
  user: AppUser;
  token: string | null;
  getToken: (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;
  signOut: () => Promise<void>;
  openUserProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Internal provider that runs within ClerkProvider context when Clerk is configured.
 */
const ClerkAuthConsumer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isLoaded,
    isSignedIn,
    userId,
    orgId,
    orgRole,
    has,
    getToken: clerkGetToken,
    signOut: clerkSignOut,
  } = useClerkAuth();
  const { user } = useClerkUser();
  const { session } = useClerkSession();
  const clerk = useClerk();
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(
    async (options?: { template?: string; skipCache?: boolean }): Promise<string | null> => {
      try {
        if (!clerkGetToken) return null;
        const currentToken = await clerkGetToken(options);
        setToken(currentToken);
        return currentToken;
      } catch (err) {
        console.warn('[AuthContext] Error retrieving Clerk access token:', err);
        return null;
      }
    },
    [clerkGetToken]
  );

  // Wire Clerk token retrieval directly into the global apiClient
  useEffect(() => {
    apiClient.setAuthTokenProvider(async () => {
      try {
        return await getToken();
      } catch (err) {
        console.warn('[ApiClient] Failed to attach Clerk token:', err);
        return null;
      }
    });

    apiClient.setWorkspaceIdProvider(() => orgId ?? userId ?? null);

    if (isSignedIn) {
      getToken();
    } else {
      setToken(null);
    }
  }, [getToken, isSignedIn, orgId, userId]);

  const signOut = useCallback(async () => {
    try {
      await clerkSignOut();
      setToken(null);
    } catch (err) {
      console.error('[AuthContext] Error during sign out:', err);
    }
  }, [clerkSignOut]);

  const openUserProfile = useCallback(() => {
    clerk?.openUserProfile?.();
  }, [clerk]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isLoaded: isLoaded ?? false,
      isSignedIn: isSignedIn ?? false,
      hasPendingSession: session?.status === 'pending',
      sessionStatus: session?.status ?? null,
      userId: userId ?? null,
      orgId: orgId ?? null,
      orgRole: orgRole ?? null,
      orgPermissions: [],
      isOrganization: Boolean(orgId),
      user: user ?? null,
      token,
      getToken,
      signOut,
      openUserProfile,
    }),
    [isLoaded, isSignedIn, session?.status, userId, orgId, orgRole, has, user, token, getToken, signOut, openUserProfile]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * Fallback provider when Clerk publishable key is not present.
 */
const FallbackAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo<AuthContextType>(
    () => ({
      isLoaded: true,
      isSignedIn: false,
      hasPendingSession: false,
      sessionStatus: null,
      userId: null,
      orgId: null,
      orgRole: null,
      orgPermissions: [],
      isOrganization: false,
      user: null,
      token: null,
      getToken: async () => null,
      signOut: async () => {},
      openUserProfile: () => {},
    }),
    []
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!PUBLISHABLE_KEY) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  return <ClerkAuthConsumer>{children}</ClerkAuthConsumer>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
