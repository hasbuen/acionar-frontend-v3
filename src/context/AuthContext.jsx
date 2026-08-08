import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../services/api';
import { registerWebPushSubscription } from '../services/pushNotifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('acionar_v3_token');
    if (token && user) {
      const newSocket = io(window.location.origin, {
        path: '/api/socket.io',
        auth: { token },
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('[SOCKET] Connected to real-time server');
      });

      newSocket.on('notifications-changed', (data) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🚨 Novo Agendamento Solicitado!', {
              body: 'Um cliente solicitou um agendamento na sua agenda pública. Acesse o aplicativo para Aceitar ou Recusar.',
              icon: '/logo192.png',
              badge: '/logo192.png',
              tag: 'novo-agendamento-acionar',
              renotify: true
            });
          } catch (e) {
            console.error('Erro ao disparar notificação nativa:', e);
          }
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[SOCKET] Disconnected from server:', reason);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('[SOCKET] Connection error:', err.message);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
    }
  }, [user]);

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

  useEffect(() => {
    if (user) {
      registerWebPushSubscription().catch(e => console.warn('[WEB PUSH SUBSCRIBE ERR]', e));
    }
  }, [user]);

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
    <AuthContext.Provider value={{ user, tenant, setTenant, loading, login, registerTenant, logout, socket }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
