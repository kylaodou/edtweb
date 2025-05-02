import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environnement/environment';
import { AnneesAcademiques, AnneesAcademiquesDto } from '../model/anneesAcademiques';
import { ApiResponse } from '../model/apiResponse';

@Injectable({
  providedIn: 'root'
})
export class AnneesAcademiquesService {
  private apiUrl = `${environment.apiUrl}/annees-academiques`;

  constructor(private http: HttpClient) { }

  getAllAnneesAcademiques(): Observable<AnneesAcademiques[]> {
    return this.http.get<ApiResponse<AnneesAcademiques[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        })
      );
  }

  getAnneesAcademiquesById(id: string): Observable<AnneesAcademiques | null> {
    return this.http.get<ApiResponse<AnneesAcademiques>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  getActiveAnneesAcademiques(): Observable<AnneesAcademiques | null> {
    return this.http.get<ApiResponse<AnneesAcademiques>>(`${this.apiUrl}/active`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  createAnneesAcademiques(anneeAcademique: AnneesAcademiquesDto): Observable<AnneesAcademiques | null> {
    return this.http.post<ApiResponse<AnneesAcademiques>>(this.apiUrl, anneeAcademique)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  updateAnneesAcademiques(id: string, anneeAcademique: AnneesAcademiquesDto): Observable<AnneesAcademiques | null> {
    return this.http.put<ApiResponse<AnneesAcademiques>>(`${this.apiUrl}/${id}`, anneeAcademique)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  activateAnneesAcademiques(id: string): Observable<AnneesAcademiques | null> {
    return this.http.put<ApiResponse<AnneesAcademiques>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  deleteAnneesAcademiques(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.success || false)
      );
  }
}
