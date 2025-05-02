import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { UserService } from '../../service/user.service';
import { User, Roles, UserWithDetails } from '../../model/user';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css'],
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
export class UtilisateursComponent implements OnInit {
  users: UserWithDetails[] = [];
  searchText = '';
  selectedRole = '';
  isLoading = true;
  roles = Roles;
  rolesList = Object.values(Roles);
  showViewMode = false;
  showForm = false;
  selectedUserWithDetails: UserWithDetails | null = null;

  constructor(
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsersWithDetails().subscribe({
      next: (data) => {
        // Filtrer pour n'avoir que les utilisateurs avec un rôle défini
        this.users = data.filter(user => user.user.role !== undefined && user.user.role !== null);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les utilisateurs. Veuillez réessayer plus tard.',
        });
      }
    });
  }

  filteredUsers(): UserWithDetails[] {
    if (!this.users) return [];

    return this.users.filter(userWithDetails => {
      const user = userWithDetails.user;
      const matchesSearch = !this.searchText ||
        user.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (user.role && user.role.toString().toLowerCase().includes(this.searchText.toLowerCase()));

      const matchesRole = !this.selectedRole || (user.role === this.selectedRole);

      return matchesSearch && matchesRole;
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

  resetFilters(): void {
    this.searchText = '';
    this.selectedRole = '';
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
