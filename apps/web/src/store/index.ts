import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}))
