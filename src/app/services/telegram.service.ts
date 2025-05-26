import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private apiUrl = environment.telegramApiUrl; // Você precisará configurar isso no seu environment
  private botToken = environment.telegramBotToken; // Você precisará configurar isso no seu environment

  constructor(private http: HttpClient) { }

  getChatInfo(chatId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/bot${this.botToken}/getChat?chat_id=${chatId}`);
  }
} 