import './app/locale';
import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment, firebaseConfig } from './app/environnement/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)), // 👈 initialise Firebase
    provideAuth(() => getAuth()), // 👈 ajoute le provider Auth
  ]
}).catch(err => console.error(err));


