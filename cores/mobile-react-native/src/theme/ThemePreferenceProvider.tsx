/**
 * Binds the Zustand UI store's `themePreference` to `ThemeProvider`.
 *
 * - `'system'` (default) → no forced scheme; ThemeProvider follows
 *   `useColorScheme()` from React Native.
 * - `'light'` / `'dark'` → forced scheme, overrides the OS setting.
 *
 * This is the only place where `src/store` and `src/theme` are coupled.
 * Swap-in of real UI Kit tokens later requires no change here.
 */
import { type PropsWithChildren } from 'react';

import { useUiStore } from '@/store';

import { ThemeProvider } from './ThemeProvider';
import type { ColorScheme } from './tokens';

export function ThemePreferenceProvider({ children }: PropsWithChildren): React.JSX.Element {
  const themePreference = useUiStore((state) => state.themePreference);
  const scheme: ColorScheme | undefined = themePreference === 'system' ? undefined : themePreference;
  return <ThemeProvider scheme={scheme}>{children}</ThemeProvider>;
}
