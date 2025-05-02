import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Administration, AdministrationDto } from '../model/administration';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class AdministrationService {
  private apiUrl = `${environment.apiUrl}/administration`;

  constructor(
    private http: HttpClient
  ) { }

  getAllAdministrations(): Observable<Administration[]> {
    return this.http.get<ApiResponse<Administration[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<Administration[]>('getAllAdministrations', []))
      );
  }

  getAdministrationById(id: string): Observable<Administration | null> {
    return this.http.get<ApiResponse<Administration>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<Administration | null>('getAdministrationById', null))
      );
  }

  getAdministrationByUserId(userId: string): Observable<Administration | null> {
    return this.http.get<ApiResponse<Administration>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<Administration | null>('getAdministrationByUserId', null))
      );
  }

  createAdministration(administration: AdministrationDto): Observable<{ success: boolean; data?: Administration; errors?: any; message?: string }> {
    return this.http.post<ApiResponse<Administration>>(this.apiUrl, administration)
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
            message: 'Erreur lors de la création de l\'administration'
          });
        })
      );
  }

  updateAdministration(id: string, administration: AdministrationDto): Observable<{ success: boolean; data?: Administration; errors?: any; message?: string }> {
    return this.http.put<ApiResponse<Administration>>(`${this.apiUrl}/${id}`, administration)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la mise à jour' };
        }),
        catchError((error: HttpErrorResponse) => {
          // Gérer spécifiquement les erreurs 400 Bad Request qui contiennent les erreurs de validation
          if (error.status === 400 && error.error) {
            return of({
              success: false,
              errors: error.error.errors,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'administration'
          });
        })
      );
  }

  deleteAdministration(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteAdministration', false))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      return of(result as T);
    };
  }
}
