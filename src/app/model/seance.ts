export interface Seance {
  id: string;
  jour: string;
  creneau: string;
  coursId: string;
  coursNom?: string;
  enseignantNom?: string;
  type: string;
  classeId: string;
  classeNom?: string;
  salleId: string;
  salleNom?: string;
  statut?: string;
  debutSemaine: Date;
  finSemaine: Date;
  anneeId?: string;
  commentaire?: string;
  createdAt?: Date;
}

export interface SeanceDto {
  jour: string;
  creneau: string;
  coursId: string;
  type: string;
  classeId: string;
  salleId: string;
  statut?: string;
  debutSemaine: Date;
  finSemaine: Date;
  anneeId?: string;
  commentaire?: string;
  createdAt?: Date;
}

export interface EmploiDuTemps {
  lundi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  mardi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  mercredi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  jeudi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  vendredi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  samedi: {
    matin: Seance[];
    apresmidi: Seance[];
  };
  dimanche: {
    matin: Seance[];
    apresmidi: Seance[];
  };
}
