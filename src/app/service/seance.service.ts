import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Seance, SeanceDto, EmploiDuTemps } from '../model/seance';
import { ApiResponse } from '../model/apiResponse';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeanceService {
  private apiUrl = `${environment.apiUrl}/seances`;

  constructor(private http: HttpClient) { }

  getAllSeances(): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getAllSeances', []))
      );
  }

  getSeanceById(id: string): Observable<Seance | null> {
    return this.http.get<ApiResponse<Seance>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<Seance | null>('getSeanceById', null))
      );
  }

  getSeancesByClasse(classeId: string): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(`${this.apiUrl}/classe/${classeId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getSeancesByClasse', []))
      );
  }

  getSeancesByEnseignant(enseignantId: string): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(`${this.apiUrl}/enseignant/${enseignantId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getSeancesByEnseignant', []))
      );
  }

  getSeancesBySalle(salleId: string): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(`${this.apiUrl}/salle/${salleId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getSeancesBySalle', []))
      );
  }

  getSeancesByCours(coursId: string): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(`${this.apiUrl}/cours/${coursId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getSeancesByCours', []))
      );
  }

  getSeancesBySemaine(debutSemaine: Date, finSemaine: Date): Observable<Seance[]> {
    // Utiliser getAllSeances et filtrer côté client pour éviter l'erreur d'index Firestore
    return this.getAllSeances().pipe(
      map(seances => {
        return seances.filter(seance => {
          // Convertir les dates en objets Date si elles sont des chaînes
          const debutSeance = seance.debutSemaine instanceof Date
            ? seance.debutSemaine
            : new Date(seance.debutSemaine);

          const finSeance = seance.finSemaine instanceof Date
            ? seance.finSemaine
            : new Date(seance.finSemaine);

          // Vérifier si la séance est dans la plage de dates
          return debutSeance <= finSemaine && finSeance >= debutSemaine;
        });
      }),
      tap(seances => console.log('Séances filtrées par semaine:', seances)),
      catchError(this.handleError<Seance[]>('getSeancesBySemaine', []))
    );
  }

  getEmploiDuTempsParClasseEtSemaine(classeId: string, debutSemaine: Date, finSemaine: Date): Observable<Seance[]> {
    // Utiliser getSeancesByClasse et filtrer côté client pour éviter l'erreur d'index Firestore
    return this.getSeancesByClasse(classeId).pipe(
      map(seances => {
        return seances.filter(seance => {
          // Convertir les dates en objets Date si elles sont des chaînes
          const debutSeance = seance.debutSemaine instanceof Date
            ? seance.debutSemaine
            : new Date(seance.debutSemaine);

          const finSeance = seance.finSemaine instanceof Date
            ? seance.finSemaine
            : new Date(seance.finSemaine);

          // Vérifier si la séance est dans la plage de dates
          return debutSeance <= finSemaine && finSeance >= debutSemaine;
        });
      }),
      tap(seances => console.log('Emploi du temps filtré:', seances)),
      catchError(this.handleError<Seance[]>('getEmploiDuTempsParClasseEtSemaine', []))
    );
  }

  getSeancesByJour(jour: string): Observable<Seance[]> {
    return this.http.get<ApiResponse<Seance[]>>(`${this.apiUrl}/jour/${jour}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Seance[]>('getSeancesByJour', []))
      );
  }

  getEmploiDuTemps(classeId: string, dateDebut: string, dateFin: string): Observable<EmploiDuTemps> {
    // Construire l'URL pour récupérer toutes les séances
    const url = `${this.apiUrl}`;
    
    // Appeler l'API pour obtenir toutes les séances
    return this.http.get<ApiResponse<Seance[]>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          // Filtrer les séances par classe et par plage de dates
          const filteredSeances = response.data.filter(seance => {
            // Vérifier si la séance appartient à la classe demandée
            if (seance.classeId !== classeId) {
              return false;
            }
            
            // Convertir les dates de début et de fin de la semaine demandée
            const debutSemaine = new Date(dateDebut);
            const finSemaine = new Date(dateFin);
            
            // Convertir les dates de la séance
            const debutSeance = new Date(seance.debutSemaine);
            const finSeance = new Date(seance.finSemaine);
            
            // Vérifier si la séance est dans la plage de dates (chevauchement)
            return debutSeance <= finSemaine && finSeance >= debutSemaine;
          });
          
          console.log(`Séances filtrées pour la classe ${classeId} du ${dateDebut} au ${dateFin}:`, filteredSeances.length);
          
          // Organiser les séances filtrées en emploi du temps
          return this.organizeEmploiDuTemps(filteredSeances);
        }
        // Retourner un emploi du temps vide si pas de données
        return this.organizeEmploiDuTemps([]);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'emploi du temps', error);
        // Retourner un emploi du temps vide en cas d'erreur
        return of(this.organizeEmploiDuTemps([]));
      })
    );
  }

  createSeance(seance: SeanceDto): Observable<{ success: boolean; data?: Seance; errors?: any; message?: string }> {
    return this.http.post<ApiResponse<Seance>>(this.apiUrl, seance)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la création' };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400 && error.error) {
            return of({
              success: false,
              errors: error.error.errors,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la création de la séance'
          });
        })
      );
  }

  updateSeance(id: string, seance: SeanceDto): Observable<{ success: boolean; data?: Seance; errors?: any; message?: string }> {
    return this.http.put<ApiResponse<Seance>>(`${this.apiUrl}/${id}`, seance)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la mise à jour' };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400 && error.error) {
            return of({
              success: false,
              errors: error.error.errors,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la mise à jour de la séance'
          });
        })
      );
  }

  deleteSeance(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteSeance', false))
      );
  }

  // Méthode pour organiser les séances en emploi du temps
  organizeEmploiDuTemps(seances: Seance[]): EmploiDuTemps {
    const emploiDuTemps: EmploiDuTemps = {
      lundi: { matin: [], apresmidi: [] },
      mardi: { matin: [], apresmidi: [] },
      mercredi: { matin: [], apresmidi: [] },
      jeudi: { matin: [], apresmidi: [] },
      vendredi: { matin: [], apresmidi: [] },
      samedi: { matin: [], apresmidi: [] },
      dimanche: { matin: [], apresmidi: [] }
    };

    seances.forEach(seance => {
      // Convertir le jour en minuscules pour la cohérence
      const jour = seance.jour.toLowerCase();
      // Déterminer si c'est matin ou après-midi
      const creneau = seance.creneau.includes('8H-12H') ? 'matin' : 'apresmidi';

      // S'assurer que le jour existe dans l'emploi du temps
      if (emploiDuTemps[jour as keyof EmploiDuTemps]) {
        emploiDuTemps[jour as keyof EmploiDuTemps][creneau as 'matin' | 'apresmidi'].push(seance);
      }
    });

    return emploiDuTemps;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      return of(result as T);
    };
  }
}
