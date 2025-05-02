import { Component, OnInit, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, AfterViewInit {
  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  isBrowser: boolean;
  apiErrors: any = {};

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    // Initialize form validation listeners
    this.setupFormListeners();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadLottieAnimation();
      this.setupPasswordToggle();
    }
  }

  private setupFormListeners(): void {
    // Add form field listeners to handle validation in real-time
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.valueChanges.subscribe(() => {
        // Clear API errors when user makes changes
        if (this.apiErrors[key]) {
          delete this.apiErrors[key];
        }
      });
    });
  }

  private loadLottieAnimation(): void {
    import('lottie-web').then((Lottie) => {
      const animation = Lottie.default.loadAnimation({
        container: document.getElementById('register-lottie-container') as HTMLElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'register.json'
      });
    }).catch(err => {
      console.error('Erreur de chargement Lottie:', err);
    });
  }

  private setupPasswordToggle(): void {
    // Set up password visibility toggle functionality
    document.querySelectorAll('.password-toggle').forEach((toggle, index) => {
      toggle.addEventListener('click', () => {
        const inputId = index === 0 ? 'password' : 'confirmPassword';
        this.togglePasswordVisibility(inputId as 'password' | 'confirmPassword');

        const input = document.getElementById(inputId) as HTMLInputElement;
        input.type = input.type === 'password' ? 'text' : 'password';

        const icon = (toggle as HTMLElement).querySelector('i');
        if (icon) {
          icon.className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
      });
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.apiErrors = {};

      const registerData = {
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        fullname: this.signupForm.value.fullname
      };

      // Use the auth service to register
      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          console.log('Registration successful:', response);
          this.isLoading = false;

          // Store email for verification page
          if (this.isBrowser) {
            localStorage.setItem('userEmail', this.signupForm.value.email);
          }

          // Navigate to verification page
          this.router.navigate(['/verification']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          if (error.error && error.error.errors) {
            this.apiErrors = error.error.errors;
          } else if (error.error && error.error.message) {
            // Handle general error message
            this.apiErrors.general = error.error.message;
          } else {
            this.apiErrors.general = 'Une erreur est survenue lors de l\'inscription.';
          }
        }
      });
    } else {
      // Mark all fields as touched to display validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
