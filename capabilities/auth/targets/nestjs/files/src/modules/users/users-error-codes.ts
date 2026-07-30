// Codes d'erreur du module utilisateurs techniques (périmètre capability Auth).
export const USERS_ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EMAIL_ALREADY_EXISTS: 'USER_EMAIL_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
} as const;

export type UsersErrorCode = (typeof USERS_ERROR_CODES)[keyof typeof USERS_ERROR_CODES];
