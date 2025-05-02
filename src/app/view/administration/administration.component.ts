import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Administration, AdministrationDto } from '../../model/administration';
import { AdministrationService } from '../../service/administration.service';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('zoomIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) rotateX(2deg)' }),
        animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1) rotateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in',
          style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})

export class AdministrationComponent implements OnInit {
  administrations: Administration[] = [];
  administrationForm!: FormGroup;
  isEditMode = false;
  currentAdministrationId: string | null = null;
  showForm = false;
  formSubmitted = false;
  searchText = '';
  selectedFonction: string | null = null;
  fonctions: string[] = ['Directeur', 'Secrétaire', 'Comptable', 'Surveillant', 'Autre'];
  isLoading = true;
  formErrors: any = {};
  errorMessage: string | null = null;

  // États de focus pour les champs du formulaire
  matriculeFocused = false;
  nomFocused = false;
  prenomFocused = false;
  emailFocused = false;
  fonctionFocused = false;
  showViewMode = false;
  selectedAdministration: Administration | null = null;

  constructor(
    private fb: FormBuilder,
    private administrationService: AdministrationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAdministrations();
    this.selectedFonction = '';

  }

  private initForm(): void {
    this.administrationForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      fonction: ['', Validators.required]
    });
  }

  loadAdministrations(): void {
    this.isLoading = true;
    this.errorMessage = null; // Reset error message
    this.administrationService.getAllAdministrations().subscribe({
      next: (data) => {
        this.administrations = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des administrateurs', error);
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger les administrateurs. Veuillez réessayer plus tard.';
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les administrateurs. Veuillez réessayer plus tard.',
        });
      }
    });
  }

  filteredAdministrations(): Administration[] {
    if (!this.administrations) return [];

    return this.administrations.filter(administration => {
      const matchesSearch = !this.searchText ||
        administration.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        administration.prenom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        administration.matricule.toLowerCase().includes(this.searchText.toLowerCase()) ||
        administration.email.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesFonction = !this.selectedFonction || administration.fonction === this.selectedFonction;

      return matchesSearch && matchesFonction;
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentAdministrationId = null;
    this.administrationForm.reset();
    this.showViewMode = false;
    this.formErrors = {};
    this.showForm = true;
    this.formSubmitted = false;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.formErrors = {};
  }

  submitForm(): void {
    this.formSubmitted = true;
    this.formErrors = {};

    if (this.administrationForm.invalid) {
      // Mark all form controls as touched to trigger validation errors display
      Object.keys(this.administrationForm.controls).forEach(key => {
        const control = this.administrationForm.controls[key];
        control.markAsTouched();
      });
      return;
    }

    const administrationData: AdministrationDto = {
      matricule: this.administrationForm.value.matricule,
      nom: this.administrationForm.value.nom,
      prenom: this.administrationForm.value.prenom,
      email: this.administrationForm.value.email,
      fonction: this.administrationForm.value.fonction
    };

    // Determine if we're updating or creating
    if (this.isEditMode && this.currentAdministrationId) {
      this.administrationService.updateAdministration(this.currentAdministrationId, administrationData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showForm = false;
            this.loadAdministrations();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Administrateur mis à jour avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'administrateur', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    } else {
      this.administrationService.createAdministration(administrationData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showForm = false;
            this.loadAdministrations();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Administrateur créé avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'administrateur', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    }
  }

  private handleErrorResponse(response: { success: boolean; errors?: any; message?: string }): void {
    // Store form validation errors to display in the form
    if (response.errors) {
      this.formErrors = response.errors;

      // Check for specific duplication errors
      const duplicationErrors = [];

      if (response.errors.uniciteMatricule) {
        duplicationErrors.push('Le matricule est déjà utilisé par un autre administrateur');
      }

      if (response.errors.uniciteEmail) {
        duplicationErrors.push('L\'email est déjà utilisé par un autre administrateur');
      }

      // If we have duplication errors, show them in the alert
      if (duplicationErrors.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Données en double',
          html: duplicationErrors.join('<br>'),
          confirmButtonText: 'Corriger'
        });
        return;
      }
    }

    // Show a general error message if no specific duplication errors were found
    Swal.fire({
      icon: 'error',
      title: 'Erreur de validation',
      text: response.message || 'Veuillez vérifier les informations saisies',
      confirmButtonText: 'Corriger'
    });
  }

  editAdministration(administration: Administration): void {
    this.isEditMode = true;
    this.currentAdministrationId = administration.id;
    this.formErrors = {};
    this.showViewMode = false;

    this.administrationForm.patchValue({
      matricule: administration.matricule,
      nom: administration.nom,
      prenom: administration.prenom,
      email: administration.email,
      fonction: administration.fonction
    });

    this.showForm = true;
    this.formSubmitted = false;
  }

  viewAdministration(administration: Administration): void {
    this.selectedAdministration = administration;
    this.showViewMode = true;
    this.showForm = true;
  }

  switchToEditMode(): void {
    if (this.selectedAdministration) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentAdministrationId = this.selectedAdministration.id;

      // On remplit le formulaire avec les infos de l'administrateur sélectionné
      this.administrationForm.patchValue({
        matricule: this.selectedAdministration.matricule || '',
        nom: this.selectedAdministration.nom || '',
        prenom: this.selectedAdministration.prenom || '',
        email: this.selectedAdministration.email || '',
        fonction: this.selectedAdministration.fonction || ''
      });

      this.formSubmitted = false;
    }
  }


  deleteAdministration(administration: Administration): void {
    const Toast = Swal.mixin({
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });

    Toast.fire({
      title: '<span class="delete-title">Confirmer la suppression</span>',
      html: `<p class="delete-message">Voulez-vous vraiment supprimer l'administrateur <strong class="etudiant-name">"${administration.prenom} ${administration.nom}"</strong> ?</p>`,
      icon: 'warning',
      iconColor: '#e74c3c',
      background: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#3367d6',
      confirmButtonText: '<i class="fas fa-trash-alt"></i> Oui, supprimer',
      cancelButtonText: '<i class="fas fa-times"></i> Annuler',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'delete-confirm-btn',
        cancelButton: 'delete-cancel-btn',
        title: 'delete-modal-title',
        popup: 'delete-modal-popup custom-rounded-popup',
        container: 'delete-modal-container'
      },
      focusCancel: true,
      showCloseButton: true,
      reverseButtons: true,
      padding: '2em',
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Suppression en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.administrationService.deleteAdministration(administration.id).subscribe({
          next: (success) => {
            if (success) {
              this.loadAdministrations();

              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">L'administrateur <strong>"${administration.prenom} ${administration.nom}"</strong> a été supprimé.</p>`,
                timer: 2500,
                timerProgressBar: true,
                showConfirmButton: false,
                background: '#fff',
                customClass: {
                  popup: 'success-popup custom-rounded-popup',
                  title: 'success-title',
                  icon: 'success-icon'
                },
                backdrop: `rgba(46, 204, 113, 0.1)`
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer l\'administrateur'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de l\'administrateur', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la suppression de l\'administrateur'
            });
          }
        });
      }
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedFonction = null;
  }

  getCardStyle(index: number): any {
    const colors = [
      '#4a6cf7', '#0acf97', '#e36eec', '#fa6767', '#ffbc53',
      '#4cd3e3', '#647eff', '#8e67d4'
    ];

    return {
      'border-left': `4px solid ${colors[index % colors.length]}`,
      'animation-delay': `${index * 0.1}s`,
      'animation-name': 'fadeInUp',
      'animation-duration': '0.5s',
      'animation-fill-mode': 'both',
      'animation-timing-function': 'ease-out'
    };
  }
}
