import { Moon, Sun, Monitor, Sparkles, Layout } from 'lucide-react';
import { ThemeMode, ThemeStyle } from '../../../utils/themeManager';

export const ACCENT_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
];

export const THEME_MODES: Array<{ id: ThemeMode; label: string; icon: any }> = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export const THEME_STYLES: Array<{ id: ThemeStyle; label: string; desc: string; icon: any }> = [
  { id: 'glassmorphism', label: 'Glassmorphism', desc: 'Frosted & Translucent', icon: Sparkles },
  { id: 'minimalism', label: 'Minimalism', desc: 'Solid Flat & Razor Sharp', icon: Layout },
];
