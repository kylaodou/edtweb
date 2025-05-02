import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { AnneeAcademique, AnneeAcademiqueDto } from '../model/annee-academique';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class AnneeAcademiqueService {
  private apiUrl = `${environment.apiUrl}/annees-academiques`;

  constructor(private http: HttpClient) { }

  getAllAnneeAcademiques(): Observable<AnneeAcademique[]> {
    return this.http.get<ApiResponse<AnneeAcademique[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<AnneeAcademique[]>('getAllAnneeAcademiques', []))
      );
  }

  getActiveAnneeAcademique(): Observable<AnneeAcademique | null> {
    return this.http.get<ApiResponse<AnneeAcademique>>(`${this.apiUrl}/active`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<AnneeAcademique | null>('getActiveAnneeAcademique', null))
      );
  }

  getAnneeAcademiqueById(id: string): Observable<AnneeAcademique | null> {
    return this.http.get<ApiResponse<AnneeAcademique>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<AnneeAcademique | null>('getAnneeAcademiqueById', null))
      );
  }

  createAnneeAcademique(anneeAcademique: AnneeAcademiqueDto): Observable<{ success: boolean; data?: AnneeAcademique; errors?: any; message?: string }> {
    return this.http.post<ApiResponse<AnneeAcademique>>(this.apiUrl, anneeAcademique)
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
            message: 'Erreur lors de la création de l\'année académique'
          });
        })
      );
  }

  updateAnneeAcademique(id: string, anneeAcademique: AnneeAcademiqueDto): Observable<{ success: boolean; data?: AnneeAcademique; errors?: any; message?: string }> {
    return this.http.put<ApiResponse<AnneeAcademique>>(`${this.apiUrl}/${id}`, anneeAcademique)
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
            message: 'Erreur lors de la mise à jour de l\'année académique'
          });
        })
      );
  }

  activateAnneeAcademique(id: string): Observable<{ success: boolean; data?: AnneeAcademique; message?: string }> {
    return this.http.put<ApiResponse<AnneeAcademique>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
          }
          return { success: false, message: response.message || 'Erreur lors de l\'activation' };
        }),
        catchError(this.handleError<{ success: boolean; data?: AnneeAcademique; message?: string }>('activateAnneeAcademique', { success: false, message: 'Erreur lors de l\'activation de l\'année académique' }))
      );
  }

  deleteAnneeAcademique(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteAnneeAcademique', false))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      return of(result as T);
    };
  }
}
