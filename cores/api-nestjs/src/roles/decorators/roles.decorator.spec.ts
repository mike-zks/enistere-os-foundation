import { Reflector } from '@nestjs/core';

import { ROLES_KEY, Roles } from './roles.decorator';

describe('@Roles', () => {
  it('stores normalized role codes (OR semantics)', () => {
    @Roles('Administrator', ' Auditor ')
    class Target {}

    expect(new Reflector().get(ROLES_KEY, Target)).toEqual(['administrator', 'auditor']);
  });
});
