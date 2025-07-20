import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import authService from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user: storedUser, token } = authService.getAuth();
        
        if (storedUser && token) {
          // Verify token is still valid by getting profile
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        // Token is invalid, clear auth data
        authService.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser, token } = await authService.login({ email, password });
      authService.setAuth(authUser, token);
      setUser(authUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.clearAuth();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 