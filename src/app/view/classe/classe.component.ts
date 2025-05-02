import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Classe } from '../../model/classe';
import { ClasseService } from '../../service/classe.service';
import { Filiere } from '../../model/filiere';
import { FiliereService } from '../../service/filiere.service';
import { AnneesAcademiques, AnneesAcademiquesDto } from '../../model/anneesAcademiques';
import { AnneesAcademiquesService } from '../../service/annee.service';
import { Etudiant } from '../../model/etudiant';
import { EtudiantService } from '../../service/etudiant.service';

@Component({
  selector: 'app-classe',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './classe.component.html',
  styleUrl: './classe.component.css',
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

export class ClasseComponent implements OnInit {

  classes: Classe[] = [];
  filieres: Filiere[] = [];
  annees: AnneesAcademiques[] = [];
  etudiants: Etudiant[] = [];
  classeForm: FormGroup;
  isEditMode = false;
  currentClasseId: string | null = null;
  showForm = false;
  showViewMode = false;
  selectedClasse: Classe | null = null;
  formSubmitted = false;
  searchText = '';
  selectedFiliere = '';
  selectedNiveau = '';
  niveaux: string[] = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];
  isLoading = true;
  nomFocused = false;
  filiereFocused = false;
  niveauFocused = false;
  anneeFocused = false;
  delegueFocused = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private classeService: ClasseService,
    private filiereService: FiliereService,
    private anneeService: AnneesAcademiquesService,
    private etudiantService: EtudiantService
  ) {
    this.classeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(1)]],
      filiereId: ['', Validators.required],
      niveau: ['', Validators.required],
      delegueId: [''],
    });
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadFilieres();
    this.loadAnnees();
    this.loadEtudiants();
  }

  loadClasses(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.classeService.getAllClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des classes', error);
        this.errorMessage = 'Impossible de charger les classes. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  loadFilieres(): void {
    this.filiereService.getAllFilieres().subscribe({
      next: (data) => {
        this.filieres = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des filières', error);
      }
    });
  }

  loadAnnees(): void {
    this.anneeService.getAllAnneesAcademiques().subscribe({
      next: (data) => {
        this.annees = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des années académiques', error);
      }
    });
  }

  loadEtudiants(): void {
    console.log('Chargement des étudiants...');
    this.etudiantService.getAllEtudiants().subscribe({
      next: (data: Etudiant[]) => {
        console.log('Étudiants chargés avec succès:', data.length);
        this.etudiants = data;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des étudiants', error);
        // Afficher un message d'erreur à l'utilisateur
        this.errorMessage = 'Impossible de charger la liste des étudiants. Veuillez réessayer.';
        // Initialiser avec un tableau vide pour éviter les erreurs
        this.etudiants = [];
      },
      complete: () => {
        console.log('Chargement des étudiants terminé');
      }
    });
  }



  get filteredClasses(): Classe[] {
    return this.classes.filter(classe => {
      const matchesSearch = this.searchText ?
        (classe.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (classe.filiereName && classe.filiereName.toLowerCase().includes(this.searchText.toLowerCase())) ||
        (classe.niveau && classe.niveau.toLowerCase().includes(this.searchText.toLowerCase()))) :
        true;

      const matchesFiliere = this.selectedFiliere ?
        classe.filiereId === this.selectedFiliere :
        true;

      const matchesNiveau = this.selectedNiveau ?
        classe.niveau === this.selectedNiveau :
        true;

      return matchesSearch && matchesFiliere && matchesNiveau;
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
    this.classeForm.reset();
    this.formSubmitted = false;
    this.currentClasseId = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
    this.selectedClasse = null;
  }

  // Méthode pour voir les détails
  viewClasse(classe: Classe): void {
    this.selectedClasse = classe;
    this.showViewMode = true;
    this.showForm = false;
  }

  // Méthode pour passer du mode visualisation au mode édition
  switchToEditMode(): void {
    if (this.selectedClasse) {
      this.showViewMode = false;
      this.showForm = true;
      this.isEditMode = true;
      this.currentClasseId = this.selectedClasse.id;

      this.classeForm.setValue({
        nom: this.selectedClasse.nom,
        filiereId: this.selectedClasse.filiereId,
        niveau: this.selectedClasse.niveau,
        delegueId: this.selectedClasse.delegueId || '',
      });

      this.formSubmitted = false;
    }
  }

  submitForm(): void {
    this.formSubmitted = true;

    if (this.classeForm.valid) {
      const classeData = {
        nom: this.classeForm.value.nom,
        filiereId: this.classeForm.value.filiereId,
        niveau: this.classeForm.value.niveau,
        anneeId: this.classeForm.value.anneeId || null,
        delegueId: this.classeForm.value.delegueId || null,
      };

      if (this.isEditMode && this.currentClasseId) {
        // Édition d'une classe existante
        this.classeService.updateClasse(this.currentClasseId, classeData).subscribe({
          next: (updatedClasse) => {
            if (updatedClasse) {
              Swal.fire({
                icon: 'success',
                title: 'Modification réussie',
                text: `La classe ${updatedClasse.nom} a été mise à jour avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadClasses();
              this.closeForm();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour', error);
            let errorMessage = 'Une erreur est survenue lors de la mise à jour';

            if (error.error?.errors) {
              errorMessage = Object.values(error.error.errors).join('\n');
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: errorMessage,
              confirmButtonText: 'OK'
            });
          }
        });
      } else {
        // Création d'une nouvelle classe
        this.classeService.createClasse(classeData).subscribe({
          next: (newClasse) => {
            if (newClasse) {
              Swal.fire({
                icon: 'success',
                title: 'Création réussie',
                text: `La classe ${newClasse.nom} a été créée avec succès`,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadClasses();
              this.closeForm();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);

            let errorMessage = 'Une erreur est survenue lors de la création';
            if (error.error?.errors) {
              errorMessage = Object.values(error.error.errors).join('\n');
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: errorMessage,
              confirmButtonText: 'OK'
            });
          }
        });
      }
    }
  }

  editClasse(classe: Classe): void {
    this.isEditMode = true;
    this.currentClasseId = classe.id;
    this.showViewMode = false;
    this.showForm = true;

    this.classeForm.setValue({
      nom: classe.nom,
      filiereId: classe.filiereId,
      niveau: classe.niveau,
      delegueId: classe.delegueId || '',
    });

    this.formSubmitted = false;
  }

  deleteClasse(classe: Classe): void {
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
      html: `<p class="delete-message">Voulez-vous vraiment supprimer la classe <strong class="salle-name">"${classe.nom} - ${this.getFiliereNom(classe.filiereId)}"</strong> ?</p>`,
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

        this.classeService.deleteClasse(classe.id).subscribe({
          next: (success) => {
            if (success) {
              Swal.fire({
                icon: 'success',
                title: '<span class="success-title">Supprimé avec succès!</span>',
                html: `<p class="success-message">La classe <strong>"${classe.nom} - ${this.getFiliereNom(classe.filiereId)}"</strong> a été supprimée.</p>`,
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
              this.loadClasses();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de supprimer cette classe',
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
    this.selectedFiliere = '';
    this.selectedNiveau = '';
    this.loadClasses();
  }

  // Méthodes utilitaires pour l'affichage
  getFiliereNom(filiereId: string): string {
    const filiere = this.filieres.find(f => f.id === filiereId);
    return filiere ? filiere.nom : 'Non spécifiée';
  }

  getAnneeNom(anneeId: string | undefined): string {
    if (!anneeId) return 'Non spécifiée';
    const annee = this.annees.find(a => a.id === anneeId);
    return annee ? annee.intitule : 'Non spécifiée';
  }

  getDelegueNom(delegueId: string | undefined): string {
    if (!delegueId) return 'Non spécifié';
    const etudiant = this.etudiants.find(e => e.id === delegueId);
    return etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Non spécifié';
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
