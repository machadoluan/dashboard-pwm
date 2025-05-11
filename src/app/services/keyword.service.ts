import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.apiUrl}`


  getKeywords(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/keywords`);
  }

  addKeyword(word: string): Observable<{added: boolean}> {
    return this.http.post<{added: boolean}>(`${this.apiUrl}/keywords`, { word });
  }

  removeKeyword(word: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/keywords/${encodeURIComponent(word)}`);
  }
}