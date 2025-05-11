import { Component } from '@angular/core';
import { Alert, AlertClientService } from '../../services/alert.service';
import { KeywordService } from '../../services/keyword.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlidebarMobileComponent } from "../../slidebar-mobile/slidebar-mobile.component";

@Component({
  selector: 'app-keyword-list',
  imports: [CommonModule, FormsModule, SlidebarMobileComponent],
  templateUrl: './keyword-list.component.html',
  styleUrl: './keyword-list.component.scss'
})
export class KeywordListComponent {
  alerts: (Alert & { _showRaw?: boolean })[] = [];
  keywords: string[] = [];
  newKeyword = '';
  stats: Record<string, number> = {};

  // Áudio de notificação (coloque notify.mp3 em src/assets/)
  private notifyAudio = new Audio('assets/notihgfy.mp3');
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
    // setInterval(() => this.loadAlerts(), 5000);
  }

  private loadAlerts() {
    this.alertClient.getAlerts()
      .subscribe(data => {
        // Se vier mais alerts que da última vez, toca o som
        if (data.length > this.lastAlertCount) {
          this.notifyAudio
            .play()
            .catch(err => console.warn('Não foi possível tocar o som de notificação', err));
        }

        // Atualiza state
        this.alerts = data;
        this.lastAlertCount = data.length;
        this.calculateStats();
      });
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
