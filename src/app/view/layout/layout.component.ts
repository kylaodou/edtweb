import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, AfterViewInit {

  menuState = {
    cours: false,
    salle: false,
    filiere: false,
    enseignant: false,
    etudiant: false,
    admin: false
  };

  loggedUser: any;
  userRole: string | null = null;

  constructor(private router: Router, private authService: AuthService) {
    // Récupérer les données utilisateur à partir du service Auth
    this.loggedUser = this.authService.getUserData();

    // Récupérer le rôle directement du service Auth
    this.userRole = this.authService.getUserRole();

    console.log('Utilisateur connecté (depuis AuthService):', this.loggedUser);
    console.log('Rôle utilisateur (depuis AuthService):', this.userRole);

    // Tentative de récupération depuis localStorage comme alternative
    const localUser = localStorage.getItem('loggedUser');
    if(localUser != null) {
      const parsedUser = JSON.parse(localUser);
      console.log('Utilisateur connecté (depuis localStorage):', parsedUser);

      // Si pas de rôle trouvé via AuthService, essayer depuis localStorage
      if (!this.userRole && parsedUser.role) {
        this.userRole = parsedUser.role;
        console.log('Rôle récupéré depuis localStorage:', this.userRole);
      }
    }

    // Vérifier également user_data
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      console.log('Données utilisateur (depuis user_data):', parsedUserData);

      // Si pas de rôle trouvé, essayer depuis user_data
      if (!this.userRole && parsedUserData?.user?.role) {
        this.userRole = parsedUserData.user.role;
        console.log('Rôle récupéré depuis user_data:', this.userRole);
      }
    }
  }

  ngOnInit() {
    // Initialisation du composant
  }

  ngAfterViewInit() {
    // Ajout des particules flottantes après le rendu de la vue
    this.createFloatingParticles();
  }

  toggleMenu(menuName: 'cours' | 'salle' | 'filiere' | 'enseignant' | 'etudiant' | 'admin') {
    this.menuState[menuName] = !this.menuState[menuName];
  }

  onLogoff() {
    // Ici, vous pouvez ajouter le code pour la déconnexion
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Méthode mise à jour pour vérifier les autorisations selon le rôle
  hasAccess(menuItem: string): boolean {
    const role = this.userRole;

    if (!role) {
      console.log(`Accès refusé à ${menuItem}: Aucun rôle trouvé`);
      return false;
    }

    if (role === 'SUPERADMIN') {
      console.log(`Accès accordé à ${menuItem}: Utilisateur SUPERADMIN`);
      return true; // Le SUPERADMIN a accès à tout
    }

    if (role === 'ADMINISTRATION') {
      // Liste des éléments auxquels l'ADMINISTRATION n'a pas accès
      const restrictedItems = [
        'administration',
        'validation-comptes',
        'utilisateurs',
        'parent',
        'salles',
        'filieres'
      ];

      const hasAccess = !restrictedItems.includes(menuItem);
      console.log(`Accès à ${menuItem} pour ADMINISTRATION: ${hasAccess ? 'Accordé' : 'Refusé'}`);
      return hasAccess;
    }

    // Pour les autres rôles, vous pouvez ajouter d'autres conditions ici
    console.log(`Accès refusé à ${menuItem}: Rôle ${role} non géré`);
    return false; // Par défaut, refuser l'accès
  }

  // Fonction pour créer les particules flottantes dans la navbar
  private createFloatingParticles() {
    const navbar = document.querySelector('.navbar') as HTMLElement;
    if (!navbar) return;

    // Créer des particules de décoration
    for(let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = `${Math.random() * 8 + 3}px`;
      particle.style.height = particle.style.width;
      particle.style.background = 'rgba(255, 255, 255, 0.5)';
      particle.style.borderRadius = '50%';
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.pointerEvents = 'none';

      // Animation pour chaque particule
      const duration = Math.random() * 6 + 4;
      const translateX = Math.random() * 40 - 20;
      const translateY = Math.random() * -50 - 20;

      particle.style.animation = `float ${duration}s linear infinite`;

      // Créer une animation unique pour chaque particule
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(${translateX}px, ${translateY}px) rotate(360deg);
            opacity: 0;
          }
        }
      `;

      document.head.appendChild(styleEl);
      navbar.appendChild(particle);
    }
  }
}
