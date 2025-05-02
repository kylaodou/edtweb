import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { SeanceService } from '../../service/seance.service';
import { AnneeAcademiqueService } from '../../service/annee-academique.service';
import { CoursService } from '../../service/cours.service';
import { ClasseService } from '../../service/classe.service';
import { SalleService } from '../../service/salle.service';
import { DisponibiliteService, EnseignantDisponible } from '../../service/disponibilite.service';
import { EnseignantService } from '../../service/enseignant.service';
import { Seance, SeanceDto, EmploiDuTemps } from '../../model/seance';
import { AnneeAcademique } from '../../model/annee-academique';
import { Cours } from '../../model/cours';
import { Classe } from '../../model/classe';
import { Salle } from '../../model/salle';
import { Enseignant } from '../../model/enseignant';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-creation-seances',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './creation-seances.component.html',
  styleUrls: ['./creation-seances.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('zoomIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) rotateX(2deg)' }),
        animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1) rotateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in',
          style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})
export class CreationSeancesComponent implements OnInit {
  seanceForm!: FormGroup;
  isLoading = true;
  showForm = false;
  formSubmitted = false;
  formErrors: any = {};

  // Données pour le formulaire
  anneeAcademique: AnneeAcademique | null = null;
  cours: Cours[] = [];
  classes: Classe[] = [];
  salles: Salle[] = [];

  // Données pour le calendrier
  currentWeekStart: Date = new Date();
  currentWeekEnd: Date = new Date();
  jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  creneaux = ['8H-12H', '14H-18H'];

  // Séances existantes pour la semaine en cours
  emploiDuTemps: EmploiDuTemps | null = null;
  seanceSelectionnee: { jour: string; creneau: string } | null = null;
  seanceEnEdition: Seance | null = null;

  // Types de séances
  typesSeance = ['CT', 'TD', 'TP'];

  // Disponibilités des enseignants
  enseignantsDisponibles: { [jour: string]: { [creneau: string]: EnseignantDisponible[] } } = {};
  showDisponibilites = false;

  // Enseignants pour les séances
  enseignants: { [id: string]: { nom: string, prenom: string, email: string } } = {};

