import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { UserService } from '../../service/user.service';
import { User, UserWithDetails, Roles } from '../../model/user';
import { EtudiantService } from '../../service/etudiant.service';
import { EnseignantService } from '../../service/enseignant.service';
import { AdministrationService } from '../../service/administration.service';
import { ParentService } from '../../service/parent.service';

@Component({
  selector: 'app-validation-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validation-comptes.component.html',
  styleUrls: ['./validation-comptes.component.css'],
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
export class ValidationComptesComponent implements OnInit {
  inactiveUsers: UserWithDetails[] = [];
  searchText = '';
  isLoading = true;
  roles = Roles;
  showViewMode = false;
  showForm = false;
  selectedUserWithDetails: UserWithDetails | null = null;
  constructor(
    private userService: UserService,
    private etudiantService: EtudiantService,
    private enseignantService: EnseignantService,
    private administrationService: AdministrationService,
    private parentService: ParentService
  ) {}

  ngOnInit(): void {
    this.loadInactiveUsers();
  }

  loadInactiveUsers(): void {
    this.isLoading = true;
    this.userService.getInactiveUsers().subscribe({
      next: (data) => {
        this.inactiveUsers = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs inactifs', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les utilisateurs en attente de validation. Veuillez réessayer plus tard.',
        });
      }
    });
  }

  filteredUsers(): UserWithDetails[] {
    if (!this.inactiveUsers) return [];

    return this.inactiveUsers.filter(userWithDetails => {
      const user = userWithDetails.user;
      const matchesSearch = !this.searchText ||
        user.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (user.role && user.role.toString().toLowerCase().includes(this.searchText.toLowerCase()));

      return matchesSearch;
    });
  }

  validateUser(user: User): void {
    Swal.fire({
      title: 'Confirmer la validation',
      html: `Voulez-vous vraiment valider le compte de <strong>${user.email}</strong> ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Validation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.userService.validateUser(user.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadInactiveUsers();
              Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Compte validé avec succès',
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: response.message || 'Erreur lors de la validation du compte'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la validation du compte', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de la validation du compte'
            });
          }
        });
      }
    });
  }

  invalidateUser(user: User): void {
    Swal.fire({
      title: 'Confirmer le refus',
      html: `Voulez-vous vraiment refuser le compte de <strong>${user.email}</strong> ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, refuser',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Refus en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.userService.invalidateUser(user.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadInactiveUsers();
              Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Compte refusé avec succès',
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: response.message || 'Erreur lors du refus du compte'
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors du refus du compte', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors du refus du compte'
            });
          }
        });
      }
    });
  }

  viewUserDetails(userWithDetails: UserWithDetails): void {
    this.selectedUserWithDetails = userWithDetails;
    this.showViewMode = true;
    this.showForm = true;
  }
  closeForm(): void {
    this.showForm = false;
    this.showViewMode = false;
  } 

  private getEtudiantDetailsHtml(etudiant: any): string {
    return `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Matricule:</span>
          <span class="detail-value">${etudiant.matricule || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nom:</span>
          <span class="detail-value">${etudiant.nom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Prénom:</span>
          <span class="detail-value">${etudiant.prenom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date de naissance:</span>
          <span class="detail-value">${etudiant.dateNaissance ? new Date(etudiant.dateNaissance).toLocaleDateString() : 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Lieu de naissance:</span>
          <span class="detail-value">${etudiant.lieuNaissance || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Téléphone:</span>
          <span class="detail-value">${etudiant.telephone || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sexe:</span>
          <span class="detail-value">${etudiant.sexe || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Classe:</span>
          <span class="detail-value">${etudiant.classeNom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Délégué:</span>
          <span class="detail-value">${etudiant.estDelegue ? 'Oui' : 'Non'}</span>
        </div>
      </div>
    `;
  }

  private getEnseignantDetailsHtml(enseignant: any): string {
    return `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Matricule:</span>
          <span class="detail-value">${enseignant.matricule || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nom:</span>
          <span class="detail-value">${enseignant.nom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Prénom:</span>
          <span class="detail-value">${enseignant.prenom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Téléphone:</span>
          <span class="detail-value">${enseignant.telephone || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Spécialité:</span>
          <span class="detail-value">${enseignant.specialite || 'Non disponible'}</span>
        </div>
      </div>
    `;
  }

  private getAdministrationDetailsHtml(administration: any): string {
    return `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Matricule:</span>
          <span class="detail-value">${administration.matricule || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nom:</span>
          <span class="detail-value">${administration.nom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Prénom:</span>
          <span class="detail-value">${administration.prenom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fonction:</span>
          <span class="detail-value">${administration.fonction || 'Non disponible'}</span>
        </div>
      </div>
    `;
  }

  private getParentDetailsHtml(parent: any): string {
    const enfantsNoms = parent.enfantsNoms ? parent.enfantsNoms.join(', ') : 'Non disponible';

    return `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Nom:</span>
          <span class="detail-value">${parent.nom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Prénom:</span>
          <span class="detail-value">${parent.prenom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Téléphone:</span>
          <span class="detail-value">${parent.telephone || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Relation avec étudiant:</span>
          <span class="detail-value">${parent.relationAvecEtudiant || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Enfants:</span>
          <span class="detail-value">${enfantsNoms}</span>
        </div>
      </div>
    `;
  }

  private getSuperAdminDetailsHtml(superAdmin: any): string {
    return `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Nom:</span>
          <span class="detail-value">${superAdmin.nom || 'Non disponible'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Prénom:</span>
          <span class="detail-value">${superAdmin.prenom || 'Non disponible'}</span>
        </div>
      </div>
    `;
  }

  resetFilters(): void {
    this.searchText = '';
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

  getRoleBadgeClass(role?: Roles): string {
    if (!role) return 'badge-secondary';

    switch (role) {
      case Roles.SUPERADMIN:
        return 'badge-danger';
      case Roles.ADMINISTRATION:
        return 'badge-primary';
      case Roles.ENSEIGNANT:
        return 'badge-info';
      case Roles.PARENT:
        return 'badge-warning';
      case Roles.DELEGUE:
        return 'badge-success';
      case Roles.ETUDIANT:
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }
}
