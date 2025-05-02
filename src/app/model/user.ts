export enum Roles {
  DELEGUE = 'DELEGUE',
  ETUDIANT = 'ETUDIANT',
  ENSEIGNANT = 'ENSEIGNANT',
  ADMINISTRATION = 'ADMINISTRATION',
  PARENT = 'PARENT',
  SUPERADMIN = 'SUPERADMIN'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  plainPassword?: string;
  actif?: boolean;
  role?: Roles;
  verificationCode?: string;
  verified?: boolean;
  codeExpiryDate?: Date;
  tokenFCM?: string;
  photo?: string;
  dateCreation?: Date;
}

export interface UsersDto {
  email: string;
  password?: string;
  actif?: boolean;
  role?: Roles;
  verificationCode?: string;
  verified?: boolean;
  codeExpiryDate?: Date;
  tokenFCM?: string;
  photo?: string;
  dateCreation?: Date;
}

export interface UserWithDetails {
  user: User;
  details?: any;
}
