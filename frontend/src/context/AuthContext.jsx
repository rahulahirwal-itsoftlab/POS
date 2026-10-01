import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, getActiveUser, setActiveUser } from '../services/api';
import posService from '../services/pos.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getActiveUser());
  const [restaurant, setRestaurant] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast notifier
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch /api/auth/me on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await posService.auth.me();
        if (res.success && res.data) {
          const userData = res.data.user || res.data;
          const restData = res.data.restaurant || userData.restaurant || null;
          setUser(userData);
          setRestaurant(restData);
          setActiveUser(userData);
        }
      } catch (err) {
        console.error('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      addToast('Session expired. Please log in again.', 'warning');
      logout();
    };

    window.addEventListener('pos_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pos_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await posService.auth.login({ email, password });
      if (res.success && res.data) {
        const { token: receivedToken, user: loggedUser, restaurant: loggedRestaurant } = res.data;
        setAuthToken(receivedToken);
        setTokenState(receivedToken);
        setUser(loggedUser);
        setActiveUser(loggedUser);
        setRestaurant(loggedRestaurant || loggedUser.restaurant || null);
        addToast(`Welcome back, ${loggedUser.name}!`, 'success');
        return { success: true, user: loggedUser };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (payload) => {
    try {
      const res = await posService.auth.register(payload);
      if (res.success && res.data) {
        const { token: receivedToken, user: registeredUser, restaurant: regRestaurant } = res.data;
        setAuthToken(receivedToken);
        setTokenState(receivedToken);
        setUser(registeredUser);
        setActiveUser(registeredUser);
        setRestaurant(regRestaurant || null);
        addToast('Restaurant & Owner account registered successfully!', 'success');
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState('');
    setUser(null);
    setActiveUser(null);
    setRestaurant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'GUEST',
        restaurant,
        token,
        loading,
        toasts,
        addToast,
        removeToast,
        login,
        register,
        logout,
        setRestaurant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
