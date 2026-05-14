import { createContext, useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { setAuthInterceptors } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    queryClient.clear();
    navigate('/login'); // Redirect to login after logout
  }, [setToken, setUser, queryClient, navigate]);

  useEffect(() => {
    setAuthInterceptors(logout, navigate);
  }, [logout, navigate]);

  useEffect(() => {
    console.log('3. AuthContext useEffect triggered by token change. Token:', token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userPayload = { email: decoded.email, role: decoded.role, id: decoded.sub };
        console.log('4. Token decoded successfully. User payload:', userPayload);
        setUser(userPayload);
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('!!! JWT DECODE FAILED, THIS IS THE PROBLEM !!!', error);
        console.error("Invalid token detected in useEffect");
        logout();
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const loginMutation = useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials),
    onSuccess: (data) => {
      console.log('1. Login API call successful. Response:', data);
      const token = data?.data?.data?.token;
      console.log('2. Extracted Token:', token);
      if (token) {
        setToken(token);
      } else {
        console.error('Token not found in response!');
      }
    },
  });

  // --- Automatic Idle Logout Logic ---
  useEffect(() => {
    let idleTimer;
    const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 Menit (bisa disesuaikan)

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (token) {
          console.log('User idle for too long, logging out...');
          logout();
          alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.');
        }
      }, IDLE_TIMEOUT);
    };

    if (token) {
      // Event yang dianggap sebagai "aktivitas"
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      // Jalankan timer pertama kali
      resetTimer();

      // Tambahkan listener ke setiap event
      events.forEach(event => {
        window.addEventListener(event, resetTimer);
      });

      // Cleanup function
      return () => {
        if (idleTimer) clearTimeout(idleTimer);
        events.forEach(event => {
          window.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [token, logout]);
  // ------------------------------------

  const registerMutation = useMutation({
    mutationFn: (userData) => api.post('/auth/register', userData),
    onSuccess: (data) => {
      console.log('Registration successful', data);
    }
  });

  

  const authContextValue = {
    token,
    user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};