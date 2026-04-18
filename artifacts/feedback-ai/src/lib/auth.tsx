import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { User, getMe, setAuthTokenGetter } from "@workspace/api-client-react";

// Set up the API client to use the token from localStorage
setAuthTokenGetter(() => localStorage.getItem("feedbackai_token"));

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("feedbackai_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user", error);
        localStorage.removeItem("feedbackai_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = (newUser: User, newToken: string) => {
    localStorage.setItem("feedbackai_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("feedbackai_token");
    setToken(null);
    setUser(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
