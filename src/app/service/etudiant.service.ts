import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Etudiant, EtudiantsDto } from '../model/etudiant';
import { ApiResponse } from '../model/apiResponse';
import { ClasseService } from './classe.service';

@Injectable({
  providedIn: 'root'
})
export class EtudiantService {
  private apiUrl = `${environment.apiUrl}/etudiants`;

  constructor(
    private http: HttpClient,
    private classeService: ClasseService
  ) { }

  getAllEtudiants(): Observable<Etudiant[]> {
    return this.http.get<ApiResponse<Etudiant[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(etudiants => this.enrichEtudiantsWithClasseNom(etudiants)),
        catchError(this.handleError<Etudiant[]>('getAllEtudiants', []))
      );
  }

  getEtudiantById(id: string): Observable<Etudiant | null> {
    return this.http.get<ApiResponse<Etudiant>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        switchMap(etudiant => {
          if (etudiant) {
            return this.enrichEtudiantWithClasseNom(etudiant);
          }
          return of(null);
        }),
        catchError(this.handleError<Etudiant | null>('getEtudiantById', null))
      );
  }

  getEtudiantByUserId(userId: string): Observable<Etudiant | null> {
    return this.http.get<ApiResponse<Etudiant>>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        switchMap(etudiant => {
          if (etudiant) {
            return this.enrichEtudiantWithClasseNom(etudiant);
          }
          return of(null);
        }),
        catchError(this.handleError<Etudiant | null>('getEtudiantByUserId', null))
      );
  }

  getEtudiantsByClasse(classeId: string): Observable<Etudiant[]> {
    return this.http.get<ApiResponse<Etudiant[]>>(`${this.apiUrl}/classe/${classeId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        switchMap(etudiants => this.enrichEtudiantsWithClasseNom(etudiants)),
        catchError(this.handleError<Etudiant[]>('getEtudiantsByClasse', []))
      );
  }

  createEtudiant(etudiant: EtudiantsDto): Observable<{ success: boolean; data?: Etudiant; errors?: any; message?: string }> {
    return this.http.post<ApiResponse<Etudiant>>(this.apiUrl, etudiant)
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
            message: 'Erreur lors de la création de l\'étudiant'
          });
        })
      );
  }

  updateEtudiant(id: string, etudiant: EtudiantsDto): Observable<{ success: boolean; data?: Etudiant; errors?: any; message?: string }> {
    return this.http.put<ApiResponse<Etudiant>>(`${this.apiUrl}/${id}`, etudiant)
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
            message: 'Erreur lors de la mise à jour de l\'étudiant'
          });
        })
      );
  }

  deleteEtudiant(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteEtudiant', false))
      );
  }

  private enrichEtudiantsWithClasseNom(etudiants: Etudiant[]): Observable<Etudiant[]> {
    if (!etudiants || etudiants.length === 0) {
      return of([]);
    }

    return this.classeService.getAllClasses().pipe(
      map(classes => {
        return etudiants.map(etudiant => {
          const classe = classes.find(c => c.id === etudiant.classeId);
          return {
            ...etudiant,
            classeNom: classe ? classe.nom : 'Classe inconnue'
          };
        });
      }),
      catchError(error => {
        console.error('Erreur lors de l\'enrichissement des étudiants avec les noms de classe', error);
        return of(etudiants);
      })
    );
  }

  private enrichEtudiantWithClasseNom(etudiant: Etudiant | null): Observable<Etudiant | null> {
    if (!etudiant) {
      return of(null);
    }

    return this.classeService.getAllClasses().pipe(
      map(classes => {
        const classe = classes.find(c => c.id === etudiant.classeId);
        return {
          ...etudiant,
          classeNom: classe ? classe.nom : 'Classe inconnue'
        };
      }),
      catchError(error => {
        console.error('Erreur lors de l\'enrichissement de l\'étudiant avec le nom de classe', error);
        return of(etudiant);
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
