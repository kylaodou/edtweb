import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Cours } from '../../model/cours';
import { CoursService } from '../../service/cours.service';
import { ClasseService } from '../../service/classe.service';
import { EnseignantService } from '../../service/enseignant.service';
import { Classe } from '../../model/classe';
import { Enseignant } from '../../model/enseignant';

@Component({
  selector: 'app-cours',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './cours.component.html',
  styleUrls: ['./cours.component.css'],
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
export class CoursComponent implements OnInit {

  cours: Cours[] = [];
  coursForm: FormGroup;
  isEditMode = false;
  currentCoursId: string | null = null;
  showForm = false;
  showViewMode = false;
  selectedCours: Cours | null = null;
  formSubmitted = false;
  searchText = '';
  selectedSemestre = '';
  selectedClasse = '';
  selectedEnseignant = '';
  semestres: string[] = [];
  classes: Classe[] = [];
  enseignants: Enseignant[] = [];
  isLoading = true;
  codeFocused = false;
  intituleFocused = false;
  vhCTFocused = false;
  vhTPFocused = false;
  vhTDFocused = false;
  creditFocused = false;
  classeFocused = false;
  enseignantFocused = false;
  semestreFocused = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private coursService: CoursService,
    private classeService: ClasseService,
    private enseignantService: EnseignantService
  ) {
    this.coursForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      intitule: ['', [Validators.required, Validators.minLength(3)]],
      vhCT: [0, [Validators.required, Validators.min(0)]],
      vhTP: [0, [Validators.required, Validators.min(0)]],
      vhTD: [0, [Validators.required, Validators.min(0)]],
      credit: [0, [Validators.required, Validators.min(0)]],
      classeId: ['', Validators.required],
      enseignantId: ['', Validators.required],
      semestre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCours();
    this.loadClasses();
    this.loadEnseignants();
    this.initSemestres();
  }

  // Initialiser les semestres
  initSemestres(): void {
    this.semestres = ['Semestre 1', 'Semestre 2', 'Semestre 3', 'Semestre 4', 'Semestre 5', 'Semestre 6'];
  }

  loadCours(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.coursService.getAllCours().subscribe({
      next: (data) => {
        this.cours = data;
        // Extraire les semestres uniques
        this.semestres = [...new Set(this.cours.map(c => c.semestre))];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des cours', error);
        this.errorMessage = 'Impossible de charger les cours. Veuillez réessayer plus tard.';
        this.isLoading = false;
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
      }
    });
  }

  loadEnseignants(): void {
    this.enseignantService.getAllEnseignants().subscribe({
      next: (data) => {
        this.enseignants = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des enseignants', error);
      }
    });
  }

  get filteredCours(): Cours[] {
    return this.cours.filter(cours => {
      const matchesSearch = this.searchText ?
        (cours.code.toLowerCase().includes(this.searchText.toLowerCase()) ||
        cours.intitule.toLowerCase().includes(this.searchText.toLowerCase())) :
        true;

      const matchesSemestre = this.selectedSemestre ?
        cours.semestre === this.selectedSemestre :
        true;

      const matchesClasse = this.selectedClasse ?
        cours.classeId === this.selectedClasse :
        true;

      const matchesEnseignant = this.selectedEnseignant ?
        cours.enseignantId === this.selectedEnseignant :
        true;

      return matchesSearch && matchesSemestre && matchesClasse && matchesEnseignant;
    });
  }

  // Méthode pour calculer le pourcentage de progression
  getProgressPercentage(cours: Cours): number {
    const totalVH = cours.vhCT + cours.vhTP + cours.vhTD;
    if (totalVH === 0) return 0;
    
    // Calculer le volume horaire effectué (total - restant)
    const volumeHoraireEffectue = totalVH - (cours.restantVhCT + cours.restantVhTP + cours.restantVhTD);
    const progressPercentage = (volumeHoraireEffectue / totalVH) * 100;
    return Math.min(Math.max(progressPercentage, 0), 100); // Limiter entre 0 et 100
  }

  // Méthode pour obtenir la couleur de la barre de progression
  getProgressColor(percentage: number): string {
    if (percentage < 30) return '#4CAF50'; // Vert
    if (percentage < 70) return '#FFC107'; // Jaune
    return '#F44336'; // Rouge
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
    this.coursForm.reset({
      vhCT: 0,
      vhTP: 0,
      vhTD: 0,
      credit: 0
    });
    this.formSubmitted = false;
    this.currentCoursId = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.selectedCours = null;
  }

  // Méthode pour voir les détails
  viewCours(cours: Cours): void {
    this.selectedCours = cours;
    this.showViewMode = true;
    this.showForm = false;
  }

  // Méthode pour passer du mode visualisation au mode édition
  switchToEditMode(): void {
    if (this.selectedCours) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentCoursId = this.selectedCours.id;

      this.coursForm.setValue({
        code: this.selectedCours.code,
        intitule: this.selectedCours.intitule,
        vhCT: this.selectedCours.vhCT,
        vhTP: this.selectedCours.vhTP,
        vhTD: this.selectedCours.vhTD,
        credit: this.selectedCours.credit,
        classeId: this.selectedCours.classeId,
        enseignantId: this.selectedCours.enseignantId,
        semestre: this.selectedCours.semestre
      });

      this.formSubmitted = false;
    }
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.coursForm.valid) {
      const totalVH = this.coursForm.value.vhCT + this.coursForm.value.vhTP + this.coursForm.value.vhTD;
      
      const coursData = {
        code: this.coursForm.value.code,
        intitule: this.coursForm.value.intitule,
        vhCT: this.coursForm.value.vhCT,
        vhTP: this.coursForm.value.vhTP,
        vhTD: this.coursForm.value.vhTD,
        restantVhCT: this.coursForm.value.vhCT,
        restantVhTP: this.coursForm.value.vhTP,
        restantVhTD: this.coursForm.value.vhTD,
        vhResume: `${this.coursForm.value.vhCT}/${this.coursForm.value.vhTD}/${this.coursForm.value.vhTP}`,
        credit: this.coursForm.value.credit,
        classeId: this.coursForm.value.classeId,
        enseignantId: this.coursForm.value.enseignantId,
        semestre: this.coursForm.value.semestre
      };

      if (this.isEditMode && this.currentCoursId) {
        // Édition d'un cours existant
        this.coursService.updateCours(this.currentCoursId, coursData).subscribe({
          next: (updatedCours) => {
            if (updatedCours) {
              Swal.fire({
                icon: 'success',
                title: 'Modification réussie',
                text: `Le cours ${updatedCours.intitule} a été mis à jour avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadCours();
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
        // Création d'un nouveau cours
        this.coursService.createCours(coursData).subscribe({
          next: (newCours) => {
            if (newCours) {
              Swal.fire({
                icon: 'success',
                title: 'Création réussie',
                text: `Le cours ${newCours.intitule} a été créé avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadCours();
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
  showValidationErrors(errors: any): void {
    // Construction du message HTML pour les erreurs
    let errorHTML = '<div class="validation-errors">';

    Object.keys(errors).forEach(key => {
      const errorMessage = errors[key];
      let icon = 'fas fa-exclamation-circle';
      let errorClass = 'validation-error';

      // Personnaliser les icônes et classes selon le type d'erreur
      if (key === 'uniciteCode') {
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

  editCours(cours: Cours): void {
    this.isEditMode = true;
    this.currentCoursId = cours.id;
    this.showViewMode = false;
    this.showForm = true;

    this.coursForm.setValue({
      code: cours.code,
      intitule: cours.intitule,
      vhCT: cours.vhCT,
      vhTP: cours.vhTP,
      vhTD: cours.vhTD,
      credit: cours.credit,
      classeId: cours.classeId,
      enseignantId: cours.enseignantId,
      semestre: cours.semestre
    });

    this.formSubmitted = false;
  }

  deleteCours(cours: Cours): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer le cours <strong class="cours-name">"${cours.intitule}"</strong> ?</p>`,
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

        this.coursService.deleteCours(cours.id).subscribe({
          next: (success) => {
            if (success) {
              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">Le cours <strong>"${cours.intitule}"</strong> a été supprimé.</p>`,
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
              this.loadCours();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer ce cours',
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
    this.selectedClasse = '';
    this.selectedEnseignant = '';
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

  // Calcul du volume horaire total
  getVolumeHoraireTotal(cours: Cours): number {
    return cours.vhCT + cours.vhTD + cours.vhTP;
  }

  // Calcul du volume horaire restant total
  getVolumeHoraireRestantTotal(cours: Cours): number {
    return cours.restantVhCT + cours.restantVhTD + cours.restantVhTP;
  }

  // Calcul du volume horaire effectué
  getVolumeHoraireEffectue(cours: Cours): number {
    const total = this.getVolumeHoraireTotal(cours);
    const restant = this.getVolumeHoraireRestantTotal(cours);
    return total - restant;
  }

  // Formatage du nom de la classe
  getClasseNom(classeId: string): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : classeId;
  }

  // Formatage du nom de l'enseignant
  getEnseignantNom(enseignantId: string): string {
    const enseignant = this.enseignants.find(e => e.id === enseignantId);
    return enseignant ? `${enseignant.nom} ${enseignant.prenom}` : enseignantId;
  }
}
