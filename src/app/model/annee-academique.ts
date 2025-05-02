export interface AnneeAcademique {
  id: string;
  intitule: string;
  dateDebut: Date;
  dateFin: Date;
  actif: boolean;
  createdAt?: Date;
}

export interface AnneeAcademiqueDto {
  intitule: string;
  dateDebut: Date;
  dateFin: Date;
  actif?: boolean;
}