  constructor(
    private fb: FormBuilder,
    private seanceService: SeanceService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private coursService: CoursService,
    private classeService: ClasseService,
    private salleService: SalleService,
    private disponibiliteService: DisponibiliteService,
    private enseignantService: EnseignantService
  ) {
    this.initWeekDates();
  }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.seanceForm = this.fb.group({
      jour: ['', [Validators.required]],
      creneau: ['', [Validators.required]],
      coursId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      classeId: ['', [Validators.required]],
      salleId: ['', [Validators.required]],
      statut: ['Planifiée'],
      commentaire: ['']
    });
  }

  private loadData(): void {
    this.isLoading = true;

    // Charger l'année académique active
    this.anneeAcademiqueService.getActiveAnneeAcademique().subscribe({
      next: (data) => {
        this.anneeAcademique = data;

        // Charger les cours
        this.coursService.getAllCours().subscribe({
          next: (cours) => {
            this.cours = cours;

            // Charger les classes
            this.classeService.getAllClasses().subscribe({
              next: (classes) => {
                this.classes = classes;

                // Charger les salles
                this.salleService.getAllSalles().subscribe({
                  next: (salles) => {
                    this.salles = salles;
                    this.loadSeancesForCurrentWeek();
                    this.loadEnseignantsDisponibles();
                  },
                  error: (error) => {
                    console.error('Erreur lors du chargement des salles', error);
                    this.isLoading = false;
                    this.showErrorMessage('Erreur lors du chargement des salles');
                  }
                });
              },
              error: (error) => {
                console.error('Erreur lors du chargement des classes', error);
                this.isLoading = false;
                this.showErrorMessage('Erreur lors du chargement des classes');
              }
            });
          },
          error: (error) => {
            console.error('Erreur lors du chargement des cours', error);
            this.isLoading = false;
            this.showErrorMessage('Erreur lors du chargement des cours');
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'année académique', error);
        this.isLoading = false;
        this.showErrorMessage('Erreur lors du chargement de l\'année académique');
      }
    });
  }

  loadSeancesForCurrentWeek(): void {
    this.isLoading = true;
    this.seanceService.getSeancesBySemaine(this.currentWeekStart, this.currentWeekEnd).subscribe({
      next: (seances) => {
        console.log('Séances chargées:', seances);
        // Normaliser les jours (première lettre en majuscule, reste en minuscule)
        seances.forEach(seance => {
          if (seance.jour) {
            seance.jour = this.normalizeJour(seance.jour);
          }
        });

        this.emploiDuTemps = this.seanceService.organizeEmploiDuTemps(seances);
        this.isLoading = false;

        // Charger les disponibilités des enseignants pour la semaine
        this.loadEnseignantsDisponibles();

        // Charger les informations des enseignants pour les séances
        this.loadEnseignantsInfo();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des séances', error);
        this.isLoading = false;
        this.showErrorMessage('Une erreur est survenue lors du chargement des séances.');
      }
    });
  }

  private initWeekDates(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustement pour commencer par lundi (0 = dimanche)

    // Définir le début de la semaine (lundi)
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() - diff);
    this.currentWeekStart.setHours(0, 0, 0, 0);

    // Définir la fin de la semaine (dimanche)
    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6);
    this.currentWeekEnd.setHours(23, 59, 59, 999);
  }

  previousWeek(): void {
    this.isLoading = true;
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.currentWeekEnd.setDate(this.currentWeekEnd.getDate() - 7);
    this.loadSeancesForCurrentWeek();
    this.loadEnseignantsDisponibles();
  }

  nextWeek(): void {
    this.isLoading = true;
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.currentWeekEnd.setDate(this.currentWeekEnd.getDate() + 7);
    this.loadSeancesForCurrentWeek();
    this.loadEnseignantsDisponibles();
  }

  currentWeek(): void {
    this.isLoading = true;
    this.initWeekDates();
    this.loadSeancesForCurrentWeek();
    this.loadEnseignantsDisponibles();
  }

  ouvrirFormSeance(jour: string, creneau: string): void {
    this.seanceForm.reset();
    this.seanceForm.patchValue({
      jour: jour,
      creneau: creneau,
      statut: 'Planifiée'
    });

    this.seanceSelectionnee = { jour, creneau };
    this.seanceEnEdition = null;
    this.showForm = true;
    this.formSubmitted = false;
    this.formErrors = {};

    // Charger les enseignants disponibles pour ce créneau
    this.loadEnseignantsDisponiblesForCreneau(jour, creneau);
  }

  loadEnseignantsDisponibles(): void {
    console.log('loadEnseignantsDisponibles - Début du chargement des disponibilités');
    console.log('Semaine courante:', this.currentWeek);

    // Réinitialiser les disponibilités
    this.enseignantsDisponibles = {};

    // Parcourir tous les jours de la semaine
    this.jours.forEach(jour => {
      // Pour chaque créneau horaire
      this.creneaux.forEach(creneau => {
        console.log(`Chargement des disponibilités pour ${jour} ${creneau}`);

        // Utiliser le mapping pour obtenir le créneau correspondant dans la BD
        const creneauBD = this.mapCreneauToDB(creneau);
        console.log(`Créneau dans l'application: ${creneau}, Créneau dans la BD: ${creneauBD}`);

        // Récupérer les enseignants disponibles pour ce jour et ce créneau
        this.disponibiliteService
          .getEnseignantsDisponiblesByJourEtCreneau(
            jour,
            creneauBD, // Utiliser le créneau formaté pour la BD
            this.currentWeekStart,
            this.currentWeekEnd
          )
          .subscribe({
            next: (enseignants) => {
              console.log(`Enseignants disponibles pour ${jour} ${creneau}:`, enseignants);

              // Mettre à jour la liste des enseignants disponibles pour ce jour et ce créneau
              if (!this.enseignantsDisponibles[jour.toLowerCase()]) {
                this.enseignantsDisponibles[jour.toLowerCase()] = {};
              }
              this.enseignantsDisponibles[jour.toLowerCase()][creneau] = enseignants;
            },
            error: (error) => {
              console.error(`Erreur lors du chargement des enseignants disponibles pour ${jour} ${creneau}:`, error);
              // Initialiser avec un tableau vide en cas d'erreur
              if (!this.enseignantsDisponibles[jour.toLowerCase()]) {
                this.enseignantsDisponibles[jour.toLowerCase()] = {};
              }
              this.enseignantsDisponibles[jour.toLowerCase()][creneau] = [];
            }
          });
      });
    });
  }

  loadEnseignantsDisponiblesForCreneau(jour: string, creneau: string): void {
    this.disponibiliteService.getEnseignantsDisponiblesByJourEtCreneau(
      jour,
      creneau,
      this.currentWeekStart,
      this.currentWeekEnd
    ).subscribe(
      enseignants => {
        if (this.enseignantsDisponibles[jour]) {
          this.enseignantsDisponibles[jour][creneau] = enseignants;
        } else {
          this.enseignantsDisponibles[jour] = { [creneau]: enseignants };
        }
      },
      error => {
        console.error(`Erreur lors du chargement des disponibilités pour ${jour} ${creneau}`, error);
        if (this.enseignantsDisponibles[jour]) {
          this.enseignantsDisponibles[jour][creneau] = [];
        } else {
          this.enseignantsDisponibles[jour] = { [creneau]: [] };
        }
      }
    );
  }

  getAvailableTeachersCount(jour: string, creneau: string): number {
    if (!jour || !creneau) return 0;

    // Utiliser directement le jour en minuscule comme dans la méthode loadEnseignantsDisponibles
    const jourNormalized = jour.toLowerCase();

    // Convertir le créneau de l'interface vers le format de la base de données
    const creneauDB = this.mapCreneauToDB(creneau);

    console.log(`getAvailableTeachersCount - jour: ${jour}, jourNormalized: ${jourNormalized}, creneau: ${creneau}, creneauDB: ${creneauDB}`);
    console.log('enseignantsDisponibles:', this.enseignantsDisponibles);

    if (!this.enseignantsDisponibles[jourNormalized] ||
        !this.enseignantsDisponibles[jourNormalized][creneau]) {
      return 0;
    }

    const count = this.enseignantsDisponibles[jourNormalized][creneau].length;
    console.log(`Nombre d'enseignants disponibles pour ${jourNormalized} ${creneau}: ${count}`);
    return count;
  }

  getAvailableTeachers(jour: string, creneau: string): EnseignantDisponible[] {
    if (!jour || !creneau) return [];

    // Utiliser directement le jour en minuscule comme dans la méthode loadEnseignantsDisponibles
    const jourNormalized = jour.toLowerCase();

    // Convertir le créneau de l'interface vers le format de la base de données
    const creneauDB = this.mapCreneauToDB(creneau);

    console.log(`getAvailableTeachers - jour: ${jour}, jourNormalized: ${jourNormalized}, creneau: ${creneau}, creneauDB: ${creneauDB}`);

    if (!this.enseignantsDisponibles[jourNormalized] ||
        !this.enseignantsDisponibles[jourNormalized][creneau]) {
      return [];
    }

    const teachers = this.enseignantsDisponibles[jourNormalized][creneau];
    console.log(`Enseignants disponibles pour ${jourNormalized} ${creneau}:`, teachers);
    return teachers;
  }

  // Charger les informations des enseignants pour les séances
  loadEnseignantsInfo(): void {
    // Récupérer tous les IDs d'enseignants uniques des cours
    const enseignantIds = this.cours
      .map(cours => cours.enseignantId)
      .filter((id, index, self) => id && self.indexOf(id) === index);

    // Pour chaque ID d'enseignant, récupérer les informations
    enseignantIds.forEach(id => {
      if (id) {
        // Utiliser le service EnseignantService pour récupérer les détails de l'enseignant
        this.enseignantService.getEnseignantById(id).subscribe(
          (enseignant: Enseignant | null) => {
            if (enseignant) {
              this.enseignants[id] = {
                nom: enseignant.nom,
                prenom: enseignant.prenom,
                email: enseignant.email
              };
            }
          },
          (error: any) => {
            console.error(`Erreur lors du chargement de l'enseignant ${id}`, error);
          }
        );
      }
    });
  }

  // Normaliser le format du jour (tout en minuscule pour correspondre au format stocké)
  normalizeJour(jour: string): string {
    if (!jour) return '';
    return jour.toLowerCase();
  }

  private showErrorMessage(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  // Méthodes pour la gestion des séances
  getSeancesForCreneau(jour: string, creneau: string): Seance[] {
    if (!this.emploiDuTemps) return [];

    // Normaliser le jour pour la recherche
    const jourNormalized = jour.toLowerCase();

    // Déterminer si c'est matin ou après-midi
    const periode = creneau.includes('8H-12H') ? 'matin' : 'apresmidi';

    // Vérifier si le jour existe dans l'emploi du temps
    if (this.emploiDuTemps[jourNormalized as keyof EmploiDuTemps]) {
      return this.emploiDuTemps[jourNormalized as keyof EmploiDuTemps][periode as 'matin' | 'apresmidi'] || [];
    }

    return [];
  }

  hasSeances(jour: string, creneau: string): boolean {
    const seances = this.getSeancesForCreneau(jour, creneau);
    return seances.length > 0;
  }

  hasAnySeances(): boolean {
    if (!this.emploiDuTemps) return false;

    for (const jour of this.jours) {
      for (const creneau of this.creneaux) {
        if (this.hasSeances(jour, creneau)) {
          return true;
        }
      }
    }
    return false;
  }

  // Méthodes pour compter les séances par type
  getSeancesCountByType(type: string): number {
    if (!this.emploiDuTemps) return 0;

    let count = 0;

    // Parcourir tous les jours et créneaux pour compter les séances du type spécifié
    // Utiliser une vérification de null avant d'appeler Object.keys
    if (this.emploiDuTemps) {
      Object.keys(this.emploiDuTemps).forEach(jour => {
        const jourData = this.emploiDuTemps![jour as keyof EmploiDuTemps];

        if (jourData) {
          // Compter les séances du matin
          jourData.matin.forEach(seance => {
            if (seance.type === type) {
              count++;
            }
          });

          // Compter les séances de l'après-midi
          jourData.apresmidi.forEach(seance => {
            if (seance.type === type) {
              count++;
            }
          });
        }
      });
    }

    return count;
  }

  // Nombre total de séances
  getTotalSeances(): number {
    return this.getSeancesCountByType('CT') +
           this.getSeancesCountByType('TD') +
           this.getSeancesCountByType('TP');
  }

  // Publier toutes les séances (changer leur statut en "Active")
  publishAllSeances(): void {
    if (!this.emploiDuTemps) {
      this.showErrorMessage('Aucune séance à publier');
      return;
    }

    // Confirmation avant de publier
    Swal.fire({
      title: 'Confirmation',
      text: 'Voulez-vous publier toutes les séances de cette semaine ? Cela changera leur statut en "Active".',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        // Collecter toutes les séances
        const allSeances: Seance[] = [];

        // Utiliser une vérification de null avant d'appeler Object.keys
        if (this.emploiDuTemps) {
          Object.keys(this.emploiDuTemps).forEach(jour => {
            const jourData = this.emploiDuTemps![jour as keyof EmploiDuTemps];
            if (jourData) {
              allSeances.push(...jourData.matin, ...jourData.apresmidi);
            }
          });
        }

        // Filtrer les séances qui ne sont pas déjà actives
        const seancesToUpdate = allSeances.filter(seance => seance.statut !== 'Active');

        if (seancesToUpdate.length === 0) {
          this.isLoading = false;
          Swal.fire({
            title: 'Information',
            text: 'Toutes les séances sont déjà publiées',
            icon: 'info'
          });
          return;
        }

        // Créer un tableau de promesses pour toutes les mises à jour
        const updatePromises = seancesToUpdate.map(seance => {
          const seanceDto: SeanceDto = {
            jour: seance.jour,
            creneau: seance.creneau,
            coursId: seance.coursId,
            type: seance.type,
            classeId: seance.classeId,
            salleId: seance.salleId,
            statut: 'Active',
            debutSemaine: seance.debutSemaine instanceof Date ? seance.debutSemaine : new Date(seance.debutSemaine),
            finSemaine: seance.finSemaine instanceof Date ? seance.finSemaine : new Date(seance.finSemaine),
            commentaire: seance.commentaire,
            anneeId: seance.anneeId
          };

          return this.seanceService.updateSeance(seance.id, seanceDto).toPromise();
        });

        // Exécuter toutes les mises à jour
        Promise.all(updatePromises)
          .then(() => {
            this.isLoading = false;
            this.loadSeancesForCurrentWeek();
            Swal.fire({
              title: 'Succès',
              text: `${seancesToUpdate.length} séances ont été publiées avec succès`,
              icon: 'success'
            });
          })
          .catch(error => {
            this.isLoading = false;
            console.error('Erreur lors de la publication des séances', error);
            this.showErrorMessage('Une erreur est survenue lors de la publication des séances');
          });
      }
    });
  }

  // Méthodes pour les disponibilités des enseignants
  hasEnseignantsDisponibles(): boolean {
    if (!this.seanceForm || !this.seanceForm.get('jour') || !this.seanceForm.get('creneau')) {
      console.log('hasEnseignantsDisponibles: Formulaire ou champs manquants');
      return false;
    }

    const jour = this.seanceForm.get('jour')?.value || '';
    const creneau = this.seanceForm.get('creneau')?.value || '';

    if (!jour || !creneau) {
      console.log('hasEnseignantsDisponibles: Jour ou créneau manquant');
      return false;
    }

    const jourNormalized = this.normalizeJour(jour);
    const count = this.getAvailableTeachersCount(jourNormalized, creneau);
    console.log(`hasEnseignantsDisponibles: ${jour} ${creneau} - Nombre d'enseignants: ${count}`);
    console.log('Structure des disponibilités:', this.enseignantsDisponibles);

    return count > 0;
  }

  // Récupérer le nom de l'enseignant pour une séance
  getEnseignantNom(coursId: string): string {
    if (!coursId) return 'Enseignant inconnu';

    const cours = this.cours.find(c => c.id === coursId);
    if (!cours || !cours.enseignantId) return 'Enseignant inconnu';

    const enseignant = this.enseignants[cours.enseignantId];
    if (!enseignant) return 'Enseignant inconnu';

    return `${enseignant.prenom} ${enseignant.nom}`;
  }

  toggleDisponibilites(): void {
    this.showDisponibilites = !this.showDisponibilites;
  }

  afficherDetailsSeance(seance: Seance): void {
    // Récupérer les informations associées
    const cours = this.cours.find(c => c.id === seance.coursId);
    const classe = this.classes.find(c => c.id === seance.classeId);
    const salle = this.salles.find(s => s.id === seance.salleId);
    const enseignantNom = this.getEnseignantNom(seance.coursId);
    const coursNom = this.getCoursNom(seance.coursId);

    // Créer le contenu HTML pour le modal
    const htmlContent = `
      <div class="seance-details-modal">
        <div class="seance-header" style="background: ${this.getSeanceColor(seance.type)}; color: white; padding: 15px; border-radius: 10px 10px 0 0; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 20px;">${coursNom}</h3>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span><i class="fas fa-calendar-day"></i> ${seance.jour}</span>
            <span><i class="fas fa-clock"></i> ${seance.creneau}</span>
          </div>
        </div>

        <div class="seance-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div class="info-item" style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Type</div>
            <div style="display: flex; align-items: center;">
              <span class="badge" style="background: ${this.getSeanceColor(seance.type)}; color: white; padding: 5px 10px; border-radius: 20px; font-size: 14px;">${seance.type}</span>
            </div>
          </div>

          <div class="info-item" style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Statut</div>
            <div style="display: flex; align-items: center;">
              <span class="badge" style="background: ${seance.statut === 'Active' ? '#0acf97' : '#6c757d'}; color: white; padding: 5px 10px; border-radius: 20px; font-size: 14px;">
                ${seance.statut === 'Active' ? 'Publiée' : 'Planifiée'}
              </span>
            </div>
          </div>

          <div class="info-item" style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Classe</div>
            <div style="display: flex; align-items: center;">
              <i class="fas fa-users" style="color: #4a6cf7; margin-right: 8px;"></i>
              <span>${classe ? classe.nom : 'Classe inconnue'}</span>
            </div>
          </div>

          <div class="info-item" style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
            <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Salle</div>
            <div style="display: flex; align-items: center;">
              <i class="fas fa-door-open" style="color: #fa6767; margin-right: 8px;"></i>
              <span>${salle ? `${salle.batiment} ${salle.numero}` : 'Salle inconnue'}</span>
            </div>
          </div>

          <div class="info-item" style="background: #f8f9fa; padding: 10px; border-radius: 8px; grid-column: span 2;">
            <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Enseignant</div>
            <div style="display: flex; align-items: center;">
              <i class="fas fa-user-tie" style="color: #0acf97; margin-right: 8px;"></i>
              <span>${enseignantNom || 'Enseignant non assigné'}</span>
            </div>
          </div>
        </div>

        ${seance.commentaire ? `
        <div class="commentaire" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-weight: bold; color: #6c757d; margin-bottom: 5px;">Commentaire</div>
          <p style="margin: 0; color: #495057;">${seance.commentaire}</p>
        </div>
        ` : ''}

        <div class="seance-dates" style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 10px;">
          <div>Semaine du ${this.formatDate(seance.debutSemaine)} au ${this.formatDate(seance.finSemaine)}</div>
        </div>
      </div>
    `;

    // Afficher le modal avec SweetAlert2
    Swal.fire({
      title: '',
      html: htmlContent,
      showCloseButton: true,
      showConfirmButton: false,
      showDenyButton: seance.statut !== 'Active',
      showCancelButton: seance.statut !== 'Active',
      denyButtonText: '<i class="fas fa-trash-alt"></i> Supprimer',
      cancelButtonText: '<i class="fas fa-edit"></i> Modifier',
      denyButtonColor: '#fa6767',
      cancelButtonColor: '#4a6cf7',
      customClass: {
        popup: 'seance-details-popup',
        denyButton: 'btn-danger',
        cancelButton: 'btn-primary'
      }
    }).then((result) => {
      if (result.isDenied) {
        // Supprimer la séance
        this.supprimerSeance(seance);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Modifier la séance
        this.ouvrirFormModification(seance);
      }
    });
  }

  ouvrirFormModification(seance: Seance): void {
    // Vérifier si la séance est publiée (statut Active)
    if (seance.statut === 'Active') {
      Swal.fire({
        title: 'Modification impossible',
        text: 'Les séances publiées ne peuvent pas être modifiées.',
        icon: 'warning',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'warning-popup'
        }
      });
      return;
    }

    this.seanceForm.reset();
    this.seanceForm.patchValue({
      jour: seance.jour,
      creneau: this.mapCreneauToUI(seance.creneau), // Convertir le créneau de la BD vers l'UI
      coursId: seance.coursId,
      type: seance.type,
      classeId: seance.classeId,
      salleId: seance.salleId,
      statut: seance.statut,
      commentaire: seance.commentaire
    });

    this.seanceSelectionnee = { jour: seance.jour, creneau: this.mapCreneauToUI(seance.creneau) };
    this.seanceEnEdition = seance; // Stocker la séance en cours d'édition
    this.showForm = true;
    this.formSubmitted = false;
    this.formErrors = {};

    // Charger les enseignants disponibles pour ce créneau
    this.loadEnseignantsDisponiblesForCreneau(seance.jour, this.mapCreneauToUI(seance.creneau));
  }

  supprimerSeance(seance: Seance): void {
    // Vérifier si la séance est publiée (statut Active)
    if (seance.statut === 'Active') {
      Swal.fire({
        title: 'Suppression impossible',
        text: 'Les séances publiées ne peuvent pas être supprimées.',
        icon: 'warning',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'warning-popup'
        }
      });
      return;
    }

    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#fa6767',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'delete-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.seanceService.deleteSeance(seance.id).subscribe({
          next: (response: any) => {
            if (response && response.success) {
              // Recharger les séances
              this.loadSeancesForCurrentWeek();

              // Afficher un message de succès
              Swal.fire({
                title: 'Supprimée !',
                text: 'La séance a été supprimée avec succès.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                  popup: 'success-popup'
                }
              });
            } else {
              const message = response && response.message ? response.message : 'Une erreur est survenue lors de la suppression de la séance.';
              this.showErrorMessage(message);
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de la séance', error);
            this.showErrorMessage('Une erreur est survenue lors de la suppression de la séance.');
          }
        });
      }
    });
  }

  getCoursNom(coursId: string): string {
    const cours = this.cours.find(c => c.id === coursId);
    return cours ? cours.intitule : 'Cours inconnu';
  }

  getClasseNom(classeId: string): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : 'Classe inconnue';
  }

  getSalleNom(salleId: string): string {
    const salle = this.salles.find(s => s.id === salleId);
    return salle ? `${salle.batiment} ${salle.numero}` : 'Salle inconnue';
  }

  getSeanceColor(type: string): string {
    switch (type.toUpperCase()) {
      case 'CT':
        return '#4a6cf7'; // Bleu
      case 'TD':
        return '#0acf97'; // Vert
      case 'TP':
        return '#fa6767'; // Rouge
      default:
        return '#6c757d'; // Gris
    }
  }

  formatDate(date: Date | string): string {
    return date ? new Date(date).toLocaleDateString() : '';
  }

  getWeekRange(): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const start = this.currentWeekStart.toLocaleDateString(undefined, options);
    const end = this.currentWeekEnd.toLocaleDateString(undefined, options);
    return `${start} - ${end}`;
  }

  fermerForm(): void {
    this.showForm = false;
    this.seanceSelectionnee = null;
    this.seanceEnEdition = null;
    this.formErrors = {};
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.seanceForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.seanceForm.controls).forEach(key => {
        const control = this.seanceForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formValues = this.seanceForm.value;

    // Normaliser le jour (tout en minuscule pour correspondre au format stocké)
    const jourNormalized = this.normalizeJour(formValues.jour);

    // Créer l'objet SeanceDto
    const seanceDto: SeanceDto = {
      jour: jourNormalized,
      creneau: this.mapCreneauToDB(formValues.creneau),
      coursId: formValues.coursId,
      type: formValues.type,
      classeId: formValues.classeId,
      salleId: formValues.salleId,
      statut: formValues.statut || 'Planifiée',
      debutSemaine: this.currentWeekStart,
      finSemaine: this.currentWeekEnd,
      commentaire: formValues.commentaire
    };

    // Si l'année académique est chargée, l'ajouter à la séance
    if (this.anneeAcademique) {
      seanceDto.anneeId = this.anneeAcademique.id;
    }

    console.log('Création de séance avec les données:', seanceDto);

    // Déterminer s'il s'agit d'une création ou d'une modification
    if (this.seanceEnEdition) {
      // Modification d'une séance existante
      console.log('Modification de séance avec les données:', seanceDto);

      this.seanceService.updateSeance(this.seanceEnEdition.id, seanceDto).subscribe({
        next: (response: any) => {
          if (response && response.success) {
            console.log('Séance modifiée avec succès:', response.data);
            // Fermer le formulaire et recharger les séances
            this.fermerForm();
            this.loadSeancesForCurrentWeek();

            // Afficher un message de succès
            Swal.fire({
              title: 'Succès!',
              text: 'La séance a été modifiée avec succès.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              customClass: {
                popup: 'success-popup'
              }
            });
          } else {
            // Afficher les erreurs
            if (response.errors) {
              this.formErrors = response.errors;
            } else {
              this.showErrorMessage(response.message || 'Une erreur est survenue lors de la modification de la séance.');
            }
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la modification de la séance', error);
          this.showErrorMessage('Une erreur est survenue lors de la modification de la séance.');
        }
      });
    } else {
      // Création d'une nouvelle séance
      console.log('Création de séance avec les données:', seanceDto);

      this.seanceService.createSeance(seanceDto).subscribe({
        next: (response: any) => {
          if (response && response.success) {
            console.log('Séance créée avec succès:', response.data);
            // Fermer le formulaire et recharger les séances
            this.fermerForm();
            this.loadSeancesForCurrentWeek();

            // Afficher un message de succès
            Swal.fire({
              title: 'Succès!',
              text: 'La séance a été créée avec succès.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              customClass: {
                popup: 'success-popup'
              }
            });
          } else {
            // Afficher les erreurs
            if (response.errors) {
              this.formErrors = response.errors;
            } else {
              this.showErrorMessage(response.message || 'Une erreur est survenue lors de la création de la séance.');
            }
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la création de la séance', error);
          this.showErrorMessage('Une erreur est survenue lors de la création de la séance.');
        }
      });
    }
  }

  // Convertir le créneau de l'interface vers le format de la base de données
  mapCreneauToDB(creneau: string): string {
    const creneauxMapping: Record<string, string> = {
      '8H-12H': '8H-12H',   // Même format
      '14H-18H': '14H-18H'  // Format différent
    };
    return creneauxMapping[creneau] || creneau;
  }

  // Convertir le créneau de la base de données vers le format de l'interface
  mapCreneauToUI(creneau: string): string {
    const creneauxMapping: Record<string, string> = {
      '8H-12H': '8H-12H',   // Même format
      '14H-18H': '14H-18H'  // Format différent
    };
    return creneauxMapping[creneau] || creneau;
  }
}
