// src/api/axiosConfig.js

import axios from 'axios';
import { createBrowserHistory } from 'history';



// Criar um objeto com as configurações de ambiente
const config = {
  development: 'http://localhost:5002',
  production: 'https://sistema-irrigacao-backend.onrender.com', // URL do backend no Render
  test: 'http://localhost:5002'
};

// Pegar o ambiente atual (development, production ou test)
const environment = process.env.NODE_ENV || 'development';

const axiosInstance = axios.create({
  baseURL: config[environment],
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento global de erros
// Adiciona o token em todas as requisições
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('alencar_frutas_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros de autenticação
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/login') // Não redireciona se for a rota de login
    ) {
      localStorage.removeItem('alencar_frutas_token');
      localStorage.removeItem('alencar_frutas_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;