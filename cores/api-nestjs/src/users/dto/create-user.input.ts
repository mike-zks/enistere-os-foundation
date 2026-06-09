import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { UserStatus } from '../models/user.model';

/**
 * Entrée interne de création d'utilisateur.
 *
 * - Reçoit un `passwordHash` DÉJÀ produit : aucune logique de hashing ici
 *   (le hashing sera placé dans l'AuthModule — voir src/auth/README.md).
 * - DTO de classe avec class-validator (ADR-003), distinct du modèle Prisma.
 * - Reste interne tant qu'aucun endpoint n'est exposé.
 */
export class CreateUserInput {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  passwordHash!: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
