import {
  API_EXTENSION_CONTRACT_VERSION,
  RuntimeExtension,
  RuntimeExtensionRegistry,
} from './runtime-extension.contract';

describe('RuntimeExtensionRegistry', () => {
  const authentication = (): RuntimeExtension => ({
    point: 'authentication',
    contractVersion: API_EXTENSION_CONTRACT_VERSION,
    providerId: 'test-auth',
  });

  it('registers and resolves a versioned extension without enabling absent points', () => {
    const registry = new RuntimeExtensionRegistry();
    registry.register(authentication());

    expect(registry.resolve('authentication')).toEqual(authentication());
    expect(registry.resolve('authorization')).toBeUndefined();
    expect(registry.registeredPoints()).toEqual(['authentication']);
  });

  it('rejects incompatible versions and ambiguous providers', () => {
    const registry = new RuntimeExtensionRegistry();
    registry.register(authentication());

    expect(() => registry.register(authentication())).toThrow('already registered');
    expect(() =>
      registry.register({
        ...authentication(),
        point: 'events',
        contractVersion: 'api-extension/1.0.0',
      } as unknown as RuntimeExtension),
    ).toThrow('Unsupported events extension contract');
  });
});
