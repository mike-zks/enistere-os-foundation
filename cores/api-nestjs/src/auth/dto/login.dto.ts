import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Bornes raisonnables : on borne la longueur pour limiter les abus, sans imposer
// au login les règles de complexité d'une future politique de création.
const EMAIL_MAX_LENGTH = 320;
const PASSWORD_MAX_LENGTH = 256;

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', maxLength: EMAIL_MAX_LENGTH })
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email!: string;

  @ApiProperty({
    description: 'Mot de passe en clair. Jamais journalisé ni renvoyé.',
    format: 'password',
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
