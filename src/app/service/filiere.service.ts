import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Filiere } from '../model/filiere';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class FiliereService {
  private apiUrl = `${environment.apiUrl}/filieres`;

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

  getAllFilieres(): Observable<Filiere[]> {
    return this.http.get<ApiResponse<Filiere[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.map(filiere => {
              if (!filiere.description) {
                return {...filiere, description: 'Description non défini'};
              }
              return filiere;
            });
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  getFiliereById(id: string): Observable<Filiere | null> {
    return this.http.get<ApiResponse<Filiere>>(`${this.apiUrl}/${id}`)
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

  createFiliere(filiere: Partial<Filiere>): Observable<Filiere | null> {
    return this.http.post<ApiResponse<Filiere>>(this.apiUrl, filiere)
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

  updateFiliere(id: string, filiere: Partial<Filiere>): Observable<Filiere | null> {
    return this.http.put<ApiResponse<Filiere>>(`${this.apiUrl}/${id}`, filiere)
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

  deleteFiliere(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError)
      );
  }
}
