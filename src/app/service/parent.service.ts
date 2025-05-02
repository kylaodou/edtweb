import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Parent, ParentsDto } from '../model/parent';
import { ApiResponse } from '../model/apiResponse';
import { EtudiantService } from './etudiant.service';

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private apiUrl = `${environment.apiUrl}/parents`;

  constructor(
    private http: HttpClient,
    private etudiantService: EtudiantService
  ) { }

  getAllParents(): Observable<Parent[]> {
    return this.http.get<ApiResponse<Parent[]>>(this.apiUrl)
      .pipe(
        tap(response => console.log('API response for getAllParents:', response)),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(parents => this.enrichParentsWithEnfantsNoms(parents)),
        catchError(this.handleError<Parent[]>('getAllParents', []))
      );
  }

  getParentById(id: string): Observable<Parent | null> {
    return this.http.get<ApiResponse<Parent>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => console.log(`API response for getParentById(${id}):`, response)),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        switchMap(parent => {
          if (parent) {
            return this.enrichParentWithEnfantsNoms(parent);
          }
          return of(null);
        }),
        catchError(this.handleError<Parent | null>('getParentById', null))
      );
  }

  getParentByUserId(userId: string): Observable<Parent | null> {
    return this.http.get<ApiResponse<Parent>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        tap(response => console.log(`API response for getParentByUserId(${userId}):`, response)),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        switchMap(parent => {
          if (parent) {
            return this.enrichParentWithEnfantsNoms(parent);
          }
          return of(null);
        }),
        catchError(this.handleError<Parent | null>('getParentByUserId', null))
      );
  }

  getParentsByEnfant(enfantId: string): Observable<Parent[]> {
    return this.http.get<ApiResponse<Parent[]>>(`${this.apiUrl}/enfant/${enfantId}`)
      .pipe(
        tap(response => console.log(`API response for getParentsByEnfant(${enfantId}):`, response)),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(parents => this.enrichParentsWithEnfantsNoms(parents)),
        catchError(this.handleError<Parent[]>('getParentsByEnfant', []))
      );
  }

  createParent(parent: ParentsDto): Observable<{ success: boolean; data?: Parent; errors?: any; message?: string }> {
    console.log('Creating parent with data:', parent);

    return this.http.post<ApiResponse<Parent>>(this.apiUrl, parent)
      .pipe(
        tap(response => console.log('API response for createParent:', response)),
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la création' };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error in createParent:', error);

          if (error.status === 400 && error.error) {
            return of({
              success: false,
              errors: error.error.errors,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la création du parent'
          });
        })
      );
  }

  updateParent(id: string, parent: ParentsDto): Observable<{ success: boolean; data?: Parent; errors?: any; message?: string }> {
    console.log(`Updating parent ${id} with data:`, parent);

    return this.http.put<ApiResponse<Parent>>(`${this.apiUrl}/${id}`, parent)
      .pipe(
        tap(response => console.log(`API response for updateParent(${id}):`, response)),
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data };
          }
          return { success: false, message: response.message || 'Erreur lors de la mise à jour' };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error in updateParent(${id}):`, error);

          if (error.status === 400 && error.error) {
            return of({
              success: false,
              errors: error.error.errors,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la mise à jour du parent'
          });
        })
      );
  }

  deleteParent(id: string): Observable<boolean> {
    console.log(`Deleting parent ${id}`);

    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => console.log(`API response for deleteParent(${id}):`, response)),
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteParent', false))
      );
  }

  private enrichParentsWithEnfantsNoms(parents: Parent[]): Observable<Parent[]> {
    if (!parents || parents.length === 0) {
      return of([]);
    }

    return this.etudiantService.getAllEtudiants().pipe(
      map(etudiants => {
        return parents.map(parent => {
          const enfantsNoms = parent.enfantsIds.map(enfantId => {
            const etudiant = etudiants.find(e => e.id === enfantId);
            return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu';
          });
          return {
            ...parent,
            enfantsNoms
          };
        });
      }),
      catchError(error => {
        console.error('Erreur lors de l\'enrichissement des parents avec les noms des enfants', error);
        return of(parents);
      })
    );
  }

  private enrichParentWithEnfantsNoms(parent: Parent): Observable<Parent> {
    if (!parent || !parent.enfantsIds || parent.enfantsIds.length === 0) {
      return of(parent);
    }

    return this.etudiantService.getAllEtudiants().pipe(
      map(etudiants => {
        const enfantsNoms = parent.enfantsIds.map(enfantId => {
          const etudiant = etudiants.find(e => e.id === enfantId);
          return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu';
        });
        return {
          ...parent,
          enfantsNoms
        };
      }),
      catchError(error => {
        console.error('Erreur lors de l\'enrichissement du parent avec les noms des enfants', error);
        return of(parent);
      })
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      return of(result as T);
    };
  }
}
