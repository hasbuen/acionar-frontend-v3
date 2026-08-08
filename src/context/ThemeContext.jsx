import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'color-theme';

const DEFAULT_THEME = {
  primary: '#2563eb',
  secondary: '#3b82f6',
  background: '#020617',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
};

function validHex(value, fallback) {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function hexToRgb(value) {
  const hex = value.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  return `${parseInt(normalized.slice(0, 2), 16)}, ${parseInt(normalized.slice(2, 4), 16)}, ${parseInt(normalized.slice(4, 6), 16)}`;
}

function luminance(value) {
  const hex = value.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  const channels = [0, 2, 4].map(offset => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function getTenantTheme(tenant) {
  return {
    primary: validHex(tenant?.cor_primaria, DEFAULT_THEME.primary),
    secondary: validHex(tenant?.cor_destaque || tenant?.cor_secundaria, DEFAULT_THEME.secondary),
    background: validHex(tenant?.cor_fundo || tenant?.cor_fundo_card, DEFAULT_THEME.background),
    textPrimary: validHex(tenant?.cor_texto_principal, DEFAULT_THEME.textPrimary),
    textSecondary: validHex(tenant?.cor_texto_secundario, DEFAULT_THEME.textSecondary),
  };
}

function applyDocumentTheme(mode, tenantTheme) {
  const root = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  root.classList.toggle('dark', mode === 'dark');
  root.dataset.colorMode = mode;
  localStorage.setItem(THEME_STORAGE_KEY, mode);

  if (!tenantTheme) {
    delete root.dataset.tenantTheme;
    ['primary', 'primary-rgb', 'secondary', 'secondary-rgb', 'background', 'text-primary', 'text-secondary', 'text-primary-light', 'text-secondary-light', 'page-bg-light', 'page-bg-dark', 'surface-light', 'surface-muted-light', 'surface-dark', 'border-light', 'border-dark'].forEach(name => {
      root.style.removeProperty(`--tenant-${name}`);
    });
    if (metaThemeColor) metaThemeColor.content = mode === 'dark' ? '#020617' : '#eef4fb';
    return;
  }

  root.dataset.tenantTheme = 'true';
  root.style.setProperty('--tenant-primary', tenantTheme.primary);
  root.style.setProperty('--tenant-primary-rgb', hexToRgb(tenantTheme.primary));
  root.style.setProperty('--tenant-secondary', tenantTheme.secondary);
  root.style.setProperty('--tenant-secondary-rgb', hexToRgb(tenantTheme.secondary));
  root.style.setProperty('--tenant-background', tenantTheme.background);
  root.style.setProperty('--tenant-text-primary', tenantTheme.textPrimary);
  root.style.setProperty('--tenant-text-secondary', tenantTheme.textSecondary);
  root.style.setProperty('--tenant-text-primary-light', luminance(tenantTheme.textPrimary) < 0.55 ? tenantTheme.textPrimary : '#0f172a');
  root.style.setProperty('--tenant-text-secondary-light', luminance(tenantTheme.textSecondary) < 0.55 ? tenantTheme.textSecondary : '#475569');
  root.style.setProperty('--tenant-page-bg-light', `color-mix(in srgb, ${tenantTheme.primary} 4%, #f8fafc)`);
  root.style.setProperty('--tenant-page-bg-dark', `color-mix(in srgb, ${tenantTheme.background} 72%, #020617)`);
  root.style.setProperty('--tenant-surface-light', `color-mix(in srgb, ${tenantTheme.primary} 2%, #ffffff)`);
  root.style.setProperty('--tenant-surface-muted-light', `color-mix(in srgb, ${tenantTheme.primary} 5%, #f1f5f9)`);
  root.style.setProperty('--tenant-surface-dark', `color-mix(in srgb, ${tenantTheme.background} 48%, #0f172a)`);
  root.style.setProperty('--tenant-border-light', `color-mix(in srgb, ${tenantTheme.primary} 18%, #cbd5e1)`);
  root.style.setProperty('--tenant-border-dark', `color-mix(in srgb, ${tenantTheme.primary} 28%, #1e293b)`);

  if (metaThemeColor) metaThemeColor.content = mode === 'dark' ? tenantTheme.background : tenantTheme.primary;
}

export function ThemeProvider({ children }) {
  const { tenant } = useAuth();
  const [mode, setModeState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');
  const tenantTheme = useMemo(() => (tenant ? getTenantTheme(tenant) : null), [tenant]);

  useEffect(() => {
    applyDocumentTheme(mode === 'dark' ? 'dark' : 'light', tenantTheme);
  }, [mode, tenantTheme]);

  const setMode = (nextMode) => {
    setModeState(nextMode === 'dark' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    tenantTheme,
    setMode,
    toggleMode: () => setMode(mode === 'dark' ? 'light' : 'dark'),
  }), [mode, tenantTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
