import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

export interface User {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    darkMode?: boolean;
    aiProvider?: 'groq' | 'gemini' | 'hybrid';
    topics?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isDarkMode: boolean;
    toggleTheme: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialize token and user synchronously to avoid race conditions with queries
    const [token, setToken] = useState<string | null>(() => {
        const t = localStorage.getItem('token');
        if (t) {
            api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        }
        return t;
    });

    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse user", e);
                return null;
            }
        }
        return null;
    });

    // Ensure api header is updated if token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const updateUser = (updatedUser: User) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // Theme state - light mode by default
    const [localDarkMode, setLocalDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark'; // If no saved theme, returns false (light)
    });

    const isDarkMode = user ? (user.darkMode ?? false) : localDarkMode;

    const toggleTheme = async () => {
        const nextMode = !isDarkMode;
        if (user) {
            try {
                await api.put('/user/profile', { darkMode: nextMode });
                updateUser({ ...user, darkMode: nextMode });
            } catch (e) {
                console.error("Failed to sync theme with profile", e);
            }
        } else {
            setLocalDarkMode(nextMode);
            localStorage.setItem('theme', nextMode ? 'dark' : 'light');
        }
    };

    // Sync theme with document element
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.classList.remove('light-mode');
        } else {
            document.documentElement.classList.add('light-mode');
            document.documentElement.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    return (
        <AuthContext.Provider value={{ 
            user, token, login, updateUser, logout, 
            isAuthenticated: !!token,
            isDarkMode,
            toggleTheme
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
