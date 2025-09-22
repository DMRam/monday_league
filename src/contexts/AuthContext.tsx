// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { TeamUser } from '../interfaces/User';

interface AuthContextType {
    user: TeamUser | null;
    login: (userData: TeamUser) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<TeamUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is logged in from sessionStorage
        const savedUser = sessionStorage.getItem('volleyballUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = (userData: TeamUser) => {
        setUser(userData);
        setIsAuthenticated(true);
        sessionStorage.setItem('volleyballUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem('volleyballUser');

        // Clear browser history and prevent back navigation
        window.history.pushState(null, '', '/');
        window.addEventListener('popstate', () => {
            window.history.pushState(null, '', '/');
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};