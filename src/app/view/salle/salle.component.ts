import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Salle } from '../../model/salle';
import { SalleService } from '../../service/salle.service';

@Component({
  selector: 'app-salle',
  standalone: true, // Add this if using Angular standalone components
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './salle.component.html',
  styleUrls: ['./salle.component.css'],
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
export class SalleComponent implements OnInit {

  salles: Salle[] = [];
  salleForm: FormGroup;
  isEditMode = false;
  currentSalleId: string | null = null;
  showForm = false;
  showViewMode = false;
  selectedSalle: Salle | null = null;
  formSubmitted = false;
  searchText = '';
  selectedType = '';
  types: string[] = ['Cours', 'TP', 'TD', 'Salle Informatique', 'Bibliothèque'];
  isLoading = true;
  numeroFocused = false;
  batimentFocused = false;
  typeFocused = false;
  disponibleFocused = false;
  errorMessage: string | null = null;
  showOnlyDisponible = false;

  constructor(
    private fb: FormBuilder,
    private salleService: SalleService
  ) {
    this.salleForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1)]],
      batiment: ['', Validators.required],
      type: ['', Validators.required],
      disponible: [true],
    });
  }

  ngOnInit(): void {
    this.loadSalles();
  }

  // Added method to count available rooms
  getDisponibleCount(): number {
    return this.salles.filter(s => s.disponible).length;
  }

  loadSalles(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.salleService.getAllSalles().subscribe({
      next: (data) => {
        this.salles = data;
        // Ne pas extraire les types, car ils sont prédéfinis
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des salles', error);
        this.errorMessage = 'Impossible de charger les salles. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  loadDisponibleSalles(): void {
    if (this.showOnlyDisponible) {
      this.isLoading = true;
      this.errorMessage = null;

      this.salleService.getSallesDisponibles().subscribe({
        next: (data) => {
          this.salles = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des salles disponibles', error);
          this.errorMessage = 'Impossible de charger les salles disponibles. Veuillez réessayer plus tard.';
          this.isLoading = false;
        }
      });
    } else {
      this.loadSalles();
    }
  }

  get filteredSalles(): Salle[] {
    return this.salles.filter(salle => {
      const matchesSearch = this.searchText ?
        (salle.numero.toLowerCase().includes(this.searchText.toLowerCase()) ||
        salle.batiment.toLowerCase().includes(this.searchText.toLowerCase()) ||
        salle.type.toLowerCase().includes(this.searchText.toLowerCase())) :
        true;

      const matchesType = this.selectedType ?
        salle.type === this.selectedType :
        true;

      const matchesDisponible = this.showOnlyDisponible ?
        salle.disponible === true :
        true;

      return matchesSearch && matchesType && matchesDisponible;
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
    this.salleForm.reset({
      disponible: true // valeur par défaut
    });
    this.formSubmitted = false;
    this.currentSalleId = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.selectedSalle = null;
  }

  // Nouvelle méthode pour voir les détails
  viewSalle(salle: Salle): void {
    this.selectedSalle = salle;
    this.showViewMode = true;
    this.showForm = false;
  }

  // Méthode pour passer du mode visualisation au mode édition
  switchToEditMode(): void {
    if (this.selectedSalle) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentSalleId = this.selectedSalle.id;

      this.salleForm.setValue({
        numero: this.selectedSalle.numero,
        batiment: this.selectedSalle.batiment,
        type: this.selectedSalle.type,
        disponible: this.selectedSalle.disponible !== undefined ? this.selectedSalle.disponible : true,
      });

      this.formSubmitted = false;
    }
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.salleForm.valid) {
      const salleData = {
        numero: this.salleForm.value.numero,
        batiment: this.salleForm.value.batiment,
        type: this.salleForm.value.type,
        disponible: this.salleForm.value.disponible,
      };

      if (this.isEditMode && this.currentSalleId) {
        // Vérifier d'abord si la modification crée un doublon
        this.salleService.checkDuplicateOnUpdate(
          this.currentSalleId,
          salleData.numero,
          salleData.batiment
        ).subscribe({
          next: (isDuplicate) => {
            if (isDuplicate) {
              // Si un doublon est détecté, afficher une erreur
              const errors = {
                uniciteNumeroEtBatiment: `Une autre salle avec le numéro ${salleData.numero} dans le bâtiment ${salleData.batiment} existe déjà`
              };
              this.showValidationErrors(errors);
            } else {
              // Pas de doublon, procéder à la mise à jour
              this.salleService.updateSalle(this.currentSalleId as string, salleData).subscribe({
                next: (updatedSalle) => {
                  if (updatedSalle) {
                    Swal.fire({
                      icon: 'success',
                      title: 'Modification réussie',
                      text: `La salle ${updatedSalle.numero} du bâtiment ${updatedSalle.batiment} a été mise à jour avec succès`,
                      timer: 2000,
                      showConfirmButton: false
                    });
                    this.loadSalles();
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
            }
          },
          error: (error) => {
            console.error('Erreur lors de la vérification des doublons', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de la vérification des doublons',
              confirmButtonText: 'OK'
            });
          }
        });
      } else {
        // Création d'une nouvelle salle
        this.salleService.createSalle(salleData).subscribe({
          next: (newSalle) => {
            if (newSalle) {
              Swal.fire({
                icon: 'success',
                title: 'Création réussie',
                text: `La salle ${newSalle.numero} du bâtiment ${newSalle.batiment} a été créée avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadSalles();
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
// Méthode pour afficher les erreurs de validation
showValidationErrors(errors: Record<string, string>): void {
  // Transformer les erreurs en une liste
  const errorList = Object.values(errors).join('<br>');

  Swal.fire({
    icon: 'error',
    title: 'Erreurs de validation',
    html: errorList,
    confirmButtonText: 'OK'
  });

  
}

  editSalle(salle: Salle): void {
    this.isEditMode = true;
    this.currentSalleId = salle.id;
    this.showViewMode = false;
    this.showForm = true;

    this.salleForm.setValue({
      numero: salle.numero,
      batiment: salle.batiment,
      type: salle.type,
      disponible: salle.disponible !== undefined ? salle.disponible : true,
    });

    this.formSubmitted = false;
  }

  deleteSalle(salle: Salle): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer la salle <strong class="salle-name">"${salle.numero} - ${salle.batiment}"</strong> ?</p>`,
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

        this.salleService.deleteSalle(salle.id).subscribe({
          next: (success) => {
            if (success) {
              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">La salle <strong>"${salle.numero} - ${salle.batiment}"</strong> a été supprimée.</p>`,
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
              this.loadSalles();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer cette salle',
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
    this.selectedType = '';
    this.showOnlyDisponible = false;
    this.loadSalles();
  }

  toggleDisponible(): void {
    this.loadDisponibleSalles();
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
