// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Alert, AlertClientService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';
import { KeywordService } from '../../services/keyword.service';
import { FormsModule } from '@angular/forms';

import { PanelModule } from 'primeng/panel';
import { SlidebarMobileComponent } from "../../slidebar-mobile/slidebar-mobile.component";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, PanelModule, SlidebarMobileComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  alerts: (Alert & { _showRaw?: boolean })[] = [];
  keywords: string[] = [];
  newKeyword = '';
  stats: Record<string, number> = {};

  // Áudio de notificação (coloque notify.mp3 em src/assets/)
  private notifyAudio = new Audio('/assets/notify.mp3');
  // Só guardamos a quantidade anterior de alerts
  private lastAlertCount = 0;

  constructor(
    private alertClient: AlertClientService,
    private kwClient: KeywordService
  ) {}

  ngOnInit() {
    // Pré-carrega o áudio
    this.notifyAudio.load();

    // Primeiro carrega keywords (para depois poder recarregar alerts)
    this.loadKeywords();

    // Chama pela primeira vez e em polling
    this.loadAlerts();
    setInterval(() => this.loadAlerts(), 5000);


    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notificações permitidas!');
          } else {
            console.warn('Usuário negou ou ignorou a notificação.');
          }
        });
      }
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }

  private previousAlertCount = 0;

  private loadAlerts() {
    this.alertClient.getAlerts().subscribe(data => {
      if (data.length > this.previousAlertCount) {
        const newAlert = data[0]; // ou pegue os novos
  
        this.showDesktopNotification(
          `${newAlert.aviso}`,
          `${newAlert.status || 'Novo alerta recebido.'}`
        );
  
        // TOCAR SOM
        this.notifyAudio.play().catch(err => {
          console.warn('Erro ao tentar tocar som de notificação:', err);
        });
      }
  
      this.previousAlertCount = data.length;
      if (this.alerts.length !== data.length) {
        this.alerts = data;
      }
      this.calculateStats();
    });
  }
  

  showDesktopNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'assets/nobreak-icon.png', // opcional
      });
    }
  }
  

  private loadKeywords() {
    this.kwClient.getKeywords()
      .subscribe(data => {
        this.keywords = data;
        // Depois de atualizar keywords, recarrega alerts pra stats ficar consistentes
        this.loadAlerts();
      });
  }

  addKeyword() {
    const word = this.newKeyword.trim();
    if (!word) return;
    this.kwClient.addKeyword(word)
      .subscribe(res => {
        if (res.added) {
          this.loadKeywords();
        }
        this.newKeyword = '';
      });
  }

  removeKeyword(word: string) {
    this.kwClient.removeKeyword(word)
      .subscribe(() => this.loadKeywords());
  }

  private calculateStats() {
    const counts: Record<string, number> = {};

    for (const kw of this.keywords) {
      const upper = kw.toUpperCase();
      const qtd = this.alerts.filter(a =>
        a.aviso.toUpperCase().includes(upper)
      ).length;
      if (qtd > 0) {
        counts[kw] = qtd;
      }
    }

    this.stats = counts;
    console.log('STATS POR KEYWORD:', this.stats);
  }


}
