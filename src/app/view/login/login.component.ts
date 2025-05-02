import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('passwordInput') passwordInputRef!: ElementRef<HTMLInputElement>;

  loginForm: FormGroup;
  isLoading = false;
  loginError = '';
  formErrors: {[key: string]: string} = {};
  registrationSuccess = '';
  isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if registration success message exists
    if (this.isBrowser) {
      const successMessage = localStorage.getItem('registrationSuccess');
      if (successMessage) {
        this.registrationSuccess = successMessage;
        setTimeout(() => {
          this.registrationSuccess = '';
          localStorage.removeItem('registrationSuccess');
        }, 5000);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadLottieAnimation();
    }
  }

  private loadLottieAnimation(): void {
    // Use dynamic import with proper error handling
    try {
      const lottieContainer = document.getElementById('login-lottie-container');
      if (lottieContainer) {
        import('lottie-web').then((lottieModule) => {
          const lottie = lottieModule.default;
          lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'login.json' // Make sure this path is correct
          });
        }).catch(err => {
          console.error('Erreur de chargement Lottie:', err);
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Lottie:', error);
    }
  }

  onSubmit(): void {
    this.formErrors = {};
    this.loginError = '';

    if (this.loginForm.valid) {
      this.isLoading = true;

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.handleAuthResponse(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleAuthError(error);
        }
      });

    } else {
      // Mark all fields as touched to display validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
  

  loginWithGoogle(): void {
    this.formErrors = {};
    this.loginError = '';
    this.isLoading = true;

    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.token && response.data) {
          // Sauvegarder le token et les données utilisateur
          this.authService.setToken(response.token);
          this.authService.setUserData(response.data);
          this.router.navigate(['/dashbord']);
        } else {
          this.loginError = 'Réponse invalide lors de la connexion avec Google.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (typeof error === 'string') {
          this.loginError = error;
        } else if (error instanceof Error) {
          this.loginError = error.message;
        } else {
          this.loginError = 'Erreur de connexion avec Google. Veuillez réessayer.';
        }
      }
    });
  }

  // Gestion commune de la réponse d'authentification
  private handleAuthResponse(response: any): void {
    // Check for success flag from backend
    if (response && response.success === false) {
      // Handle API error response
      if (response.errors) {
        this.formErrors = response.errors;
      }
      if (response.message) {
        this.loginError = response.message;
      }
      return;
    }

    // Successful login
    if (response.data && response.token) {
      // Vérifier le rôle de l'utilisateur
      const userRole = response.data.user.role;
      if (userRole !== 'ADMINISTRATION' && userRole !== 'SUPERADMIN') {
        this.loginError = 'Vous n\'êtes pas autorisé à vous connecter à cette interface.';
        return;
      }

      // Sauvegarder le token et les données utilisateur
      this.authService.setToken(response.token);
      this.authService.setUserData(response.data);
      this.router.navigate(['/dashbord']);
    } else {
      this.loginError = 'Réponse de serveur invalide. Veuillez réessayer.';
    }
  }

  // Dans login.component.ts
loginWithFacebook(): void {
  this.formErrors = {};
  this.loginError = '';
  this.isLoading = true;

  this.authService.loginWithFacebook().subscribe({
    next: (response) => {
      this.isLoading = false;
      if (response && response.token && response.data) {
        // Sauvegarder le token et les données utilisateur
        this.authService.setToken(response.token);
        this.authService.setUserData(response.data);
        this.router.navigate(['/dashbord']);
      } else {
        this.loginError = 'Réponse invalide lors de la connexion avec Facebook.';
      }
    },
    error: (error) => {
      this.isLoading = false;
      if (typeof error === 'string') {
        this.loginError = error;
      } else if (error instanceof Error) {
        this.loginError = error.message;
      } else {
        this.loginError = 'Erreur de connexion avec Facebook. Veuillez réessayer.';
      }
    }
  });
}

  // Gestion commune des erreurs d'authentification
  private handleAuthError(error: any): void {
    // Handle HTTP error response
    if (error.error) {
      if (error.error.errors) {
        this.formErrors = error.error.errors;
      }
      if (error.error.message) {
        this.loginError = error.error.message;
      } else {
        this.loginError = 'Erreur de connexion. Veuillez réessayer.';
      }
    } else {
      this.loginError = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
    }
  }

  // Helper methods for template
  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (!control) return '';

    if (control.errors?.['required']) {
      return `${controlName === 'email' ? 'Email' : 'Mot de passe'} requis`;
    }

    if (controlName === 'email' && control.errors?.['email']) {
      return 'Format d\'email invalide';
    }

    return '';
  }

  // For password visibility toggle - fixed to work with HTML element
  togglePasswordVisibility(passwordInput: HTMLInputElement): void {
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
  }
}
