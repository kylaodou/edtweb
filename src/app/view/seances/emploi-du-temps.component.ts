import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { SeanceService } from '../../service/seance.service';
import { ClasseService } from '../../service/classe.service';
import { CoursService } from '../../service/cours.service';
import { SalleService } from '../../service/salle.service';
import { EnseignantService } from '../../service/enseignant.service';
import { AnneeAcademiqueService } from '../../service/annee-academique.service';
import { Seance, EmploiDuTemps } from '../../model/seance';
import { Classe } from '../../model/classe';
import { Cours } from '../../model/cours';
import { Salle } from '../../model/salle';
import { AnneeAcademique } from '../../model/annee-academique';
import { Enseignant } from '../../model/enseignant';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-emploi-du-temps',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './emploi-du-temps.component.html',
  styleUrls: ['./emploi-du-temps.component.css'],
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
export class EmploiDuTempsComponent implements OnInit {
  isLoading = true;
  showDetails = false;
  selectedSeance: Seance | null = null;

  // Données pour le calendrier
  currentWeekStart: Date = new Date();
  currentWeekEnd: Date = new Date();
  jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  creneaux = ['8H-12H', '14H-18H'];

  // Données pour le filtrage
  classes: Classe[] = [];
  selectedClasseId: string = '';
  selectedClasse: Classe | null = null;

  // Données pour l'emploi du temps
  emploiDuTemps: EmploiDuTemps | null = null;

  // Données pour les détails
  cours: Cours[] = [];
  salles: Salle[] = [];
  enseignants: Enseignant[] = [];

  // Données pour l'année académique
  anneeAcademique: AnneeAcademique | null = null;

  // Compteurs pour les types de séances
  countCT: number = 0;
  countTD: number = 0;
  countTP: number = 0;

  @ViewChild('emploiDuTempsContent') emploiDuTempsContent!: ElementRef;

  constructor(
    private seanceService: SeanceService,
    private classeService: ClasseService,
    private coursService: CoursService,
    private salleService: SalleService,
    private enseignantService: EnseignantService,
    private anneeAcademiqueService: AnneeAcademiqueService
  ) {
    this.initWeekDates();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;

    // Charger l'année académique active
    this.anneeAcademiqueService.getActiveAnneeAcademique().subscribe({
      next: (annee) => {
        this.anneeAcademique = annee;

        // Charger les classes
        this.classeService.getAllClasses().subscribe({
          next: (classes) => {
            this.classes = classes;
            if (classes.length > 0) {
              this.selectedClasseId = classes[0].id;
              this.selectedClasse = classes[0];
            }

            // Charger les cours
            this.coursService.getAllCours().subscribe({
              next: (cours) => {
                this.cours = cours;

                // Charger les salles
                this.salleService.getAllSalles().subscribe({
                  next: (salles) => {
                    this.salles = salles;

                    // Charger les enseignants
                    this.enseignantService.getAllEnseignants().subscribe({
                      next: (enseignants) => {
                        this.enseignants = enseignants;

                        // Charger les séances pour la classe sélectionnée et la semaine en cours
                        this.loadEmploiDuTemps();
                      },
                      error: (error) => {
                        console.error('Erreur lors du chargement des enseignants', error);
                        this.isLoading = false;
                        this.showErrorMessage('Impossible de charger les enseignants');
                      }
                    });
                  },
                  error: (error) => {
                    console.error('Erreur lors du chargement des salles', error);
                    this.isLoading = false;
                    this.showErrorMessage('Impossible de charger les salles');
                  }
                });
              },
              error: (error) => {
                console.error('Erreur lors du chargement des cours', error);
                this.isLoading = false;
                this.showErrorMessage('Impossible de charger les cours');
              }
            });
          },
          error: (error) => {
            console.error('Erreur lors du chargement des classes', error);
            this.isLoading = false;
            this.showErrorMessage('Impossible de charger les classes');
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'année académique', error);
        this.isLoading = false;
        this.showErrorMessage('Impossible de charger l\'année académique');
      }
    });
  }

  loadEmploiDuTemps(): void {
    if (!this.selectedClasseId) {
      this.isLoading = false;
      return;
    }

    // Mettre à jour la classe sélectionnée
    this.selectedClasse = this.classes.find(c => c.id === this.selectedClasseId) || null;

    // Réinitialiser les compteurs
    this.countCT = 0;
    this.countTD = 0;
    this.countTP = 0;

    // Format de date pour l'API
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    };

    const startDate = formatDate(this.currentWeekStart);
    const endDate = formatDate(this.currentWeekEnd);

    this.seanceService.getEmploiDuTemps(this.selectedClasseId, startDate, endDate).subscribe({
      next: (seances: EmploiDuTemps) => {
        this.emploiDuTemps = seances;

        // Compter les types de séances
        this.countSeanceTypes();

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'emploi du temps', error);
        this.isLoading = false;
        this.showErrorMessage('Impossible de charger l\'emploi du temps');
      }
    });
  }

