// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

type JwtPayload = { sub: number; username: string };
type User = { id: number; username: string; email?: string };

interface Auth {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<Auth>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser({ id: decoded.sub, username: decoded.username });
      } catch {
        // invalid token
        setUser(null);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
