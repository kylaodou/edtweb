import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { ApiResponse } from '../model/apiResponse';
import { Disponibilite, DisponibiliteDto } from '../model/disponibilite';
import { EnseignantService } from './enseignant.service';

export interface EnseignantDisponible {
  enseignantId: string;
  nom: string;
  prenom: string;
  email: string;
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisponibiliteService {
  private apiUrl = `${environment.apiUrl}/disponibilites`;

  constructor(private http: HttpClient, private enseignantService: EnseignantService) { }

  getAllDisponibilites(): Observable<Disponibilite[]> {
    console.log('getAllDisponibilites - Récupération de toutes les disponibilités');

    const url = `${this.apiUrl}`;
    console.log('getAllDisponibilites - URL complète:', url);

    return this.http.get<ApiResponse<Disponibilite[]>>(url).pipe(
      map(response => {
        console.log('getAllDisponibilites - Réponse API:', response);
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des disponibilités:', error);
        return of([]);
      })
    );
  }

  getDisponibiliteById(id: string): Observable<Disponibilite | null> {
    return this.http.get<ApiResponse<Disponibilite>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<Disponibilite | null>('getDisponibiliteById', null))
      );
  }

  getDisponibilitesByEnseignant(enseignantId: string): Observable<Disponibilite[]> {
    return this.http.get<ApiResponse<Disponibilite[]>>(`${this.apiUrl}/enseignant/${enseignantId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Disponibilite[]>('getDisponibilitesByEnseignant', []))
      );
  }

  getDisponibilitesByJour(jour: string): Observable<Disponibilite[]> {
    return this.http.get<ApiResponse<Disponibilite[]>>(`${this.apiUrl}/jour/${jour}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Disponibilite[]>('getDisponibilitesByJour', []))
      );
  }

  getDisponibilitesBySemaine(debutSemaine: Date, finSemaine: Date): Observable<Disponibilite[]> {
    console.log('getDisponibilitesBySemaine - Dates reçues:', { debutSemaine, finSemaine });

    // Formater les dates pour l'API
    const debutSemaineStr = this.formatDate(debutSemaine);
    const finSemaineStr = this.formatDate(finSemaine);

    console.log('getDisponibilitesBySemaine - Dates formatées:', { debutSemaineStr, finSemaineStr });

    // Pour le moment, récupérons toutes les disponibilités et filtrons côté client
    return this.getAllDisponibilites().pipe(
      map(disponibilites => {
        console.log('Toutes les disponibilités récupérées:', disponibilites);

        // Si nous avons des dates, filtrons les disponibilités pour la semaine spécifiée
        if (debutSemaine && finSemaine) {
          const debutSemaineDate = new Date(debutSemaine);
          const finSemaineDate = new Date(finSemaine);

          return disponibilites.filter(d => {
            // Si la disponibilité a des dates de semaine, vérifions qu'elles correspondent
            if (d.debutSemaine && d.finSemaine) {
              const dispoDebutSemaine = new Date(d.debutSemaine);
              const dispoFinSemaine = new Date(d.finSemaine);

              // Vérifier si les périodes se chevauchent
              const overlap = (dispoDebutSemaine <= finSemaineDate) && (dispoFinSemaine >= debutSemaineDate);
              console.log(`Disponibilité ${d.id} - Période: ${dispoDebutSemaine} à ${dispoFinSemaine}, overlap: ${overlap}`);
              return overlap;
            }

            // Si pas de dates spécifiées dans la disponibilité, on la garde
            return true;
          });
        }

        // Si pas de dates spécifiées, on renvoie toutes les disponibilités
        return disponibilites;
      })
    );
  }

  getDisponibilitesByEnseignantAndSemaine(enseignantId: string, debutSemaine: Date, finSemaine: Date): Observable<Disponibilite[]> {
    let params = new HttpParams()
      .set('debutSemaine', debutSemaine.toISOString().split('T')[0])
      .set('finSemaine', finSemaine.toISOString().split('T')[0]);

    return this.http.get<ApiResponse<Disponibilite[]>>(`${this.apiUrl}/enseignant/${enseignantId}/semaine`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Disponibilite[]>('getDisponibilitesByEnseignantAndSemaine', []))
      );
  }

  getDisponibilitesByEnseignantAndCreneau(enseignantId: string, creneauId: string): Observable<Disponibilite[]> {
    return this.http.get<ApiResponse<Disponibilite[]>>(`${this.apiUrl}/enseignant/${enseignantId}/creneau/${creneauId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Disponibilite[]>('getDisponibilitesByEnseignantAndCreneau', []))
      );
  }

  getEnseignantsDisponiblesByJourEtCreneau(jour: string, creneau: string, debutSemaine: Date, finSemaine: Date): Observable<EnseignantDisponible[]> {
    // Ajouter des logs pour déboguer
    console.log('Recherche des enseignants disponibles pour:', { jour, creneau, debutSemaine, finSemaine });

    // Utiliser getAllDisponibilites au lieu de getDisponibilitesBySemaine pour éviter les problèmes de filtrage par date
    return this.getAllDisponibilites().pipe(
      switchMap(disponibilites => {
        console.log('Disponibilités récupérées après filtrage par date:', disponibilites);

        // Normaliser le format du jour pour la comparaison (tout en minuscule)
        const jourNormalized = jour.toLowerCase();
        console.log('Jour normalisé pour comparaison:', jourNormalized);

        // Filtrer les disponibilités pour le jour et le créneau spécifiés
        const disponibilitesFiltered = disponibilites.filter(d => {
          // Normaliser le jour de la disponibilité aussi
          const dispoJour = d.jour.toLowerCase();

          // Vérifier si le créneau correspond (attention aux différents formats possibles)
          let creneauMatch = false;
          if (creneau === '14H-18H' && d.creneauId === '14H-18H') {
            // Cas spécial: l'application utilise 14H-18H mais la BD utilise 14H-18H
            creneauMatch = true;
          } else {
            creneauMatch = (d.creneauId === creneau);
          }

          const match = (dispoJour === jourNormalized) &&
                       creneauMatch &&
                       (d.disponible === true);

          console.log(`Disponibilité ${d.id} - jour: ${d.jour} (${dispoJour}), creneau: ${d.creneauId}, disponible: ${d.disponible}, match: ${match}`);
          return match;
        });

        console.log('Disponibilités filtrées par jour et créneau:', disponibilitesFiltered);

        if (disponibilitesFiltered.length === 0) {
          console.log('Aucun enseignant disponible trouvé pour ce jour et ce créneau');
          return of([]);
        }

        // Récupérer les informations des enseignants un par un
        const enseignantObservables = disponibilitesFiltered.map(d =>
          this.enseignantService.getEnseignantById(d.enseignantId).pipe(
            map(enseignant => {
              console.log(`Enseignant récupéré pour ID ${d.enseignantId}:`, enseignant);
              if (enseignant) {
                return {
                  enseignantId: d.enseignantId,
                  nom: enseignant.nom,
                  prenom: enseignant.prenom,
                  email: enseignant.email
                } as EnseignantDisponible;
              }
              console.log(`Aucun enseignant trouvé pour l'ID ${d.enseignantId}`);
              return null;
            })
          )
        );

        // Combiner les résultats
        return forkJoin(enseignantObservables).pipe(
          map(enseignants => {
            const filteredEnseignants = enseignants.filter(e => e !== null) as EnseignantDisponible[];
            console.log('Enseignants disponibles finaux:', filteredEnseignants);
            return filteredEnseignants;
          })
        );
      })
    );
  }

  createDisponibilite(disponibilite: DisponibiliteDto): Observable<{ success: boolean; data?: Disponibilite; message?: string }> {
    return this.http.post<ApiResponse<Disponibilite>>(this.apiUrl, disponibilite)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la création' };
        }),
        catchError((error: HttpErrorResponse) => {
          return of({
            success: false,
            message: error.error?.message || 'Erreur lors de la création de la disponibilité'
          });
        })
      );
  }

  updateDisponibilite(id: string, disponibilite: DisponibiliteDto): Observable<{ success: boolean; data?: Disponibilite; message?: string }> {
    return this.http.put<ApiResponse<Disponibilite>>(`${this.apiUrl}/${id}`, disponibilite)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la mise à jour' };
        }),
        catchError((error: HttpErrorResponse) => {
          return of({
            success: false,
            message: error.error?.message || 'Erreur lors de la mise à jour de la disponibilité'
          });
        })
      );
  }

  deleteDisponibilite(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteDisponibilite', false))
      );
  }

  // Formater une date au format YYYY-MM-DD
  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      return of(result as T);
    };
  }
}
