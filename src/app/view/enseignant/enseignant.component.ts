import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Enseignant } from '../../model/enseignant';
import { EnseignantService } from '../../service/enseignant.service';

@Component({
  selector: 'app-enseignant',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './enseignant.component.html',
  styleUrls: ['./enseignant.component.css'],
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

export class EnseignantComponent implements OnInit {

  enseignants: Enseignant[] = [];
  enseignantForm: FormGroup;
  isEditMode = false;
  currentEnseignantId: string | null = null;
  showForm = false;
  showViewMode = false;
  selectedEnseignant: Enseignant | null = null;
  formSubmitted = false;
  searchText = '';
  selectedSpecialite = '';
  specialites: string[] = ['Algorithme','Mathématiques', 'Physique', 'Informatique', 'Économie', 'Droit', 'Réseaux', 'Base de donnée'];
  isLoading = true;
  errorMessage: string | null = null;

  // Variables pour gérer le focus des champs du formulaire
  matriculeFocused = false;
  nomFocused = false;
  prenomFocused = false;
  emailFocused = false;
  telephoneFocused = false;
  sexeFocused = false;
  specialiteFocused = false;
  titreFocused = false;

  constructor(
    private fb: FormBuilder,
    private enseignantService: EnseignantService
  ) {
    this.enseignantForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(1)]],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      sexe: ['', Validators.required],
      specialite: ['', Validators.required],
      titre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEnseignants();
  }

  loadEnseignants(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.enseignantService.getAllEnseignants().subscribe({
      next: (data) => {
        this.enseignants = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des enseignants', error);
        this.errorMessage = 'Impossible de charger les enseignants. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  get filteredEnseignants(): Enseignant[] {
    return this.enseignants.filter(enseignant => {
      const matchesSearch = this.searchText ?
        (enseignant.matricule.toLowerCase().includes(this.searchText.toLowerCase()) ||
         enseignant.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
         enseignant.prenom.toLowerCase().includes(this.searchText.toLowerCase()) ||
         enseignant.specialite.toLowerCase().includes(this.searchText.toLowerCase())) :
        true;

      const matchesSpecialite = this.selectedSpecialite ?
        enseignant.specialite === this.selectedSpecialite :
        true;

      return matchesSearch && matchesSpecialite;
    });
  }

  // Méthode pour compter les enseignants par titre
  getTitreCount(titre: string): number {
    return this.enseignants.filter(e => e.titre === titre).length;
  }

  openAddForm(): void {
    this.showForm = true;
    this.showViewMode = false;
    this.isEditMode = false;
    this.enseignantForm.reset();
    this.formSubmitted = false;
    this.currentEnseignantId = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.selectedEnseignant = null;
  }

  viewEnseignant(enseignant: Enseignant): void {
    this.selectedEnseignant = enseignant;
    this.showViewMode = true;
    this.showForm = false;
  }

  switchToEditMode(): void {
    if (this.selectedEnseignant) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentEnseignantId = this.selectedEnseignant.id;

      this.enseignantForm.setValue({
        matricule: this.selectedEnseignant.matricule,
        nom: this.selectedEnseignant.nom,
        prenom: this.selectedEnseignant.prenom,
        email: this.selectedEnseignant.email,
        telephone: this.selectedEnseignant.telephone,
        sexe: this.selectedEnseignant.sexe,
        specialite: this.selectedEnseignant.specialite,
        titre: this.selectedEnseignant.titre
      });

      this.formSubmitted = false;
    }
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.enseignantForm.valid) {
      const enseignantData = {
        matricule: this.enseignantForm.value.matricule,
        nom: this.enseignantForm.value.nom,
        prenom: this.enseignantForm.value.prenom,
        email: this.enseignantForm.value.email,
        telephone: this.enseignantForm.value.telephone,
        sexe: this.enseignantForm.value.sexe,
        specialite: this.enseignantForm.value.specialite,
        titre: this.enseignantForm.value.titre
      };

      if (this.isEditMode && this.currentEnseignantId) {
        // Vérifier d'abord si la modification crée un doublon
        this.enseignantService.checkDuplicateOnUpdate(
          this.currentEnseignantId,
          enseignantData.matricule,
          enseignantData.email,
          enseignantData.telephone
        ).subscribe({
          next: (result) => {
            const errors: Record<string, string> = {};
            let hasDuplicate = false;

            if (result.matriculeExists) {
              errors['matricule'] = `Un autre enseignant avec le matricule ${enseignantData.matricule} existe déjà`;
              hasDuplicate = true;
            }
            if (result.emailExists) {
              errors['email'] = `Un autre enseignant avec l'email ${enseignantData.email} existe déjà`;
              hasDuplicate = true;
            }
            if (result.telephoneExists) {
              errors['telephone'] = `Un autre enseignant avec le téléphone ${enseignantData.telephone} existe déjà`;
              hasDuplicate = true;
            }

            if (hasDuplicate) {
              this.showValidationErrors(errors);
            } else {
              // Pas de doublon, procéder à la mise à jour
              this.enseignantService.updateEnseignant(this.currentEnseignantId as string, enseignantData).subscribe({
                next: (updatedEnseignant) => {
                  if (updatedEnseignant) {
                    Swal.fire({
                      icon: 'success',
                      title: 'Modification réussie',
                      text: `L'enseignant ${updatedEnseignant.nom} ${updatedEnseignant.prenom} a été mis à jour avec succès`,
                      timer: 2000,
                      showConfirmButton: false
                    });
                    this.loadEnseignants();
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
        // Création d'un nouvel enseignant
        this.enseignantService.createEnseignant(enseignantData).subscribe({
          next: (newEnseignant) => {
            if (newEnseignant) {
              Swal.fire({
                icon: 'success',
                title: 'Création réussie',
                text: `L'enseignant ${newEnseignant.nom} ${newEnseignant.prenom} a été créé avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadEnseignants();
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

  editEnseignant(enseignant: Enseignant): void {
    this.isEditMode = true;
    this.currentEnseignantId = enseignant.id;
    this.showViewMode = false;
    this.showForm = true;

    this.enseignantForm.setValue({
      matricule: enseignant.matricule,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      telephone: enseignant.telephone,
      sexe: enseignant.sexe,
      specialite: enseignant.specialite,
      titre: enseignant.titre
    });

    this.formSubmitted = false;
  }

  deleteEnseignant(enseignant: Enseignant): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer l'enseignant <strong class="salle-name">"${enseignant.nom} ${enseignant.prenom}"</strong> ?</p>`,
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

        this.enseignantService.deleteEnseignant(enseignant.id).subscribe({
          next: (success) => {
            if (success) {
              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">L'enseignant <strong>"${enseignant.nom} ${enseignant.prenom}"</strong> a été supprimé.</p>`,
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
              this.loadEnseignants();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer cet enseignant',
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
    this.selectedSpecialite = '';
    this.loadEnseignants();
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
