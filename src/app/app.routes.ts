import { Routes } from '@angular/router';
import { LoginComponent } from './view/login/login.component';
import { RegisterComponent } from './view/register/register.component';
import { CoursComponent } from './view/cours/cours.component';
import { LayoutComponent } from './view/layout/layout.component';
import { DashbordComponent } from './view/dashbord/dashbord.component';
import { FiliereComponent } from './view/filiere/filiere.component';
import { EnseignantComponent } from './view/enseignant/enseignant.component';
import { EtudiantComponent } from './view/etudiant/etudiant.component';
import { SalleComponent } from './view/salle/salle.component';
import { AdministrationComponent } from './view/administration/administration.component';
import { VerificationComponent } from './view/verification/verification.component';
import { ClasseComponent } from './view/classe/classe.component';
import { CreationSeancesComponent } from './view/seances/creation-seances.component';
import { EmploiDuTempsComponent } from './view/seances/emploi-du-temps.component';
import { ValidationComptesComponent } from './view/validation-comptes/validation-comptes.component';
import { UtilisateursComponent } from './view/utilisateurs/utilisateurs.component';
import { ParentComponent } from './view/parent/parent.component';

export const routes: Routes = [
  {
    path: 'login',
    component:LoginComponent
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'verification',
    component: VerificationComponent
  },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashbord', component: DashbordComponent },
      { path: 'cours', component: CoursComponent },

      { path: 'filieres', component: FiliereComponent },

      { path: 'enseignants', component: EnseignantComponent },
      {path: 'etudiant', component:EtudiantComponent},
      {path: 'parent', component:ParentComponent},
      { path: 'salles', component: SalleComponent },
      { path: 'classes', component: ClasseComponent },

      { path: 'creation-seances', component: CreationSeancesComponent },
      { path: 'emploi-du-temps', component: EmploiDuTempsComponent },
      { path: 'validation-comptes', component: ValidationComptesComponent },
      { path: 'utilisateurs', component: UtilisateursComponent },

      { path: 'administration', component: AdministrationComponent },

      { path: 'etudiant', component: EtudiantComponent }
    ]
  }

];
