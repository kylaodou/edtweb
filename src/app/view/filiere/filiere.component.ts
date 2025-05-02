import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Filiere } from '../../model/filiere';
import { FiliereService } from '../../service/filiere.service';

@Component({
  selector: 'app-filiere',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './filiere.component.html',
  styleUrl: './filiere.component.css',
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
export class FiliereComponent implements OnInit {

  filieres: Filiere[] = [];
  filiereForm: FormGroup;
  isEditMode = false;
  currentFiliereId: string | null = null;
  showForm = false;
  showViewMode = false;
  selectedFiliere: Filiere | null = null;
  formSubmitted = false;
  searchText = '';
  selectedSemestre = '';
  semestres: string[] = [];
  isLoading = true;
  nomFocused = false;
  semestreFocused = false;
  codeFocused = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private filiereService: FiliereService
  ) {
    this.filiereForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      nomSemestre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFilieres();
  }

  loadFilieres(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.filiereService.getAllFilieres().subscribe({
      next: (data) => {
        this.filieres = data;
        // Extraire les semestres uniques
        this.semestres = [...new Set(this.filieres.map(f => f.description || 'Non défini'))];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des filières', error);
        this.errorMessage = 'Impossible de charger les filières. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  get filteredFilieres(): Filiere[] {
    return this.filieres.filter(filiere => {
      const matchesSearch = this.searchText ?
        (filiere.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        filiere.code.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (filiere.description && filiere.description.toLowerCase().includes(this.searchText.toLowerCase()))) :
        true;

      const matchesSemestre = this.selectedSemestre ?
        filiere.description === this.selectedSemestre :
        true;

      return matchesSearch && matchesSemestre;
    });
  }

  // Méthode pour tronquer le texte
  truncateText(text: string | undefined | null, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  openAddForm(): void {
    this.showForm = true;
    this.showViewMode = false;
    this.isEditMode = false;
    this.filiereForm.reset();
    this.formSubmitted = false;
    this.currentFiliereId = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.selectedFiliere = null;
  }

  // Nouvelle méthode pour voir les détails
  viewFiliere(filiere: Filiere): void {
    this.selectedFiliere = filiere;
    this.showViewMode = true;
    this.showForm = false;
  }

  // Méthode pour passer du mode visualisation au mode édition
  switchToEditMode(): void {
    if (this.selectedFiliere) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentFiliereId = this.selectedFiliere.id;

      this.filiereForm.setValue({
        nom: this.selectedFiliere.nom,
        code: this.selectedFiliere.code || '',
        nomSemestre: this.selectedFiliere.description || ''
      });

      this.formSubmitted = false;
    }
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.filiereForm.valid) {
      const filiereData = {
        nom: this.filiereForm.value.nom,
        code: this.filiereForm.value.code,
        description: this.filiereForm.value.nomSemestre
      };

      if (this.isEditMode && this.currentFiliereId) {
        // Édition d'une filière existante
        this.filiereService.updateFiliere(this.currentFiliereId, filiereData).subscribe({
          next: (updatedFiliere) => {
            if (updatedFiliere) {
              Swal.fire({
                icon: 'success',
                title: 'Modification réussie',
                text: `La filière ${updatedFiliere.nom} a été mise à jour avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadFilieres();
              this.closeForm();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour', error);

            // Afficher les erreurs de validation spécifiques
            if (error.errors) {
              this.showValidationErrors(error.errors);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.message || 'Une erreur est survenue lors de la mise à jour',
                confirmButtonText: 'OK'
              });
            }
          }
        });
      } else {
        // Création d'une nouvelle filière
        this.filiereService.createFiliere(filiereData).subscribe({
          next: (newFiliere) => {
            if (newFiliere) {
              Swal.fire({
                icon: 'success',
                title: 'Création réussie',
                text: `La filière ${newFiliere.nom} a été créée avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadFilieres();
              this.closeForm();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);

            // Afficher les erreurs de validation spécifiques
            if (error.errors) {
              this.showValidationErrors(error.errors);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.message || 'Une erreur est survenue lors de la création',
                confirmButtonText: 'OK'
              });
            }
          }
        });
      }
    }
  }

  // Ajouter cette nouvelle méthode pour afficher les erreurs de validation
  showValidationErrors(errors: any): void {
    // Construction du message HTML pour les erreurs
    let errorHTML = '<div class="validation-errors">';

    Object.keys(errors).forEach(key => {
      const errorMessage = errors[key];
      let icon = 'fas fa-exclamation-circle';
      let errorClass = 'validation-error';

      // Personnaliser les icônes et classes selon le type d'erreur
      if (key === 'uniciteCode' || key === 'uniciteNom') {
        icon = 'fas fa-fingerprint';
        errorClass = 'uniqueness-error';
      }

      errorHTML += `
        <div class="${errorClass}">
          <i class="${icon}"></i>
          <span>${errorMessage}</span>
        </div>
      `;
    });

    errorHTML += '</div>';

    // Afficher le message d'erreur avec SweetAlert
    Swal.fire({
      icon: 'error',
      title: 'Validation échouée',
      html: errorHTML,
      confirmButtonText: 'Corriger',
      confirmButtonColor: '#3367d6',
      customClass: {
        popup: 'validation-error-popup',
        title: 'validation-error-title',
        htmlContainer: 'validation-error-container'
      }
    });
  }

  editFiliere(filiere: Filiere): void {
    this.isEditMode = true;
    this.currentFiliereId = filiere.id;
    this.showViewMode = false;
    this.showForm = true;

    this.filiereForm.setValue({
      nom: filiere.nom,
      code: filiere.code || '',
      nomSemestre: filiere.description || ''
    });

    this.formSubmitted = false;
  }

  deleteFiliere(filiere: Filiere): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer la filière <strong class="filiere-name">"${filiere.nom}"</strong> ?</p>`,
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

        this.filiereService.deleteFiliere(filiere.id).subscribe({
          next: (success) => {
            if (success) {
              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">La filière <strong>"${filiere.nom}"</strong> a été supprimée.</p>`,
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
              this.loadFilieres();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer cette filière',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error.error?.message || 'Une erreur est survenue lors de la suppression',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedSemestre = '';
  }

  // Pour les couleurs de lignes du tableau
  getRowColor(index: number): any {
    const colors = [
      '#f8f9fa', '#edf2fb' // Alternance de couleurs légères
    ];

    return {
      'background-color': colors[index % colors.length]
    };
  }
}
