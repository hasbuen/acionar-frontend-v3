import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('acionar_v3_token');
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
          setTenant(res.tenant);
        } catch (err) {
          console.warn('[AUTH SESSION] Invalid session:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  const login = async (slug, email, senha) => {
    const cleanSlug = (slug || '').trim().toLowerCase();
    if (!cleanSlug) throw new Error('Informe o código da empresa.');
    localStorage.removeItem('acionar_v3_token');
    localStorage.removeItem('acionar_v3_slug');
    setUser(null);
    setTenant(null);
    const res = await apiRequest('/auth/login', 'POST', { slug: cleanSlug, email, senha });
    localStorage.setItem('acionar_v3_token', res.token);
    localStorage.setItem('acionar_v3_slug', res.tenant.slug);
    setUser(res.user);
    setTenant(res.tenant);
    return res;
  };

  const registerTenant = async (data) => {
    const res = await apiRequest('/auth/register-tenant', 'POST', data);
    localStorage.setItem('acionar_v3_token', res.token);
    localStorage.setItem('acionar_v3_slug', res.tenant.slug);
    setUser(res.user);
    setTenant(res.tenant);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('acionar_v3_token');
    localStorage.removeItem('acionar_v3_slug');
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, setTenant, loading, login, registerTenant, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
