// alert-client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Alert {
  time: string;
  aviso: string;
  dataHora: string;
  ip: string;
  nomeSistema: string;
  contato: string;
  localidade: string;
  status: string;
  mensagemOriginal?: string;
}

@Injectable({ providedIn: 'root' })
export class AlertClientService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.apiUrl}`


  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts`);
  }

  

  addRemetente(remetente: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/remetentes`, { remetente });
  }
  
}
