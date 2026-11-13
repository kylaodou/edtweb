import '../app/locale';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Provider, EnvironmentProviders } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

/**
 * Dépendances communes aux tests unitaires des composants :
 * client HTTP de test (aucun appel réseau), routeur, animations désactivées
 * et un objet Auth de Firebase simulé.
 */
export const testProviders: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  provideNoopAnimations(),
  { provide: Auth, useValue: { currentUser: null } },
];
