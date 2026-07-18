import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { ERROR_CODES } from '../common/errors/error-codes';
import { CreateUserInput } from './dto/create-user.input';
import { AuthUser, PublicUser } from './models/user.model';
import { UsersRepository } from './users.repository';

/**
 * Logique applicative utilisateur, limitée aux opérations internes nécessaires
 * à la future authentification.
 *
 * Aucun endpoint public, aucun register public, aucune logique de hashing :
 * le service reçoit un `passwordHash` déjà produit. Les retours publics
 * (PublicUser) n'exposent jamais le `passwordHash`.
 */
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** Normalisation de l'email : suppression des espaces et passage en minuscule. */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string): Promise<PublicUser | null> {
    const user = await this.usersRepository.findByEmail(UsersService.normalizeEmail(email));

    return user ? UsersService.toPublicUser(user) : null;
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.usersRepository.findById(id);

    return user ? UsersService.toPublicUser(user) : null;
  }

  /**
   * Usage authentification uniquement : inclut le `passwordHash`.
   * Ne jamais exposer le résultat via une API publique ni le journaliser.
   */
  async findAuthUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.usersRepository.findByEmail(UsersService.normalizeEmail(email));

    return user ? UsersService.toAuthUser(user) : null;
  }

  async emailExists(email: string): Promise<boolean> {
    return this.usersRepository.existsByEmail(UsersService.normalizeEmail(email));
  }

  /**
   * Crée un utilisateur à partir d'un `passwordHash` déjà produit.
   * Lève une erreur générique si l'email est déjà utilisé.
   */
  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const email = UsersService.normalizeEmail(input.email);

    if (await this.usersRepository.existsByEmail(email)) {
      throw new ConflictException({
        code: ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        message: 'A user with this email already exists.',
      });
    }

    const user = await this.usersRepository.create({
      email,
      passwordHash: input.passwordHash,
      status: input.status,
    });

    return UsersService.toPublicUser(user);
  }

  private static toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deactivatedAt: user.deactivatedAt,
    };
  }

  private static toAuthUser(user: User): AuthUser {
    return {
      ...UsersService.toPublicUser(user),
      passwordHash: user.passwordHash,
    };
  }
}
