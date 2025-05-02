export interface AnneesAcademiques {
  id: string;
  intitule: string;
  dateDebut: Date;
  dateFin: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnneesAcademiquesDto {
  intitule: string;
  dateDebut: Date;
  dateFin: Date;
  isActive?: boolean;
}
