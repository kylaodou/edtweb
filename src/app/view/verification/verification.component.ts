import { Component, OnInit, ViewChildren, QueryList, ElementRef, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css'
})
export class VerificationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  email: string = '';
  verificationCode: string[] = ['', '', '', ''];
  remainingTime: number = 60;
  timer: any;
  isExpired: boolean = false;
  isBrowser: boolean;
  isVerifying: boolean = false;
  verificationError: string = '';
  resendingCode: boolean = false;
  resendSuccess: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.email = localStorage.getItem('userEmail') || '';
      if (!this.email) {
        // Redirect to register if email is not available
        this.router.navigate(['/register']);
        return;
      }
      this.startTimer();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadLottieAnimation();

      // Focus on first input after view is initialized
      setTimeout(() => {
        const inputsList = this.codeInputs.toArray();
        if (inputsList[0]) {
          inputsList[0].nativeElement.focus();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private loadLottieAnimation(): void {
    import('lottie-web').then((Lottie) => {
      const animation = Lottie.default.loadAnimation({
        container: document.getElementById('lottie-container') as HTMLElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'register.json'
      });
    }).catch(err => {
      console.error('Erreur de chargement Lottie:', err);
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  startTimer(): void {
    this.isExpired = false;
    this.remainingTime = 60;

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.remainingTime--;
      if (this.remainingTime <= 0) {
        clearInterval(this.timer);
        this.isExpired = true;
      }
    }, 1000);
  }

  onDigitInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Clear verification error when user types
    this.verificationError = '';

    // Ensure only one digit is entered
    if (value.length > 1) {
      input.value = value.slice(-1); // Keep only the last character
    }

    // Ensure only numbers are entered
    if (!/^\d*$/.test(input.value)) {
      this.verificationCode[index] = '';
      input.value = '';
      return;
    }

    // Update the value in the array
    this.verificationCode[index] = input.value;

    // If a digit is entered and there's a next input, focus on it
    if (input.value.length === 1 && index < this.verificationCode.length - 1) {
      const inputsList = this.codeInputs.toArray();
      if (inputsList[index + 1]) {
        inputsList[index + 1].nativeElement.focus();
      }
    }

    // If code is complete, verify automatically
    if (this.verificationCode.every(digit => digit.length === 1)) {
      // Wait a moment to ensure all values are updated
      setTimeout(() => this.verify(), 300);
    }
  }

  // Handle backspace and left/right navigation
  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;

      // If current input is empty and there's a previous input, go to it
      if (input.value === '' && index > 0) {
        const inputsList = this.codeInputs.toArray();
        if (inputsList[index - 1]) {
          inputsList[index - 1].nativeElement.focus();
        }
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      const inputsList = this.codeInputs.toArray();
      if (inputsList[index - 1]) {
        inputsList[index - 1].nativeElement.focus();
      }
    } else if (event.key === 'ArrowRight' && index < this.verificationCode.length - 1) {
      const inputsList = this.codeInputs.toArray();
      if (inputsList[index + 1]) {
        inputsList[index + 1].nativeElement.focus();
      }
    }
  }

  // Allow pasting a code
  onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain');

    if (!pastedData) return;

    const digits = pastedData.replace(/\D/g, '').slice(0, 4).split('');

    // Fill in as many inputs as we have digits
    digits.forEach((digit, i) => {
      if (index + i < this.verificationCode.length) {
        this.verificationCode[index + i] = digit;

        const inputsList = this.codeInputs.toArray();
        if (inputsList[index + i]) {
          inputsList[index + i].nativeElement.value = digit;
        }
      }
    });

    // Focus on the next empty input or the last input
    const nextIndex = Math.min(index + digits.length, this.verificationCode.length - 1);
    const inputsList = this.codeInputs.toArray();
    if (inputsList[nextIndex]) {
      inputsList[nextIndex].nativeElement.focus();
    }

    // If code is complete after paste, verify automatically
    if (this.verificationCode.every(digit => digit.length === 1)) {
      setTimeout(() => this.verify(), 300);
    }
  }

  verify(): void {
    if (this.isExpired || this.isVerifying) {
      return;
    }

    const code = this.verificationCode.join('');

    if (code.length !== 4) {
      this.verificationError = 'Veuillez entrer les 4 chiffres du code';
      return;
    }

    this.isVerifying = true;
    this.verificationError = '';

    this.authService.verifyCode(this.email, code).subscribe({
      next: (response) => {
        console.log('Verification successful:', response);
        this.isVerifying = false;

        // Store authentication token if provided
        if (response.data && response.data.token) {
          this.authService.setToken(response.data.token);
        }

        // Store success message for login page
        if (this.isBrowser) {
          localStorage.setItem('registrationSuccess', 'Votre inscription a été prise en compte et est en attente de validation');
          localStorage.removeItem('userEmail');
        }

        // Redirect to login page
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isVerifying = false;
        console.error('Verification error:', error);

        // Display the exact error message from the API
        if (error.error && error.error.message) {
          this.verificationError = error.error.message;
        } else {
          this.verificationError = 'Code de vérification incorrect. Veuillez réessayer.';
        }

        // Clear the inputs for a retry
        this.verificationCode = ['', '', '', ''];
        this.codeInputs.forEach((input) => {
          input.nativeElement.value = '';
        });

        // Focus on the first input
        setTimeout(() => {
          const inputsList = this.codeInputs.toArray();
          if (inputsList[0]) {
            inputsList[0].nativeElement.focus();
          }
        }, 0);
      }
    });
  }

  resendCode(): void {
    if (this.resendingCode) {
      return;
    }

    this.resendingCode = true;
    this.resendSuccess = '';
    this.verificationError = '';

    // Reset verification code inputs
    this.verificationCode = ['', '', '', ''];
    this.codeInputs.forEach((input) => {
      input.nativeElement.value = '';
    });

    this.authService.resendVerificationCode(this.email).subscribe({
      next: (response) => {
        console.log('Code resent successfully:', response);
        this.resendingCode = false;

        // Reset and restart timer
        this.startTimer();

        // Show success message from API or default
        if (response && response.message) {
          this.resendSuccess = response.message;
        } else {
          this.resendSuccess = 'Un nouveau code a été envoyé à votre adresse email.';
        }

        // Focus on first input
        setTimeout(() => {
          const inputsList = this.codeInputs.toArray();
          if (inputsList[0]) {
            inputsList[0].nativeElement.focus();
          }
        }, 0);
      },
      error: (error) => {
        this.resendingCode = false;
        console.error('Error resending code:', error);

        // Display the exact error message from the API
        if (error.error && error.error.message) {
          this.verificationError = error.error.message;
        } else {
          this.verificationError = 'Erreur lors de l\'envoi du code. Veuillez réessayer.';
        }
      }
    });
  }
}
