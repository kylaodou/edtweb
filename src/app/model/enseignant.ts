export class Enseignant {
  id: string = '';
  matricule: string = '';
  nom: string = '';
  prenom: string = '';
  email: string = '';
  telephone: string = '';
  sexe: string = '';
  specialite: string = '';
  titre: string = '';
  userId?: string;  // Champ optionnel qui référence l'utilisateur correspondant
}
