export interface Administration {
  id: string;
  matricule: string;
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  userId: string;
  createdAt: Date;
}

export interface AdministrationDto {
  matricule: string;
  email: string;
  nom: string;
  prenom: string;
  fonction: string;
  userId?: string;
}
