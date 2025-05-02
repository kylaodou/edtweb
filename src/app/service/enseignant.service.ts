import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Enseignant } from '../model/enseignant';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class EnseignantService {
  private apiUrl = `${environment.apiUrl}/enseignants`;

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

  // Méthodes pour vérifier l'unicité des champs
  checkDuplicateOnUpdate(id: string, matricule: string, email: string, telephone: string): Observable<{
    matriculeExists: boolean,
    emailExists: boolean,
    telephoneExists: boolean
  }> {
    return this.getAllEnseignants().pipe(
      map(enseignants => {
        return {
          matriculeExists: enseignants.some(e =>
            e.id !== id && e.matricule === matricule
          ),
          emailExists: enseignants.some(e =>
            e.id !== id && e.email === email
          ),
          telephoneExists: enseignants.some(e =>
            e.id !== id && e.telephone === telephone
          )
        };
      })
    );
  }

  getAllEnseignants(): Observable<Enseignant[]> {
    return this.http.get<ApiResponse<Enseignant[]>>(this.apiUrl)
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

  getEnseignantById(id: string): Observable<Enseignant | null> {
    return this.http.get<ApiResponse<Enseignant>>(`${this.apiUrl}/${id}`)
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

  getEnseignantByUserId(userId: string): Observable<Enseignant | null> {
    return this.http.get<ApiResponse<Enseignant>>(`${this.apiUrl}/user/${userId}`)
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

  createEnseignant(enseignant: Partial<Enseignant>): Observable<Enseignant | null> {
    return this.http.post<ApiResponse<Enseignant>>(this.apiUrl, enseignant)
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

  updateEnseignant(id: string, enseignant: Partial<Enseignant>): Observable<Enseignant | null> {
    return this.http.put<ApiResponse<Enseignant>>(`${this.apiUrl}/${id}`, enseignant)
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

  deleteEnseignant(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError)
      );
  }
}
