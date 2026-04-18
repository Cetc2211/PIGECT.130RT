// Stub for react-firebase-hooks/auth — returns unauthenticated state
import { useState, useEffect } from 'react';

export function useAuthState(_auth: unknown): [unknown, boolean, unknown] {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate auth check completing — always unauthenticated in local mode
    setLoading(false);
  }, []);

  return [user, loading, error];
}

export function useCreateUserWithEmailAndPassword(_auth: unknown): [unknown, boolean, unknown, (email: string, password: string) => Promise<unknown>] {
  return [null, false, null, async () => null];
}

export function useSignInWithEmailAndPassword(_auth: unknown): [unknown, boolean, unknown, (email: string, password: string) => Promise<unknown>] {
  return [null, false, null, async () => null];
}

export function useSendPasswordResetEmail(_auth: unknown): [(email: string) => Promise<boolean>, boolean, unknown] {
  return [async () => true, false, null];
}

export function useSignInWithGoogle(_auth: unknown): [unknown, boolean, unknown, () => Promise<unknown>] {
  return [null, false, null, async () => null];
}

export function useSignOut(_auth: unknown): [(options?: unknown) => Promise<boolean>, boolean, unknown] {
  return [async () => true, false, null];
}
