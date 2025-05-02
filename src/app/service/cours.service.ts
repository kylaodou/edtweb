import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Cours } from '../model/cours';
import { ApiResponse } from '../model/apiResponse';
import { ClasseService } from './classe.service';
import { EnseignantService } from './enseignant.service';

@Injectable({
  providedIn: 'root'
})
export class CoursService {
  private apiUrl = `${environment.apiUrl}/cours`;

  constructor(
    private http: HttpClient,
    private classeService: ClasseService,
    private enseignantService: EnseignantService
  ) { }

  // Méthode pour gérer les erreurs
  private handleError(error: HttpErrorResponse) {
    // Si l'erreur a un corps de réponse, on le retourne
    if (error.error) {
      return throwError(() => error.error);
    }
    // Sinon on crée un message d'erreur générique
    return throwError(() => ({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    }));
  }

  // Méthode pour enrichir les cours avec les noms des enseignants et classes
  private enrichCoursWithNames(cours: Cours[]): Observable<Cours[]> {
    if (cours.length === 0) return of([]);

    const enrichedCours: Cours[] = [];
    const observables = cours.map(c => {
      // Créer un observable combiné pour chaque cours
      return forkJoin({
        classe: this.classeService.getClasseById(c.classeId),
        enseignant: this.enseignantService.getEnseignantById(c.enseignantId)
      }).pipe(
        map(result => {
          // Calculer le volume horaire restant total pour la compatibilité
          const volumeHoraireTotal = (c.vhCT || 0) + (c.vhTD || 0) + (c.vhTP || 0);
          const volumeHoraireRestantTotal = (c.restantVhCT || 0) + (c.restantVhTD || 0) + (c.restantVhTP || 0);
          
          // Créer une copie enrichie du cours
          const enrichedCours: Cours = {
            ...c,
            classeNom: result.classe?.nom || 'Classe inconnue',
            enseignantNom: result.enseignant ? 
              `${result.enseignant.nom} ${result.enseignant.prenom}` : 
              'Enseignant inconnu',
            volumeHoraireRestant: volumeHoraireRestantTotal
          };
          return enrichedCours;
        })
      );
    });

    // Combiner tous les observables
    return forkJoin(observables);
  }

  getAllCours(): Observable<Cours[]> {
    return this.http.get<ApiResponse<Cours[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(cours => this.enrichCoursWithNames(cours)),
        catchError(this.handleError)
      );
  }

  getCoursByClasse(classeId: string): Observable<Cours[]> {
    return this.http.get<ApiResponse<Cours[]>>(`${this.apiUrl}/classe/${classeId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(cours => this.enrichCoursWithNames(cours)),
        catchError(this.handleError)
      );
  }

  getCoursByEnseignant(enseignantId: string): Observable<Cours[]> {
    return this.http.get<ApiResponse<Cours[]>>(`${this.apiUrl}/enseignant/${enseignantId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(cours => this.enrichCoursWithNames(cours)),
        catchError(this.handleError)
      );
  }

  getCoursBySemestre(semestre: string): Observable<Cours[]> {
    return this.http.get<ApiResponse<Cours[]>>(`${this.apiUrl}/semestre/${semestre}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(cours => this.enrichCoursWithNames(cours)),
        catchError(this.handleError)
      );
  }

  getCoursById(id: string): Observable<Cours | null> {
    return this.http.get<ApiResponse<Cours>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        switchMap(cours => {
          if (!cours) return of(null);
          
          return forkJoin({
            classe: this.classeService.getClasseById(cours.classeId),
            enseignant: this.enseignantService.getEnseignantById(cours.enseignantId)
          }).pipe(
            map(result => {
              const volumeHoraireTotal = (cours.vhCT || 0) + (cours.vhTD || 0) + (cours.vhTP || 0);
              const volumeHoraireRestantTotal = (cours.restantVhCT || 0) + (cours.restantVhTD || 0) + (cours.restantVhTP || 0);
              
              return {
                ...cours,
                classeNom: result.classe?.nom || 'Classe inconnue',
                enseignantNom: result.enseignant ? 
                  `${result.enseignant.nom} ${result.enseignant.prenom}` : 
                  'Enseignant inconnu',
                volumeHoraireRestant: volumeHoraireRestantTotal
              };
            })
          );
        }),
        catchError(this.handleError)
      );
  }

  createCours(cours: Partial<Cours>): Observable<Cours | null> {
    return this.http.post<ApiResponse<Cours>>(this.apiUrl, cours)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError)
      );
  }

  updateCours(id: string, cours: Partial<Cours>): Observable<Cours | null> {
    return this.http.put<ApiResponse<Cours>>(`${this.apiUrl}/${id}`, cours)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError)
      );
  }

  deleteCours(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError)
      );
  }

  // Méthode pour vérifier si un code existe déjà (utilisée côté client)
  isCodeExists(code: string): boolean {
    // Cette méthode devrait idéalement faire une requête au serveur
    // Mais pour la validation côté client, on peut implémenter une logique simple
    return false; // À remplacer par une vraie vérification
  }
}
