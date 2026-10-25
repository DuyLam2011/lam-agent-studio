export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeStyle = 'glassmorphism' | 'minimalism';

let systemMediaListener: ((e: MediaQueryListEvent) => void) | null = null;

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
    root.style.setProperty('--primary', accentColor);
  }
};
