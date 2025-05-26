import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';


export interface AddEmailDto {
  email: string;
  senha: string;
  chatId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) { }

  private apiUrl = `${environment.apiUrl}`

  getEmailBlocked() {
    return this.http.get<any>(`${this.apiUrl}/email/listblock`);
  }

  addEmailBlocked(email: string) {
    return this.http.post<any>(`${this.apiUrl}/email/block`, { email });
  }

  removeEmailBlocked(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/email/block/${id}`);
  }

  getEmail() {
    return this.http.get<any>(`${this.apiUrl}/email/list`);
  }

  unblockEmail(email: string) {
    return this.http.delete<any>(`${this.apiUrl}/email/block/${email}`);
  }

  addEmail(dados: AddEmailDto) {
    return this.http.post<any>(`${this.apiUrl}/email/addemail`, dados);
  }

  removeEmail(email: string) {
    return this.http.delete<any>(`${this.apiUrl}/email/${email}`);
  }
}
