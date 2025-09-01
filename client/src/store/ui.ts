import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Toast } from '@/types';

interface UIState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Locale
  locale: 'en' | 'bn';
  setLocale: (locale: 'en' | 'bn') => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Store timeout IDs to prevent memory leaks
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        // Update HTML class for Tailwind dark mode
        if (typeof window !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        get().setTheme(currentTheme === 'light' ? 'dark' : 'light');
      },

      // Locale
      locale: 'en',
      setLocale: (locale) => set({ locale }),

      // Mobile menu
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration || 5000,
        };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto remove toast with timeout management
        const timeoutId = setTimeout(() => {
          get().removeToast(id);
          toastTimeouts.delete(id);
        }, newToast.duration);
        
        toastTimeouts.set(id, timeoutId);
      },
      removeToast: (id) => {
        // Clear timeout if it exists
        const timeoutId = toastTimeouts.get(id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          toastTimeouts.delete(id);
        }
        
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },
      clearToasts: () => {
        // Clear all timeouts
        toastTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        toastTimeouts.clear();
        set({ toasts: [] });
      },

      // Loading states
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'kattali-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const store = useUIStore.getState();
  if (store.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}
