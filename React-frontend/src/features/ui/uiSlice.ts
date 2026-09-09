import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

export interface UiState {
  theme: ThemeMode;
  sidebarOpen: boolean;
}

const LOCAL_STORAGE_THEME_KEY = 'fap-theme';

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

const initialState: UiState = {
  theme: readInitialTheme(),
  sidebarOpen: true,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_THEME_KEY, action.payload);
      }
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_THEME_KEY, state.theme);
      }
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setTheme, toggleTheme, toggleSidebar } = uiSlice.actions;

export default uiSlice.reducer;
