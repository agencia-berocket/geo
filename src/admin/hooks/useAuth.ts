import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isAdminUser } from '../../lib/firebase';

export type AuthState = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setAuthState('unauthenticated');
      } else if (!isAdminUser(u)) {
        setAuthState('unauthorized');
      } else {
        setAuthState('authorized');
      }
    });
    return unsubscribe;
  }, []);

  return { user, authState };
}
