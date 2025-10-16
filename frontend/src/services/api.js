
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let _logout = null;
let _navigate = null;

export const setAuthInterceptors = (logoutFn, navigateFn) => {
  _logout = logoutFn;
  _navigate = navigateFn;
};

// Interceptor untuk menambahkan token JWT ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor untuk menangani respons error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jika ada 401 Unauthorized, panggil logout dan redirect
      if (_logout) _logout();
      if (_navigate) _navigate('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
