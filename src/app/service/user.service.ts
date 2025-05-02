import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { User, UsersDto, UserWithDetails } from '../model/user';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<User[]>('getAllUsers', []))
      );
  }

  // Nouvelle méthode pour récupérer tous les utilisateurs avec leurs détails
  getAllUsersWithDetails(): Observable<UserWithDetails[]> {
    return this.getAllUsers().pipe(
      mergeMap(users => {
        if (users.length === 0) {
          return of([]);
        }

        // Créer un tableau d'observables pour récupérer les détails de chaque utilisateur
        const userDetailsObservables = users.map(user =>
          this.getUserDetails(user.email).pipe(
            // Si getUserDetails échoue pour un utilisateur, on retourne quand même un objet UserWithDetails avec l'utilisateur mais sans détails
            catchError(() => of({ user, details: null }))
          )
        );

        // Combiner tous les résultats
        return forkJoin(userDetailsObservables).pipe(
          map(usersWithDetails => {
            // Filtrer les nulls (au cas où)
            return usersWithDetails.filter(userWithDetail => userWithDetail !== null) as UserWithDetails[];
          })
        );
      }),
      catchError(this.handleError<UserWithDetails[]>('getAllUsersWithDetails', []))
    );
  }

  getInactiveUsers(): Observable<UserWithDetails[]> {
    return this.http.get<ApiResponse<UserWithDetails[]>>(`${this.apiUrl}/inactive`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(this.handleError<UserWithDetails[]>('getInactiveUsers', []))
      );
  }

  getUserById(id: string): Observable<User | null> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<User | null>('getUserById', null))
      );
  }

  getUserByEmail(email: string): Observable<User | null> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/email/${email}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<User | null>('getUserByEmail', null))
      );
  }

  getUserDetails(email: string): Observable<UserWithDetails | null> {
    return this.http.get<ApiResponse<UserWithDetails>>(`${this.apiUrl}/userDetails?email=${email}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(this.handleError<UserWithDetails | null>('getUserDetails', null))
      );
  }

  createUser(user: UsersDto): Observable<{ success: boolean; data?: User; errors?: any; message?: string }> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, user)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
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
            message: 'Erreur lors de la création de l\'utilisateur'
          });
        })
      );
  }

  updateUser(id: string, user: UsersDto): Observable<{ success: boolean; data?: User; errors?: any; message?: string }> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
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
            message: 'Erreur lors de la mise à jour de l\'utilisateur'
          });
        })
      );
  }

  updateProfileImage(id: string, photo: string): Observable<{ success: boolean; photoUrl?: string; message?: string }> {
    return this.http.put<ApiResponse<{ photoUrl: string }>>(`${this.apiUrl}/${id}/photo`, { photo })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: true,
              photoUrl: response.data.photoUrl,
              message: response.message || 'Photo mise à jour avec succès'
            };
          }
          return { success: false, message: response.message || 'Erreur lors de la mise à jour de la photo' };
        }),
        catchError(this.handleError<{ success: boolean; photoUrl?: string; message?: string }>('updateProfileImage', { success: false, message: 'Erreur lors de la mise à jour de la photo' }))
      );
  }

  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false),
        catchError(this.handleError<boolean>('deleteUser', false))
      );
  }

  validateUser(id: string): Observable<{ success: boolean; data?: User; message?: string }> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/validate/${id}`, {})
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
          }
          return { success: false, message: response.message || 'Erreur lors de la validation' };
        }),
        catchError(this.handleError<{ success: boolean; data?: User; message?: string }>('validateUser', { success: false, message: 'Erreur lors de la validation de l\'utilisateur' }))
      );
  }

  invalidateUser(id: string): Observable<{ success: boolean; data?: User; message?: string }> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/invalidate/${id}`, {})
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
          }
          return { success: false, message: response.message || 'Erreur lors de l\'invalidation' };
        }),
        catchError(this.handleError<{ success: boolean; data?: User; message?: string }>('invalidateUser', { success: false, message: 'Erreur lors de l\'invalidation de l\'utilisateur' }))
      );
  }

  checkUserStatus(email: string): Observable<{ success: boolean; status?: string; message?: string }> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/status?email=${email}`)
      .pipe(
        map(response => {
          return {
            success: response.success,
            status: response.data as string,
            message: response.message
          };
        }),
        catchError(this.handleError<{ success: boolean; status?: string; message?: string }>('checkUserStatus', { success: false, message: 'Erreur lors de la vérification du statut' }))
      );
  }

  verifyCode(email: string, code: string): Observable<{ success: boolean; data?: User; message?: string }> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/verify`, { email, code })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return { success: true, data: response.data, message: response.message };
          }
          return { success: false, message: response.message || 'Erreur lors de la vérification du code' };
        }),
        catchError(this.handleError<{ success: boolean; data?: User; message?: string }>('verifyCode', { success: false, message: 'Erreur lors de la vérification du code' }))
      );
  }

  resendVerificationCode(email: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/resend-code`, { email })
      .pipe(
        map(response => {
          return { success: response.success, message: response.message };
        }),
        catchError(this.handleError<{ success: boolean; message?: string }>('resendVerificationCode', { success: false, message: 'Erreur lors de l\'envoi du code de vérification' }))
      );
  }

  login(email: string, password: string): Observable<{ success: boolean; data?: UserWithDetails; token?: string; message?: string }> {
    return this.http.post<ApiResponse<{ user: User; details?: any; token?: string }>>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              success: true,
              data: response.data as UserWithDetails,
              token: (response.data as any).token,
              message: response.message
            };
          }
          return { success: false, message: response.message || 'Erreur lors de la connexion' };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400 && error.error) {
            return of({
              success: false,
              message: error.error.message || 'Veuillez corriger les erreurs'
            });
          }
          return of({
            success: false,
            message: 'Erreur lors de la connexion'
          });
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
