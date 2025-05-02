import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { AuthService } from '../../service/auth.service';
import { CoursService } from '../../service/cours.service';
import { EnseignantService } from '../../service/enseignant.service';
import { SalleService } from '../../service/salle.service';
import { EtudiantService } from '../../service/etudiant.service';
import { SeanceService } from '../../service/seance.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Seance } from '../../model/seance';
import { Cours } from '../../model/cours';

@Component({
  selector: 'app-dashbord',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, FormsModule,DatePipe, NgIf,NgFor],
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.css']
})

export class DashbordComponent implements OnInit {

  currentDate = new Date();
  userName: string = '';
  userSurname: string = '';
  
  // Statistiques
  coursCount: number = 0;
  enseignantsCount: number = 0;
  sallesCount: number = 0;
  etudiantsCount: number = 0;
  
  // Données pour les graphiques
  coursParFiliere: { label: string, count: number }[] = [];
  tauxOccupationSalles: number[] = [0, 0, 0, 0, 0]; // Lundi à Vendredi

  // Prochains cours
  upcomingCourses: any[] = [];

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  timeSlots = [
    { id: 1, time: '8h - 10h' },
    { id: 2, time: '10h - 12h' },
    { id: 3, time: '14h - 16h' },
    { id: 4, time: '16h - 18h' }
  ];

  // Emploi du temps
  coursesData: any = {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {}
  };

  isLoading = {
    stats: true,
    upcomingCourses: true,
    timetable: true,
    charts: true
  };

  constructor(
    private authService: AuthService,
    private coursService: CoursService,
    private enseignantService: EnseignantService,
    private salleService: SalleService,
    private etudiantService: EtudiantService,
    private seanceService: SeanceService
  ) { }

