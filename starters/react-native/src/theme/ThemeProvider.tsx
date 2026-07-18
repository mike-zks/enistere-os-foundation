/**
 * ThemeProvider — the mobile ThemeProvider mandated by ADR-010.
 *
 * It resolves a {@link Theme} from the device color scheme (or a forced scheme)
 * and exposes it via context. Components read tokens through `useTheme()` and
 * never hardcode "magic" values (ADR-010 §19).
 *
 * Today the tokens are the placeholder bridge in `./tokens`. Swapping in the
 * real `@enistere/ui-kit` tokens later does not change this provider's API.
 */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { resolveTheme, type ColorScheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps extends PropsWithChildren {
  /** Force a scheme; when omitted the OS scheme is followed. */
  readonly scheme?: ColorScheme;
}

export function ThemeProvider({ scheme, children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const resolved = useMemo<Theme>(
    () => resolveTheme(scheme ?? (systemScheme === 'dark' ? 'dark' : 'light')),
    [scheme, systemScheme],
  );
  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

/** Returns the active theme. Throws if used outside {@link ThemeProvider}. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return theme;
}
