import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Etudiant, EtudiantsDto } from '../../model/etudiant';
import { EtudiantService } from '../../service/etudiant.service';
import { ClasseService } from '../../service/classe.service';
import { Classe } from '../../model/classe';

@Component({
  selector: 'app-etudiant',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './etudiant.component.html',
  styleUrls: ['./etudiant.component.css'],
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
export class EtudiantComponent implements OnInit {
  etudiants: Etudiant[] = [];
  classes: Classe[] = [];
  etudiantForm!: FormGroup;
  isEditMode = false;
  currentEtudiantId: string | null = null;
  showForm = false;
  formSubmitted = false;
  searchText = '';
  selectedClasse: string | null = null;
  selectedSexe: string | null = null;
  sexes: string[] = ['Masculin', 'Féminin'];
  isLoading = true;
  formErrors: any = {};
  errorMessage: string | null = null; // Added this line - declare the errorMessage property

  // États de focus pour les champs du formulaire
  matriculeFocused = false;
  nomFocused = false;
  prenomFocused = false;
  emailFocused = false;
  telephoneFocused = false;
  sexeFocused = false;
  classeFocused = false;
  dateNaissanceFocused = false;
  lieuNaissanceFocused = false;
  estDelegueFocused = false;
  showViewMode = false;
  selectedEtudiant: Etudiant | null = null;
  constructor(
    private fb: FormBuilder,
    private etudiantService: EtudiantService,
    private classeService: ClasseService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEtudiants();
    this.loadClasses();
  }

  private initForm(): void {
    this.etudiantForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      sexe: ['', Validators.required],
      classeId: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      lieuNaissance: ['', Validators.required],
      estDelegue: [false]
    });
  }

  loadEtudiants(): void {
    this.isLoading = true;
    this.errorMessage = null; // Reset error message
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data) => {
        this.etudiants = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des étudiants', error);
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger les étudiants. Veuillez réessayer plus tard.'; // Set error message
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les étudiants. Veuillez réessayer plus tard.',
        });
      }
    });
  }

  loadClasses(): void {
    this.classeService.getAllClasses().subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des classes', error);
        this.errorMessage = 'Impossible de charger les classes. Veuillez réessayer plus tard.';
      }
    });
  }

  getClasseNom(classeId: string): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : 'Classe inconnue';
  }

  filteredEtudiants(): Etudiant[] {
    if (!this.etudiants) return [];

    return this.etudiants.filter(etudiant => {
      const matchesSearch = !this.searchText ||
        etudiant.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        etudiant.prenom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        etudiant.matricule.toLowerCase().includes(this.searchText.toLowerCase()) ||
        etudiant.email.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesClasse = !this.selectedClasse || etudiant.classeId === this.selectedClasse;
      const matchesSexe = !this.selectedSexe || etudiant.sexe === this.selectedSexe;

      return matchesSearch && matchesClasse && matchesSexe;
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentEtudiantId = null;
    this.etudiantForm.reset();
    this.showViewMode = false;
    this.etudiantForm.get('estDelegue')?.setValue(false);
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

    if (this.etudiantForm.invalid) {
      // Mark all form controls as touched to trigger validation errors display
      Object.keys(this.etudiantForm.controls).forEach(key => {
        const control = this.etudiantForm.controls[key];
        control.markAsTouched();
      });
      return;
    }

    const etudiantData: EtudiantsDto = {
      matricule: this.etudiantForm.value.matricule,
      nom: this.etudiantForm.value.nom,
      prenom: this.etudiantForm.value.prenom,
      email: this.etudiantForm.value.email,
      telephone: this.etudiantForm.value.telephone,
      sexe: this.etudiantForm.value.sexe,
      classeId: this.etudiantForm.value.classeId,
      dateNaissance: new Date(this.etudiantForm.value.dateNaissance),
      lieuNaissance: this.etudiantForm.value.lieuNaissance,
      estDelegue: this.etudiantForm.value.estDelegue || false
    };

    // Determine if we're updating or creating
    if (this.isEditMode && this.currentEtudiantId) {
      this.etudiantService.updateEtudiant(this.currentEtudiantId, etudiantData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showForm = false;
            this.loadEtudiants();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Étudiant mis à jour avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'étudiant', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    } else {
      this.etudiantService.createEtudiant(etudiantData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showForm = false;
            this.loadEtudiants();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Étudiant créé avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'étudiant', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    }
  }

  /**
   * Handle error responses from the API
   * Display appropriate error messages based on the type of error
   */
/**
 * Handle error responses from the API
 * Display appropriate error messages based on the type of error
 */
private handleErrorResponse(response: { success: boolean; errors?: any; message?: string }): void {
  // Store form validation errors to display in the form
  if (response.errors) {
    this.formErrors = response.errors;

    // Check for specific duplication errors
    const duplicationErrors = [];

    if (response.errors.uniciteMatricule) {
      duplicationErrors.push('Le matricule est déjà utilisé par un autre étudiant');
    }

    if (response.errors.uniciteEmail) {
      duplicationErrors.push('L\'email est déjà utilisé par un autre étudiant');
    }

    if (response.errors.uniciteTelephone) {
      duplicationErrors.push('Le numéro de téléphone est déjà utilisé par un autre étudiant');
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

  editEtudiant(etudiant: Etudiant): void {
    this.isEditMode = true;
    this.currentEtudiantId = etudiant.id;
    this.formErrors = {};
    this.showViewMode = false;

    this.etudiantForm.patchValue({
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email,
      telephone: etudiant.telephone,
      sexe: etudiant.sexe,
      classeId: etudiant.classeId,
      dateNaissance: this.formatDateForInput(etudiant.dateNaissance),
      lieuNaissance: etudiant.lieuNaissance,
      estDelegue: etudiant.estDelegue || false
    });

    this.showForm = true;
    this.formSubmitted = false;
  }

  formatDateForInput(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  viewEtudiant(etudiant: Etudiant): void {
    this.selectedEtudiant = etudiant;
    this.showViewMode = true;
    this.showForm = true;

  }
  switchToEditMode(): void {
    if (this.selectedEtudiant) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentEtudiantId = this.selectedEtudiant.id;

      // On remplit le formulaire avec les infos de l'étudiant sélectionné
      this.etudiantForm.setValue({
        nom: this.selectedEtudiant.nom || '',
        prenom: this.selectedEtudiant.prenom || '',
        email: this.selectedEtudiant.email || '',
        sexe: this.selectedEtudiant.sexe || '',
        telephone: this.selectedEtudiant.telephone || '',
        matricule: this.selectedEtudiant.matricule || '',
        classeId: this.selectedEtudiant.classeId || ''
      });

      this.formSubmitted = false;
    }
  }


  deleteEtudiant(etudiant: Etudiant): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer l'étudiant <strong class="etudiant-name">"${etudiant.prenom} ${etudiant.nom}"</strong> ?</p>`,
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

        this.etudiantService.deleteEtudiant(etudiant.id).subscribe({
          next: (success) => {
            if (success) {
              this.loadEtudiants();

              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">L'étudiant <strong>"${etudiant.prenom} ${etudiant.nom}"</strong> a été supprimé.</p>`,
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
                text: 'Impossible de supprimer l\'étudiant'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de l\'étudiant', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la suppression de l\'étudiant'
            });
          }
        });
      }
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedClasse = null;
    this.selectedSexe = null;
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
