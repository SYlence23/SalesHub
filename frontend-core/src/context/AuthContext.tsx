import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    exp?: number;
    nameid?: string;           // ClaimTypes.NameIdentifier → userId
    firstName?: string;
    lastName?: string;
    unique_name?: string;      // ClaimTypes.Name → email/username
}

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    userId: number | null;
    firstName: string | null;
    lastName: string | null;
    userEmail: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeUserFromToken(token: string): Omit<AuthContextType, 'login' | 'logout' | 'token' | 'isAuthenticated'> {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return {
            userId: decoded.nameid ? parseInt(decoded.nameid) : null,
            firstName: decoded.firstName ?? null,
            lastName: decoded.lastName ?? null,
            userEmail: decoded.unique_name ?? null,
        };
    } catch {
        return { userId: null, firstName: null, lastName: null, userEmail: null };
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp && decodedToken.exp > currentTime) {
                    return storedToken;
                }
            } catch {
                // Invalid token — ignore
            }
        }
        return null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
    const [userInfo, setUserInfo] = useState(() =>
        token ? decodeUserFromToken(token) : { userId: null, firstName: null, lastName: null, userEmail: null }
    );

    useEffect(() => {
        if (!token) {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsAuthenticated(true);
        setUserInfo(decodeUserFromToken(newToken));
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUserInfo({ userId: null, firstName: null, lastName: null, userEmail: null });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, ...userInfo, login, logout }}>
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