  countSeanceTypes(): void {
    if (!this.emploiDuTemps) return;

    this.countCT = 0;
    this.countTD = 0;
    this.countTP = 0;

    // Parcourir tous les jours et créneaux pour compter les types de séances
    this.jours.forEach(jour => {
      const jourKey = jour.toLowerCase() as keyof EmploiDuTemps;

      // Matin
      this.emploiDuTemps![jourKey].matin.forEach(seance => {
        if (seance.type === 'CT') this.countCT++;
        else if (seance.type === 'TD') this.countTD++;
        else if (seance.type === 'TP') this.countTP++;
      });

      // Après-midi
      this.emploiDuTemps![jourKey].apresmidi.forEach(seance => {
        if (seance.type === 'CT') this.countCT++;
        else if (seance.type === 'TD') this.countTD++;
        else if (seance.type === 'TP') this.countTP++;
      });
    });
  }

  previousWeek(): void {
    this.isLoading = true;
    // Créer de nouvelles instances de Date pour éviter les problèmes de référence
    const newStart = new Date(this.currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);

    const newEnd = new Date(this.currentWeekEnd);
    newEnd.setDate(newEnd.getDate() - 7);

    this.currentWeekStart = newStart;
    this.currentWeekEnd = newEnd;

    console.log('Semaine précédente:',
      this.currentWeekStart.toISOString().split('T')[0],
      'au',
      this.currentWeekEnd.toISOString().split('T')[0]
    );

    this.loadEmploiDuTemps();
  }

  nextWeek(): void {
    this.isLoading = true;
    // Créer de nouvelles instances de Date pour éviter les problèmes de référence
    const newStart = new Date(this.currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);

    const newEnd = new Date(this.currentWeekEnd);
    newEnd.setDate(newEnd.getDate() + 7);

    this.currentWeekStart = newStart;
    this.currentWeekEnd = newEnd;

    console.log('Semaine suivante:',
      this.currentWeekStart.toISOString().split('T')[0],
      'au',
      this.currentWeekEnd.toISOString().split('T')[0]
    );

    this.loadEmploiDuTemps();
  }

  currentWeek(): void {
    this.isLoading = true;
    this.initWeekDates();

    console.log('Semaine actuelle:',
      this.currentWeekStart.toISOString().split('T')[0],
      'au',
      this.currentWeekEnd.toISOString().split('T')[0]
    );

    this.loadEmploiDuTemps();
  }

  initWeekDates(): void {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si c'est dimanche, on recule de 6 jours pour avoir lundi

    // Créer une nouvelle instance de Date
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + diff);
    this.currentWeekStart.setHours(0, 0, 0, 0);

