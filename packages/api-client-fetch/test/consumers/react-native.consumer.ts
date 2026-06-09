/**
 * Fixture de COMPILATION (non exécutée) — consommateur React Native.
 * Aucune dépendance DOM/Node/Expo ; session via SecureStore (interface) ; upload via descripteur RN.
 */
import {
  createEnistereApiClient,
  type AuthSessionAdapter,
  type AuthTokens,
  type EnistereApiClient,
  type ReactNativeFileDescriptor,
} from '../../src/index.js';

export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export function reactNativeSession(store: SecureStoreLike): AuthSessionAdapter {
  return {
    getAccessToken: () => store.getItemAsync('enistere.accessToken'),
    getRefreshToken: () => store.getItemAsync('enistere.refreshToken'),
    updateTokens: async (tokens: AuthTokens) => {
      await store.setItemAsync('enistere.accessToken', tokens.accessToken);
      await store.setItemAsync('enistere.refreshToken', tokens.refreshToken);
    },
    clearSession: async () => {
      await store.deleteItemAsync('enistere.accessToken');
      await store.deleteItemAsync('enistere.refreshToken');
    },
  };
}

export function reactNativeApiClient(baseUrl: string, store: SecureStoreLike): EnistereApiClient {
  return createEnistereApiClient({ baseUrl, session: reactNativeSession(store) });
}

export async function uploadAsset(client: EnistereApiClient, asset: ReactNativeFileDescriptor): Promise<string> {
  const stored = await client.files.upload(asset, 'IMAGE', { subjectId: 'rn' });
  return stored.id;
}
