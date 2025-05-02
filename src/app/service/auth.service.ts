import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { FacebookAuthProvider } from '@angular/fire/auth'; // Ajoutez cet import

// Import des modules Firebase v9+
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  /**
   * Register a new user
   * @param userData User registration data
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData);
  }

  /**
   * Verify user account with code
   * @param email User email
   * @param code Verification code
   */
  verifyCode(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/verify`, {
      email,
      code
    });
  }

  /**
   * Resend verification code
   * @param email User email
   */
  resendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/resend-code`, {
      email
    });
  }

  /**
   * Login user
   * @param credentials User login credentials
   */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials);
  }

  /**
   * Login with Google
   */
  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();

    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => {
        if (!result.user || !result.user.email) {
          return throwError(() => new Error('Échec de connexion avec Google'));
        }

        const email = result.user.email;

        // Vérifie d'abord le statut de l'utilisateur
        return this.checkUserStatus(email).pipe(
          switchMap(statusResponse => {
            if (!statusResponse.success) {
              return throwError(() => new Error(statusResponse.message));
            }

            // Si le statut est OK, récupérer les détails utilisateur
            return this.getUserDetails(email).pipe(
              switchMap(userDetails => {
                if (!userDetails.success) {
                  return throwError(() => new Error(userDetails.message));
                }

                // Vérifier le rôle de l'utilisateur
                const userRole = userDetails.data.user.role;
                if (userRole !== 'ADMINISTRATION' && userRole !== 'SUPERADMIN') {
                  return throwError(() => new Error('Vous n\'êtes pas autorisé à vous connecter à cette interface.'));
                }

                // Générer notre propre "token" simplifié pour les sessions Google
                // En pratique, vous pourriez vouloir utiliser le token Firebase
                const googleSession = {
                  token: result.user.uid, // Utiliser l'UID comme token simplifié
                  data: userDetails.data
                };

                return of(googleSession);
              })
            );
          })
        );
      }),

      catchError(error => {
        console.error('Erreur de connexion Google:', error);
        if (error?.code) {
          if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
            return throwError(() => new Error('Vous avez annulé votre connexion Google.'));
          }
          if (error.code === 'auth/account-exists-with-different-credential') {
            return throwError(() => new Error(
              'Vous avez déjà utilisé Google ou un autre moyen pour ce compte. Connectez-vous avec cette méthode.'
            ));
          }
        }
        // Si c'est déjà une erreur avec un message lisible, garde-le
        if (error instanceof Error && error.message) {
          return throwError(() => error); // On garde le message : "Vous n'êtes pas autorisé..."
        }

        // Si c'est une réponse HTTP avec un message personnalisé
        if (error?.error?.message) {
          return throwError(() => new Error(error.error.message));
        }

        // Sinon, message par défaut
        return throwError(() => new Error('Échec de connexion avec Google. Veuillez réessayer.'));
      })

    )

  }

  loginWithFacebook(): Observable<any> {
    const provider = new FacebookAuthProvider();

    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => {
        if (!result.user || !result.user.email) {
          return throwError(() => new Error('Échec de connexion avec Facebook'));
        }

        const email = result.user.email;

        // Vérifie d'abord le statut de l'utilisateur
        return this.checkUserStatus(email).pipe(
          switchMap(statusResponse => {
            if (!statusResponse.success) {
              return throwError(() => new Error(statusResponse.message));
            }

            // Si le statut est OK, récupérer les détails utilisateur
            return this.getUserDetails(email).pipe(
              switchMap(userDetails => {
                if (!userDetails.success) {
                  return throwError(() => new Error(userDetails.message));
                }

                // Vérifier le rôle de l'utilisateur
                const userRole = userDetails.data.user.role;
                if (userRole !== 'ADMINISTRATION' && userRole !== 'SUPERADMIN') {
                  return throwError(() => new Error('Vous n\'êtes pas autorisé à vous connecter à cette interface.'));
                }

                // Générer notre propre "token" simplifié pour les sessions Facebook
                const facebookSession = {
                  token: result.user.uid,
                  data: userDetails.data
                };

                return of(facebookSession);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Erreur de connexion Facebook:', error);

        // Cas spécifique: même email, méthode d'authentification différente
        if (error?.code) {
          if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
            return throwError(() => new Error('Vous avez annulé votre connexion Facebook.'));
          }
          if (error.code === 'auth/account-exists-with-different-credential') {
            return throwError(() => new Error(
              'Vous avez déjà utilisé Facebook ou un autre moyen pour ce compte. Connectez-vous avec cette méthode.'
            ));
          }
        }

        // Les autres cas d'erreurs restent inchangés...
        if (error instanceof Error && error.message) {
          return throwError(() => error);
        }

        if (error?.error?.message) {
          return throwError(() => new Error(error.error.message));
        }

        return throwError(() => new Error('Échec de connexion avec Facebook. Veuillez réessayer.'));
      })
    );
  }

  /**
   * Check user account status
   * @param email User email
   */
  checkUserStatus(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/status?email=${email}`);
  }

  /**
   * Get user details by email
   * @param email User email
   */
  getUserDetails(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/userDetails?email=${email}`);
  }

  /**
   * Store user token in localStorage
   * @param token JWT token
   */
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Store user data in localStorage
   * @param userData User data object
   */
  setUserData(userData: any): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  /**
   * Get user data from localStorage
   */
  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get user role from stored data
   */
// Mettre à jour cette méthode pour mieux gérer les différentes structures
getUserRole(): string | null {
  // D'abord essayer de récupérer le rôle depuis user_data (structure standard)
  const userData = this.getUserData();
  if (userData?.user?.role) {
    return userData.user.role;
  }

  // Ensuite essayer depuis loggedUser si disponible
  const loggedUserStr = localStorage.getItem('loggedUser');
  if (loggedUserStr) {
    try {
      const loggedUser = JSON.parse(loggedUserStr);
      if (loggedUser?.role) {
        return loggedUser.role;
      }
    } catch (e) {
      console.error('Erreur lors du parsing de loggedUser:', e);
    }
  }

  // Si tout échoue, retourner null
  return null;
}

// Ajouter cette méthode pour vérifier si l'utilisateur a un rôle spécifique
hasRole(role: string): boolean {
  const userRole = this.getUserRole();
  return userRole === role;
}

// Ajouter cette méthode pour vérifier si l'utilisateur a accès à un élément
hasAccess(menuItem: string): boolean {
  const userRole = this.getUserRole();

  if (!userRole) return false;

  if (userRole === 'SUPERADMIN') {
    return true; // Le SUPERADMIN a accès à tout
  }

  if (userRole === 'ADMINISTRATION') {
    // Liste des éléments auxquels l'ADMINISTRATION n'a pas accès
    const restrictedItems = [
      'administration',
      'validation-comptes',
      'utilisateurs',
      'parent',
      'salles',
      'filieres'
    ];

    return !restrictedItems.includes(menuItem);
  }

  // Ajouter d'autres rôles ici si nécessaire

  return false; // Par défaut, refuser l'accès
}

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user has required role
   * @param requiredRoles Array of allowed roles
   */
  hasRequiredRole(requiredRoles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? requiredRoles.includes(userRole) : false;
  }

  /**
   * Log out user and clear all localStorage
   */
  logout(): void {
    // Déconnexion de Firebase Auth
    this.auth.signOut();
    // Clear all localStorage items
    localStorage.clear();
  }
}
