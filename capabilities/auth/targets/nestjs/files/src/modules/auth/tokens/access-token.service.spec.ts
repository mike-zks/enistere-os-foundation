import { JwtService } from '@nestjs/jwt';

import { AccessTokenService } from './access-token.service';

describe('AccessTokenService', () => {
  const jwtService = new JwtService({
    secret: 'test-access-secret',
    signOptions: { expiresIn: 900 },
  });
  const service = new AccessTokenService(jwtService);

  it('signs an access token carrying only the minimal claims', async () => {
    const token = await service.sign({ sub: 'user-1', sid: 'session-1', typ: 'access' });
    const decoded = jwtService.verify(token, { secret: 'test-access-secret' });

    expect(decoded.sub).toBe('user-1');
    expect(decoded.sid).toBe('session-1');
    expect(decoded.typ).toBe('access');
    expect(typeof decoded.exp).toBe('number');
  });

  it('does not embed sensitive or profile fields', async () => {
    const token = await service.sign({ sub: 'user-1', sid: 'session-1', typ: 'access' });
    const decoded = jwtService.verify(token, { secret: 'test-access-secret' });

    expect(decoded).not.toHaveProperty('email');
    expect(decoded).not.toHaveProperty('passwordHash');
    expect(decoded).not.toHaveProperty('password');
  });
});