  loadUserData(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.details) {
      this.userName = userData.details.nom || '';
      this.userSurname = userData.details.prenom || '';
    }
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadStatistics();
    this.loadUpcomingCourses();
    this.loadTimetable();
  }

  getCourse(day: string, timeId: number): any {
    // @ts-ignore
    return this.coursesData[day]?.[timeId] || null;
  }

  initCharts(): void {
    // Graphique d'occupation des salles
    const roomUsageCtx = document.getElementById('roomUsageChart') as HTMLCanvasElement;
    if (roomUsageCtx) {
      new Chart(roomUsageCtx, {
        type: 'bar',
        data: {
          labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
          datasets: [{
            label: 'Taux d\'occupation (%)',
            data: this.tauxOccupationSalles,
            backgroundColor: 'rgba(63, 81, 181, 0.7)',
            borderColor: 'rgba(63, 81, 181, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Taux d\'occupation (%)'
              }
            }
          }
        }
      });
    }

    // Graphique de distribution des cours par filière
    const courseDistCtx = document.getElementById('courseDistributionChart') as HTMLCanvasElement;
    if (courseDistCtx) {
      new Chart(courseDistCtx, {
        type: 'doughnut',
        data: {
          labels: this.coursParFiliere.map(c => c.label),
          datasets: [{
            data: this.coursParFiliere.map(c => c.count),
            backgroundColor: [
              'rgba(63, 81, 181, 0.7)',
              'rgba(76, 175, 80, 0.7)',
              'rgba(255, 193, 7, 0.7)',
              'rgba(233, 30, 99, 0.7)',
              'rgba(0, 188, 212, 0.7)',
              'rgba(156, 39, 176, 0.7)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    }
  }

  loadStatistics(): void {
    this.isLoading.stats = true;
    
    forkJoin({
      cours: this.coursService.getAllCours().pipe(catchError(() => of([]))),
      enseignants: this.enseignantService.getAllEnseignants().pipe(catchError(() => of([]))),
      salles: this.salleService.getAllSalles().pipe(catchError(() => of([]))),
      etudiants: this.etudiantService.getAllEtudiants().pipe(catchError(() => of([])))
    }).subscribe(results => {
      this.coursCount = results.cours.length;
      this.enseignantsCount = results.enseignants.length;
      this.sallesCount = results.salles.length;
      this.etudiantsCount = results.etudiants.length;
      
      // Préparer les données pour le graphique de distribution des cours par filière
      this.prepareCoursParFiliere(results.cours);
      
      // Calculer le taux d'occupation des salles
      this.calculateRoomOccupancy();
      
      this.isLoading.stats = false;
    });
  }

  prepareCoursParFiliere(cours: Cours[]): void {
    // Regrouper les cours par filière
    const filiereMap = new Map<string, number>();
    
    cours.forEach(c => {
      const filiere = c.classeNom?.split(' ')[0] || 'Autre';
      filiereMap.set(filiere, (filiereMap.get(filiere) || 0) + 1);
    });
    
    // Convertir la Map en tableau pour le graphique
    this.coursParFiliere = Array.from(filiereMap.entries()).map(([label, count]) => ({ label, count }));
    
    // Initialiser le graphique après avoir préparé les données
    this.initCharts();
  }

  calculateRoomOccupancy(): void {
    this.isLoading.charts = true;
    
    // Obtenir la date de début et de fin de la semaine courante
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 5); // Vendredi
    
    this.seanceService.getSeancesBySemaine(startOfWeek, endOfWeek)
      .subscribe(seances => {
        // Calculer le taux d'occupation par jour
        const seancesParJour = new Map<string, Seance[]>();
        
        // Initialiser les jours
        ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].forEach(jour => {
          seancesParJour.set(jour, []);
        });
        
        // Regrouper les séances par jour
        seances.forEach(seance => {
          const jour = seance.jour.toLowerCase();
          if (seancesParJour.has(jour)) {
            seancesParJour.get(jour)?.push(seance);
          }
        });
        
        // Calculer le taux d'occupation (nombre de séances / (nombre de salles * 4 créneaux))
        this.salleService.getAllSalles().subscribe(salles => {
          const nombreSalles = salles.length || 1; // Éviter la division par zéro
          const nombreCreneaux = 4; // 4 créneaux par jour
          const capaciteMax = nombreSalles * nombreCreneaux;
          
          this.tauxOccupationSalles = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].map((jour, index) => {
            const nombreSeances = seancesParJour.get(jour)?.length || 0;
            return Math.round((nombreSeances / capaciteMax) * 100);
          });
          
          this.isLoading.charts = false;
          this.initCharts();
        });
      });
  }

  loadUpcomingCourses(): void {
    this.isLoading.upcomingCourses = true;
    
    // Obtenir la date d'aujourd'hui et la date dans 7 jours
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    this.seanceService.getSeancesBySemaine(today, nextWeek)
      .subscribe(seances => {
        // Trier les séances par date
        seances.sort((a, b) => {
          const dateA = this.getDateFromJourCreneau(a.jour, a.creneau);
          const dateB = this.getDateFromJourCreneau(b.jour, b.creneau);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Prendre les 5 premières séances
        const upcomingSeances = seances.slice(0, 5);
        
        // Enrichir les séances avec les informations de cours, enseignant et salle
        this.upcomingCourses = upcomingSeances.map(seance => {
          // Déterminer le statut (pour la démonstration)
          const statuses = ['Confirmé', 'En attente', 'Annulé'];
          const statusClasses = ['status-confirmed', 'status-pending', 'status-canceled'];
          const randomIndex = Math.floor(Math.random() * 10) % 3;
          const status = statuses[randomIndex];
          const statusClass = statusClasses[randomIndex];
          
          // Extraire l'heure du créneau
          let time = seance.creneau;
          if (seance.creneau === '8H-12H') {
            time = '08:00 - 12:00';
          } else if (seance.creneau === '14H-18H') {
            time = '14:00 - 18:00';
          }
          
          return {
            name: seance.coursNom || 'Cours sans nom',
            teacher: seance.enseignantNom || 'Enseignant non assigné',
            room: seance.salleNom || 'Salle non assignée',
            date: this.getDateFromJour(seance.jour),
            time: time,
            status: status,
            statusClass: statusClass,
            id: seance.id
          };
        });
        
        this.isLoading.upcomingCourses = false;
      });
  }

  getDateFromJour(jour: string): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    
    const jourMap: {[key: string]: number} = {
      'lundi': 1,
      'mardi': 2,
      'mercredi': 3,
      'jeudi': 4,
      'vendredi': 5,
      'samedi': 6,
      'dimanche': 0
    };
    
    const targetDay = jourMap[jour.toLowerCase()];
    const daysToAdd = (targetDay - dayOfWeek + 7) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    return targetDate;
  }

  getDateFromJourCreneau(jour: string, creneau: string): Date {
    const date = this.getDateFromJour(jour);
    
    // Ajouter l'heure en fonction du créneau
    if (creneau.includes('8H')) {
      date.setHours(8, 0, 0);
    } else if (creneau.includes('14H')) {
      date.setHours(14, 0, 0);
    }
    
    return date;
  }

  loadTimetable(): void {
    this.isLoading.timetable = true;
    
    // Obtenir la date de début et de fin de la semaine courante
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 5); // Vendredi
    
    // Récupérer les séances de la semaine pour l'utilisateur connecté
    this.seanceService.getSeancesBySemaine(startOfWeek, endOfWeek)
      .subscribe(seances => {
        // Réinitialiser les données de l'emploi du temps
        this.coursesData = {
          monday: {},
          tuesday: {},
          wednesday: {},
          thursday: {},
          friday: {}
        };
        
        // Mapper les jours français aux jours anglais
        const jourMapping: {[key: string]: string} = {
          'lundi': 'monday',
          'mardi': 'tuesday',
          'mercredi': 'wednesday',
          'jeudi': 'thursday',
          'vendredi': 'friday'
        };
        
        // Mapper les créneaux aux IDs
        const creneauMapping: {[key: string]: number} = {
          '8H-10H': 1,
          '10H-12H': 2,
          '14H-16H': 3,
          '16H-18H': 4
        };
        
        // Remplir l'emploi du temps avec les séances
        seances.forEach(seance => {
          const jour = jourMapping[seance.jour.toLowerCase()];
          
          // Déterminer l'ID du créneau
          let creneauId = 0;
          if (seance.creneau === '8H-12H') {
            // Diviser en deux créneaux
            creneauId = 1; // Premier créneau
            this.coursesData[jour][creneauId] = {
              name: seance.coursNom || 'Cours sans nom',
              teacher: seance.enseignantNom || 'Enseignant non assigné',
              room: seance.salleNom || 'Salle non assignée',
              type: Math.floor(Math.random() * 5) + 1 // Type aléatoire pour la couleur
            };
            
            creneauId = 2; // Deuxième créneau
            this.coursesData[jour][creneauId] = {
              name: seance.coursNom || 'Cours sans nom',
              teacher: seance.enseignantNom || 'Enseignant non assigné',
              room: seance.salleNom || 'Salle non assignée',
              type: Math.floor(Math.random() * 5) + 1 // Type aléatoire pour la couleur
            };
          } else if (seance.creneau === '14H-18H') {
            // Diviser en deux créneaux
            creneauId = 3; // Premier créneau
            this.coursesData[jour][creneauId] = {
              name: seance.coursNom || 'Cours sans nom',
              teacher: seance.enseignantNom || 'Enseignant non assigné',
              room: seance.salleNom || 'Salle non assignée',
              type: Math.floor(Math.random() * 5) + 1 // Type aléatoire pour la couleur
            };
            
            creneauId = 4; // Deuxième créneau
            this.coursesData[jour][creneauId] = {
              name: seance.coursNom || 'Cours sans nom',
              teacher: seance.enseignantNom || 'Enseignant non assigné',
              room: seance.salleNom || 'Salle non assignée',
              type: Math.floor(Math.random() * 5) + 1 // Type aléatoire pour la couleur
            };
          } else {
            creneauId = creneauMapping[seance.creneau] || 0;
            
            if (creneauId > 0) {
              this.coursesData[jour][creneauId] = {
                name: seance.coursNom || 'Cours sans nom',
                teacher: seance.enseignantNom || 'Enseignant non assigné',
                room: seance.salleNom || 'Salle non assignée',
                type: Math.floor(Math.random() * 5) + 1 // Type aléatoire pour la couleur
              };
            }
          }
        });
        
        this.isLoading.timetable = false;
      });
  }
}