    // Créer une nouvelle instance de Date
    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6); // +6 pour avoir le dimanche
    this.currentWeekEnd.setHours(23, 59, 59, 999);
  }

  onClasseChange(): void {
    this.loadEmploiDuTemps();
  }

  viewSeanceDetails(seance: Seance): void {
    this.selectedSeance = seance;
    this.showDetails = true;
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedSeance = null;
  }

  getSeancesForCreneau(jour: string, creneau: string): Seance[] {
    if (!this.emploiDuTemps) return [];

    const jourKey = jour.toLowerCase() as keyof EmploiDuTemps;
    const creneauKey = creneau.includes('8H-12H') ? 'matin' : 'apresmidi';

    return this.emploiDuTemps[jourKey][creneauKey as 'matin' | 'apresmidi'];
  }

  hasSeances(jour: string, creneau: string): boolean {
    return this.getSeancesForCreneau(jour, creneau).length > 0;
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
    return salle ? `${salle.batiment}${salle.numero}` : 'Salle inconnue';
  }

  getEnseignantNom(coursId: string): string {
    const cours = this.cours.find(c => c.id === coursId);
    if (!cours) return 'Enseignant inconnu';

    const enseignant = this.enseignants.find(e => e.id === cours.enseignantId);
    if (!enseignant) return 'Enseignant inconnu';

    return `${enseignant.titre} ${enseignant.nom} ${enseignant.prenom}`;
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

  formatDate(date: Date): string {
    return date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  }

  getWeekRange(): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const start = this.currentWeekStart.toLocaleDateString('fr-FR', options);
    const end = this.currentWeekEnd.toLocaleDateString('fr-FR', options);
    return `${start} au ${end}`;
  }

  getSemestreInfo(): string {
    if (!this.selectedClasse || !this.anneeAcademique) return '';

    const niveau = this.selectedClasse.niveau;
    const currentDate = new Date();

    // Déterminer le semestre en fonction de la date et du niveau
    let semestreNum = 0;

    // Vérifier si on est dans le premier ou le deuxième semestre de l'année académique
    const dateDebut = new Date(this.anneeAcademique.dateDebut);
    const dateFin = new Date(this.anneeAcademique.dateFin);
    const milieuAnnee = new Date(dateDebut);
    milieuAnnee.setMonth(2); // Mars (mois 2 en JavaScript)
    milieuAnnee.setDate(1);  // Premier jour du mois

    // Premier ou deuxième semestre de l'année académique
    const premierSemestre = currentDate < milieuAnnee;

    // Calculer le numéro du semestre en fonction du niveau
    if (niveau === 'Licence 1') {
      semestreNum = premierSemestre ? 1 : 2;
    } else if (niveau === 'Licence 2') {
      semestreNum = premierSemestre ? 3 : 4;
    } else if (niveau === 'Licence 3') {
      semestreNum = premierSemestre ? 5 : 6;
    } else if (niveau === 'Master 1') {
      semestreNum = premierSemestre ? 7 : 8;
    } else if (niveau === 'Master 2') {
      semestreNum = premierSemestre ? 9 : 10;
    }

    return `SECTION ${this.selectedClasse.nom} SEMESTRE ${semestreNum} ${this.selectedClasse.niveau}`;
  }

  getFullWeekInfo(): string {
    if (!this.anneeAcademique) return '';

    const weekStart = this.formatDate(this.currentWeekStart);
    const weekEnd = this.formatDate(this.currentWeekEnd);

    return `Semaine du ${weekStart} au ${weekEnd} - Année Scolaire ${this.anneeAcademique.intitule}`;
  }

  getAnneeAcademique(): string {
    return this.anneeAcademique ? this.anneeAcademique.intitule : '';
  }

  exportToPDF(): void {
    Swal.fire({
        title: 'Génération du PDF en cours...',
        text: 'Veuillez patienter',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    setTimeout(() => {
        try {
            const selectedClasse = this.classes.find(c => c.id === this.selectedClasseId);
            const classeNom = selectedClasse?.nom || 'Classe';
            const today = new Date().toLocaleDateString('fr-FR');
            const fileName = `EDT_${classeNom.replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`;

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const primaryColor: [number, number, number] = [13, 71, 161]; // Bleu universitaire
            const lineHeight = 4.5;
            const cellPadding = 2;

            // En-tête institutionnel
            pdf.setFillColor(...primaryColor);
            pdf.rect(0, 0, pdfWidth, 30, 'F');

            // Informations gauche
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(11);
            pdf.text('UNIVERSITÉ JOSEPH KI-ZERBO', 15, 12);
            pdf.text('INSTITUT BURKINABÈ DES ARTS ET MÉTIERS (IBAM)', 15, 17);
            pdf.text('Tel : 25-35-67-31/62', 15, 22);

            // Informations droite
            pdf.text(`Année Académique: ${this.getAnneeAcademique()}`, pdfWidth - 15, 12, { align: 'right' });

            // Bannière titre
            pdf.setFillColor(255, 255, 255);
            pdf.rect(10, 32, pdfWidth - 20, 16, 'F');
            pdf.setTextColor(...primaryColor);
            pdf.setFontSize(14);
            const title = this.getSemestreInfo();
            pdf.text(title, pdfWidth / 2, 40, { align: 'center' });

            // Période
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(this.getFullWeekInfo(), pdfWidth / 2, 45, { align: 'center' });

            // Configuration grille
            const startY = 50;
            const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
            const timeSlots = [
                { text: '8H - 12H', key: 'matin' },
                { text: '15H - 18H', key: 'apresmidi' }
            ];
            const dayWidth = (pdfWidth - 40) / days.length;
            const timeColWidth = 20;

            // En-têtes des jours
            days.forEach((day, index) => {
                const x = 30 + index * dayWidth;
                pdf.setFillColor(...primaryColor);
                pdf.rect(x, startY, dayWidth, 8, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(8);
                pdf.text(day.substring(0, 8), x + dayWidth/2, startY + 5.5, { align: 'center' });
            });

            let currentY = startY + 8;

            // Contenu des créneaux
            timeSlots.forEach(slot => {
                // Colonne horaire
                pdf.setFillColor(245, 245, 245);
                pdf.rect(10, currentY, timeColWidth, 45, 'F');
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(9);
                pdf.text(slot.text, 20, currentY + 22.5, { angle: 90, align: 'center' });

                // Contenu des jours
                days.forEach((day, dayIndex) => {
                    const x = 30 + dayIndex * dayWidth;
                    const jourKey = day.toLowerCase();
                    const seances = this.emploiDuTemps?.[jourKey as keyof EmploiDuTemps]?.[slot.key as 'matin' | 'apresmidi'] || [];

                    pdf.setDrawColor(200, 200, 200);
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(x, currentY, dayWidth, 45, 'FD');

                    if (seances.length > 0) {
                        let yPos = currentY + cellPadding;

                        seances.forEach((seance: Seance) => {
                            const maxWidth = dayWidth - 6;
                            let neededHeight = 0;

                            // Bandeau type
                            const couleur = this.hexToRgb(this.getSeanceColor(seance.type));
                            pdf.setFillColor(...couleur);
                            pdf.rect(x, yPos, dayWidth, 8, 'F');

                            // Type séance
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(8);
                            pdf.text(seance.type.toUpperCase(), x + 3, yPos + 5.5);

                            // Cours
                            pdf.setTextColor(0, 0, 0);
                            pdf.setFontSize(9);
                            const coursLines = pdf.splitTextToSize(this.getCoursNom(seance.coursId), maxWidth);
                            coursLines.forEach((line: string, i: number) => {
                                pdf.text(line, x + 3, yPos + 12 + (i * lineHeight));
                            });
                            neededHeight += 12 + (coursLines.length * lineHeight);

                            // Enseignant
                            pdf.setFontSize(8);
                            const enseignantLines = pdf.splitTextToSize(`Prof: ${this.getEnseignantNom(seance.coursId)}`, maxWidth);
                            enseignantLines.forEach((line: string, i: number) => {
                                pdf.text(line, x + 3, yPos + neededHeight + (i * lineHeight));
                            });
                            neededHeight += (enseignantLines.length * lineHeight);

                            // Salle
                            const salleLines = pdf.splitTextToSize(`Salle: ${this.getSalleNom(seance.salleId)}`, maxWidth);
                            salleLines.forEach((line: string, i: number) => {
                                pdf.text(line, x + 3, yPos + neededHeight + (i * lineHeight));
                            });
                            neededHeight += (salleLines.length * lineHeight) + 5;

                            yPos += Math.max(neededHeight, 25); // Hauteur minimale par séance
                        });
                    } else {
                        pdf.setFontSize(9);
                        pdf.setTextColor(150, 150, 150);
                        pdf.text("Aucune séance", x + dayWidth/2, currentY + 22.5, { align: 'center' });
                    }
                });
                currentY += 45; // Hauteur fixe par créneau
            });

            // Pied de page
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(
                `Généré le ${today} - IBAM / Université Joseph Ki-Zerbo`,
                pdfWidth / 2,
                pdfHeight - 10,
                { align: 'center' }
            );

            pdf.save(fileName);
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'PDF généré !',
                text: `Fichier "${fileName}" téléchargé`,
                timer: 3000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Erreur génération PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Échec de génération',
                text: 'Une erreur est survenue lors de la création du PDF',
                confirmButtonText: 'OK'
            });
        }
    }, 500);
}

hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ];
}



  private showErrorMessage(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  deleteSeance(seance: Seance): void {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: 'Êtes-vous sûr de vouloir supprimer cette séance ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.seanceService.deleteSeance(seance.id).subscribe({
          next: (success) => {
            if (success) {
              this.closeDetails();
              this.loadEmploiDuTemps();
              Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Séance supprimée avec succès',
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer la séance'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de la séance', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la suppression de la séance'
            });
          }
        });
      }
    });
  }
}
