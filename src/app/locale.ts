import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Données de la locale française, utilisées par le pipe « date » (ex. date:'fullDate':'':'fr').
// Sans elles, l'affichage des dates en français échoue (erreur NG0701).
registerLocaleData(localeFr, 'fr');
