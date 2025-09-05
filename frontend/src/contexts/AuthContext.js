// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const AuthContext = createContext(null);

const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decodifica o token (parte payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Verifica se o token já expirou
    if (payload.exp * 1000 < Date.now()) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('alencar_frutas_token');
        const savedUser = localStorage.getItem('alencar_frutas_user');
  
        if (token && savedUser && isTokenValid(token)) {
          setUser(JSON.parse(savedUser));
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          localStorage.removeItem('alencar_frutas_token');
          localStorage.removeItem('alencar_frutas_user');
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };
  
    initializeAuth();
  }, []);

  const login = async (email, senha, tipoLogin = 'web') => {
    try {
      console.log('🔐 [AUTH] Tentando login para:', email);
      
      const response = await axiosInstance.post('/auth/login', {
        email,
        senha,
        tipoLogin
      });
  
      console.log('✅ [AUTH] Login bem-sucedido:', response.data);
      
      const { access_token, usuario, expiracao } = response.data;
      
      localStorage.setItem('alencar_frutas_token', access_token);
      localStorage.setItem('alencar_frutas_user', JSON.stringify(usuario));
      localStorage.setItem('alencar_frutas_expiracao', expiracao);
      
      setUser(usuario);
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Erro no login:', error);
      console.error('❌ [AUTH] Response data:', error.response?.data);
      console.error('❌ [AUTH] Status:', error.response?.status);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('alencar_frutas_token');
    localStorage.removeItem('alencar_frutas_user');
    localStorage.removeItem('alencar_frutas_expiracao');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const getTokenExpiration = () => {
    const expiracao = localStorage.getItem('alencar_frutas_expiracao');
    return expiracao ? new Date(expiracao) : null;
  };

  const value = {
    user,
    login,
    logout,
    getTokenExpiration,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};