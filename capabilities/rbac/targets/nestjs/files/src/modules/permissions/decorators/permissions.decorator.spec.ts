import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY, Permissions } from './permissions.decorator';

describe('@Permissions', () => {
  it('stores the required permissions (AND semantics)', () => {
    @Permissions('users.read', 'audit.read')
    class Target {}

    expect(new Reflector().get(PERMISSIONS_KEY, Target)).toEqual(['users.read', 'audit.read']);
  });

  it.each(['users.*', 'Users.Read', 'users', 'users read'])(
    'throws at declaration for the invalid code %s',
    (code) => {
      expect(() => Permissions(code)).toThrow();
    },
  );
});
