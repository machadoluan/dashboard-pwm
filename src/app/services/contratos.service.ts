import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Client } from '../../cliente.dto';

@Injectable({
  providedIn: 'root'
})
export class ContratosService {

  private apiUrl = `${environment.apiUrl}/contratos`;

  constructor(private http: HttpClient) { }

  getContratos(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}`);
  }

  createContrato(contrato: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}`, contrato);
  }

  updateContrato(id: number, contrato: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, contrato);
  }

  deleteContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
