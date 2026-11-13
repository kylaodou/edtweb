# EDT Web — Gestion des emplois du temps

Application web de gestion des emplois du temps d'un établissement d'enseignement supérieur.
L'administration y gère les filières, classes, salles, cours, enseignants et étudiants, crée les
séances et publie les emplois du temps ; enseignants, étudiants et parents les consultent.

Elle s'appuie sur l'API [`apiEDT`](https://github.com/kylaodou/apiEDT). L'application mobile
correspondante est [`modible_edt`](https://github.com/kylaodou/modible_edt).

## Fonctionnalités

- **Comptes** : inscription, connexion avec code de vérification par e-mail, validation des comptes
  par l'administration.
- **Tableau de bord** avec statistiques (Chart.js).
- **Référentiels** : filières, classes, salles, cours.
- **Personnes** : enseignants, étudiants, utilisateurs, administration.
- **Séances** : création des séances (cours, salle, enseignant, créneau).
- **Emploi du temps** : affichage par classe et par semaine.
- **Espaces dédiés** : enseignant, étudiant, parent.
- Animations Lottie sur les écrans de connexion et d'inscription.

## Stack technique

- Angular 19 avec rendu côté serveur (Angular SSR, Express)
- Bootstrap 5
- Chart.js
- Firebase

## Prérequis

- Node.js 20+ et npm
- Angular CLI 19
- L'API `apiEDT` lancée sur http://localhost:8080

## Installation et lancement

```bash
git clone https://github.com/kylaodou/edtweb.git
cd edtweb
npm install
npm start
```

L'application est disponible sur http://localhost:4200.

## Configuration

L'URL de l'API se règle dans `src/app/environnement/` :

```ts
apiUrl: 'http://localhost:8080/api'
```

## Build et rendu serveur

```bash
npm run build
npm run serve:ssr:gestion_emploi_temps
```

Le serveur Node sert alors l'application pré-rendue sur http://localhost:4000.

## Auteur

[@kylaodou](https://github.com/kylaodou)
