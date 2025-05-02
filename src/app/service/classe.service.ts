import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { Classe } from '../model/classe';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {
  private apiUrl = `${environment.apiUrl}/classes`;

  constructor(private http: HttpClient) { }

  getAllClasses(): Observable<Classe[]> {
    return this.http.get<ApiResponse<Classe[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  getClasseById(id: string): Observable<Classe | null> {
    return this.http.get<ApiResponse<Classe>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  getClassesByFiliere(filiereId: string): Observable<Classe[]> {
    return this.http.get<ApiResponse<Classe[]>>(`${this.apiUrl}/filiere/${filiereId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  getClassesByNiveau(niveau: string): Observable<Classe[]> {
    return this.http.get<ApiResponse<Classe[]>>(`${this.apiUrl}/niveau/${niveau}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  getClassesByAnnee(anneeId: string): Observable<Classe[]> {
    return this.http.get<ApiResponse<Classe[]>>(`${this.apiUrl}/annee/${anneeId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  createClasse(classe: Partial<Classe>): Observable<Classe | null> {
    return this.http.post<ApiResponse<Classe>>(this.apiUrl, classe)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  updateClasse(id: string, classe: Partial<Classe>): Observable<Classe | null> {
    return this.http.put<ApiResponse<Classe>>(`${this.apiUrl}/${id}`, classe)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  deleteClasse(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false)
      );
  }
}
