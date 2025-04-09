import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);

  // Rehydrate auth state from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("authUser");
    if (savedUser) {
      setAuthUser(JSON.parse(savedUser));
    }
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (authUser) {
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } else {
      localStorage.removeItem("authUser");
    }
  }, [authUser]);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
