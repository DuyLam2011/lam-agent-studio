export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeStyle = 'glassmorphism' | 'minimalism' | 'paper-ink';

let systemMediaListener: ((e: MediaQueryListEvent) => void) | null = null;

export const hexToRgbSpace = (hex: string): string => {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return '59 130 246';
};

export const applyTheme = (
  mode: ThemeMode = 'dark',
  style: ThemeStyle = 'glassmorphism',
  accentColor?: string
) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  let effectiveMode: 'dark' | 'light' = 'dark';
  if (mode === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveMode = isDark ? 'dark' : 'light';

    if (!systemMediaListener && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      systemMediaListener = (e: MediaQueryListEvent) => {
        if (root.getAttribute('data-theme-mode') === 'system') {
          root.classList.remove('dark', 'light');
          root.classList.add(e.matches ? 'dark' : 'light');
        }
      };
      media.addEventListener('change', systemMediaListener);
    }
  } else {
    effectiveMode = mode;
  }

  root.setAttribute('data-theme-mode', mode);
  root.classList.remove('dark', 'light');
  root.classList.add(effectiveMode);
  root.setAttribute('data-theme-style', style);

  if (accentColor) {
    const rgb = hexToRgbSpace(accentColor);
    const [r, g, b] = rgb.split(' ').map((val) => parseInt(val, 10) || 0);
    const isBright = (r * 299 + g * 587 + b * 114) / 1000 > 150;
    root.style.setProperty('--primary-rgb', rgb);
    root.style.setProperty('--primary', accentColor);
    root.style.setProperty('--primary-hover', `rgb(${rgb} / 0.85)`);
    root.style.setProperty('--primary-light', `rgb(${rgb} / 0.15)`);
    root.style.setProperty('--border-active', `rgb(${rgb} / 0.6)`);
    root.style.setProperty('--primary-contrast', isBright ? '#090a0f' : '#ffffff');
  }
};

// Immediate synchronous boot application to guarantee zero-latency theme/accent restoration
if (typeof document !== 'undefined') {
  const initMode = (typeof localStorage !== 'undefined' ? (localStorage.getItem('lam_theme_mode') as ThemeMode) : null) || 'dark';
  const initStyle = (typeof localStorage !== 'undefined' ? (localStorage.getItem('lam_theme_style') as ThemeStyle) : null) || 'glassmorphism';
  const initAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('lam_accent_color') : null) || '#3b82f6';
  applyTheme(initMode, initStyle, initAccent);
}
