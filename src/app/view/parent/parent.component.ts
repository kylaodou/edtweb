import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Parent, ParentsDto } from '../../model/parent';
import { ParentService } from '../../service/parent.service';
import { EtudiantService } from '../../service/etudiant.service';
import { Etudiant } from '../../model/etudiant';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './parent.component.html',
  styleUrls: ['./parent.component.css'],
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

export class ParentComponent implements OnInit {
  parents: Parent[] = [];
  parentForm!: FormGroup;
  isEditMode = false;
  currentParentId: string | null = null;
  showForm = false;
  formSubmitted = false;
  searchText = '';
  selectedRelation: string | null = null;
  relations: string[] = ['Père', 'Mère', 'Tuteur', 'Autre'];
  isLoading = true;
  formErrors: any = {};
  errorMessage: string | null = null;
  etudiants: Etudiant[] = [];

  // États de focus pour les champs du formulaire
  telFocused = false;
  nomFocused = false;
  prenomFocused = false;
  emailFocused = false;
  relationFocused = false;
  adresseFocused = false;
  enfantsFocused = false;
  showViewMode = false;
  selectedParent: Parent | null = null;

  constructor(
    private fb: FormBuilder,
    private parentService: ParentService,
    private etudiantService: EtudiantService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadParents();
    this.loadEtudiants();
    this.selectedRelation = '';
  }

  private initForm(): void {
    this.parentForm = this.fb.group({
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      relationAvecEtudiant: ['', Validators.required],
      adresse: [''],  // Ajouté le champ manquant adresse
      enfantsIds: [[], Validators.required]
    });
  }

  loadParents(): void {
    this.isLoading = true;
    this.errorMessage = null; // Reset error message
    this.parentService.getAllParents().subscribe({
      next: (data) => {
        this.parents = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des parents', error);
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger les parents. Veuillez réessayer plus tard.';
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les parents. Veuillez réessayer plus tard.',
        });
      }
    });
  }

  loadEtudiants(): void {
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data) => {
        this.etudiants = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des étudiants', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger la liste des étudiants.'
        });
      }
    });
  }

  filteredParents(): Parent[] {
    if (!this.parents) return [];

    return this.parents.filter(parent => {
      const matchesSearch = !this.searchText ||
        parent.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        parent.prenom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        parent.telephone.toLowerCase().includes(this.searchText.toLowerCase()) ||
        parent.email.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesRelation = !this.selectedRelation || parent.relationAvecEtudiant === this.selectedRelation;

      return matchesSearch && matchesRelation;
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentParentId = null;
    this.parentForm.reset();
    this.showViewMode = false;
    this.formErrors = {};
    this.showForm = true;
    this.formSubmitted = false;

    // Réinitialiser avec un tableau vide pour enfantsIds
    this.parentForm.patchValue({
      enfantsIds: []
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.formErrors = {};
  }

  submitForm(): void {
    this.formSubmitted = true;
    this.formErrors = {};

    console.log('Form validity:', this.parentForm.valid);
    console.log('Form values:', this.parentForm.value);

    if (this.parentForm.invalid) {
      // Mark all form controls as touched to trigger validation errors display
      Object.keys(this.parentForm.controls).forEach(key => {
        const control = this.parentForm.controls[key];
        control.markAsTouched();
      });

      console.log('Form is invalid. Validation errors:', this.getFormValidationErrors());
      return;
    }

    const parentData: ParentsDto = {
      telephone: this.parentForm.value.telephone,
      nom: this.parentForm.value.nom,
      prenom: this.parentForm.value.prenom,
      email: this.parentForm.value.email,
      relationAvecEtudiant: this.parentForm.value.relationAvecEtudiant,
      enfantsIds: this.parentForm.value.enfantsIds
    };

    console.log('Sending data to API:', parentData);

    // Determine if we're updating or creating
    if (this.isEditMode && this.currentParentId) {
      this.parentService.updateParent(this.currentParentId, parentData).subscribe({
        next: (response) => {
          console.log('API response for update:', response);
          if (response.success) {
            this.showForm = false;
            this.loadParents();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Parent mis à jour avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du parent', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    } else {
      this.parentService.createParent(parentData).subscribe({
        next: (response) => {
          console.log('API response for create:', response);
          if (response.success) {
            this.showForm = false;
            this.loadParents();
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'Parent créé avec succès',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            this.handleErrorResponse(response);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création du parent', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la communication avec le serveur'
          });
        }
      });
    }
  }

  // Ajout d'une méthode pour déboguer les erreurs de validation
  private getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.parentForm.controls).forEach(key => {
      const control = this.parentForm.controls[key];
      if (control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  private handleErrorResponse(response: { success: boolean; errors?: any; message?: string }): void {
    // Store form validation errors to display in the form
    if (response.errors) {
      this.formErrors = response.errors;

      // Check for specific duplication errors
      const duplicationErrors = [];

      if (response.errors.uniciteTel) {
        duplicationErrors.push('Le numéro de téléphone est déjà utilisé par un autre parent');
      }

      if (response.errors.uniciteEmail) {
        duplicationErrors.push('L\'email est déjà utilisé par un autre parent');
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

  editParent(parent: Parent): void {
    this.isEditMode = true;
    this.currentParentId = parent.id;
    this.formErrors = {};
    this.showViewMode = false;

    this.parentForm.patchValue({
      telephone: parent.telephone,
      nom: parent.nom,
      prenom: parent.prenom,
      email: parent.email,
      relationAvecEtudiant: parent.relationAvecEtudiant,
      enfantsIds: parent.enfantsIds
    });

    this.showForm = true;
    this.formSubmitted = false;
  }

  viewParent(parent: Parent): void {
    this.selectedParent = parent;
    this.showViewMode = true;
    this.showForm = true;
  }

  switchToEditMode(): void {
    if (this.selectedParent) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentParentId = this.selectedParent.id;

      // On remplit le formulaire avec les infos du parent sélectionné
      this.parentForm.patchValue({
        telephone: this.selectedParent.telephone || '',
        nom: this.selectedParent.nom || '',
        prenom: this.selectedParent.prenom || '',
        email: this.selectedParent.email || '',
        relationAvecEtudiant: this.selectedParent.relationAvecEtudiant || '',
        enfantsIds: this.selectedParent.enfantsIds || []
      });

      this.formSubmitted = false;
    }
  }

  deleteParent(parent: Parent): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer le parent <strong class="etudiant-name">"${parent.prenom} ${parent.nom}"</strong> ?</p>`,
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

        this.parentService.deleteParent(parent.id).subscribe({
          next: (success) => {
            if (success) {
              this.loadParents();

              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">Le parent <strong>"${parent.prenom} ${parent.nom}"</strong> a été supprimé.</p>`,
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
                text: 'Impossible de supprimer le parent'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du parent', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la suppression du parent'
            });
          }
        });
      }
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedRelation = null;
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

  getEnfantNom(enfantId: string): string {
    const etudiant = this.etudiants.find(e => e.id === enfantId);
    return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu';
  }

  // Convertit les IDs des enfants sélectionnés en tableau pour le formulaire
  compareEnfants(enfant1: string, enfant2: string): boolean {
    return enfant1 === enfant2;
  }
}
