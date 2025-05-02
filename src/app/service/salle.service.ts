import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Salle } from '../model/salle';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class SalleService {
  private apiUrl = `${environment.apiUrl}/salles`;

  constructor(private http: HttpClient) { }

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

  // Méthode pour vérifier si une combinaison numéro/bâtiment existe déjà
  // Cette méthode est utilisée lors de la modification pour vérifier si la nouvelle combinaison existe déjà
  // en excluant la salle en cours de modification
  checkDuplicateOnUpdate(id: string, numero: string, batiment: string): Observable<boolean> {
    return this.getAllSalles().pipe(
      map(salles => {
        // Vérifier si une autre salle (différente de celle qu'on modifie) a la même combinaison numéro/bâtiment
        return salles.some(salle =>
          salle.id !== id &&
          salle.numero === numero &&
          salle.batiment === batiment
        );
      })
    );
  }

  getAllSalles(): Observable<Salle[]> {
    return this.http.get<ApiResponse<Salle[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  getSalleById(id: string): Observable<Salle | null> {
    return this.http.get<ApiResponse<Salle>>(`${this.apiUrl}/${id}`)
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

  getSallesByType(type: string): Observable<Salle[]> {
    return this.http.get<ApiResponse<Salle[]>>(`${this.apiUrl}/type/${type}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  getSallesDisponibles(): Observable<Salle[]> {
    return this.http.get<ApiResponse<Salle[]>>(`${this.apiUrl}/disponibles`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  createSalle(salle: Partial<Salle>): Observable<Salle | null> {
    return this.http.post<ApiResponse<Salle>>(this.apiUrl, salle)
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

  updateSalle(id: string, salle: Partial<Salle>): Observable<Salle | null> {
    return this.http.put<ApiResponse<Salle>>(`${this.apiUrl}/${id}`, salle)
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

  deleteSalle(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError)
      );
  }
}
