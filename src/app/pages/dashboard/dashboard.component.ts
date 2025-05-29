// dashboard.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Alert, AlertClientService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';
import { KeywordService } from '../../services/keyword.service';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { InputTextModule } from 'primeng/inputtext';
import { ChipsModule } from 'primeng/chips';
import { AddEmailDto, EmailService } from '../../services/email.service';
import { TelegramService } from '../../services/telegram.service';
import { DialogModule } from 'primeng/dialog';
import { Client } from '../../../cliente.dto';
import { ReactiveFormsModule } from '@angular/forms';
import { NotifysComponent } from '../../components/notifys/notifys.component';

interface EmailWithGroup {
  email: string;
  chatId: string;
  groupName?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, OverlayBadgeModule, ChipsModule, DialogModule, ReactiveFormsModule, NotifysComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @Output() notifyClicked = new EventEmitter<void>();
  alerts: (Alert & { _showRaw?: boolean })[] = [];
  keywords: string[] = [];
  remetentes: any[] = [];
  blockTags: string[] = [];
  emails: EmailWithGroup[] = [];
  newKeyword = '';
  newTagBlocked = '';
  stats: Record<string, number> = {};
  listEmails: EmailWithGroup[] = [];
  displayEmailDialog = false;
  selectedEmail!: EmailWithGroup;
  displayCriarCliente: boolean = false;
  editclient: boolean = false;
  clientForm: FormGroup;
  tags: string[] = [];
  editingIndex = -1;
  newTag = '';
  showNotify = false;
  
  client: Client[] = []
  
  newEmail: AddEmailDto = {
    email: '',
    senha: '',
    chatId: ''
  };
  emailBlocked: string = '';

  private lastAlertCount = 0;

  constructor(
    private alertClient: AlertClientService,
    private kwClient: KeywordService,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private fb: FormBuilder
  ) { 
    this.clientForm = this.fb.group({
      nome: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]]
    });
  }




  ngOnInit() {
    this.loadKeywords();
    this.loadEmail();

    this.loadEmailBlocked();

    this.kwClient.getKeywordsBlocked().subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.blockTags = data;
      },
      error: (error) => {
        console.error('Erro ao carregar tags bloqueadas:', error);
      }
    })

    // Chama pela primeira vez e em polling
    this.loadAlerts();
    // setInterval(() => this.loadAlerts(), 5000);


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

  onNotifyClick() {
    this.showNotify = true
  }

  onCloseNotify() {
    this.showNotify = false;
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

        // // TOCAR SOM
        // this.notifyAudio.play().catch(err => {
        //   console.warn('Erro ao tentar tocar som de notificação:', err);
        // });
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


  removeRemetente(remetente: string) {
  }

  addRemetente(remetente: string) {

  }

  blockEmail() {
    const email = this.emailBlocked.trim();
    if (!email) return;
    this.emailService.addEmailBlocked(email)
      .subscribe(res => {
        if (res.added) {
          this.loadEmailBlocked();
        }
        this.emailBlocked = '';
      });
  }

  loadEmailBlocked() {
    this.emailService.getEmailBlocked().subscribe({
      next: (data: any[]) => {
        this.remetentes = data.map(remetente => remetente.email);
      },
    })
  }

  unblockEmail(email: string) {
    this.emailService.unblockEmail(email).subscribe({
      next: (data: any) => {
        this.loadEmailBlocked();
      },
    })
  }


  addTagBlocked() {
    const tag = this.newTagBlocked.trim();
    if (!tag) return;
    this.kwClient.addKeywordBlocked(tag).subscribe({
      next: (data: any) => {
        this.loadTagBlocked();
        this.newTagBlocked = '';
      },
    })
  }

  loadTagBlocked() {
    this.kwClient.getKeywordsBlocked().subscribe({
      next: (data: any[]) => {
        this.blockTags = data;
      },
    })
  }

  removeTagBlocked(tag: string) {
    this.kwClient.removeKeywordBlocked(tag).subscribe({
      next: (data: any) => {
        this.loadTagBlocked();
      },
    })
  }

  addEmail() {
    this.emailService.addEmail(this.newEmail).subscribe({
      next: (data: any) => {
        this.loadEmail();
        this.newEmail = {
          email: '',
          senha: '',
          chatId: ''
        };
      },
    })
  }

  loadEmail() {
    this.emailService.getEmail().subscribe(data => {
      // inicializa o array com groupName vazio
      this.emails = data.map((email: any) => ({ ...email, groupName: '' }));
      // para cada email, busca o título do grupo e preenche
      this.emails.forEach(email => {
        this.telegramService.getChatInfo(email.chatId).subscribe({
          next: res => {
            email.groupName = res.result?.title ?? `Grupo ${email.chatId}`;
          },
          error: err => {
            console.error('Erro ao obter info do grupo:', err);
            email.groupName = `Grupo ${email.chatId}`;
          }
        });
      });
      console.log(this.emails);
    });
  }


  private getGroupName(chatId: string): void {
    this.telegramService.getChatInfo(chatId).subscribe({
      next: (response) => {
        if (response.ok && response.result) {
          console.log(response.result.title);
          return response.result.title;
        }
      },
      error: (error) => {
        console.error('Erro ao obter informações do grupo:', error);
        return `Grupo ${chatId}`;
      }
    });
  }

  removeEmail(email: string) {
    this.emailService.removeEmail(email).subscribe({
      next: (data: any) => {
        this.loadEmail();
      },
    })
  }

  showEmailDialog(email: EmailWithGroup) {
    this.selectedEmail = email;
    this.displayEmailDialog = true;
  }

  editClient(cliente: Client, index: number) {
    this.editingIndex = index;

    // abre diálogo
    this.displayCriarCliente = true;
  
    // preenche apenas os controles existentes
    this.clientForm.patchValue({
      nome: cliente.nome,
      telefone: cliente.telefone
    });
  
    // carrega as tags no array de edição
    this.tags = [...cliente.tags];
  
    // limpa o campo de nova tag
    this.newTag = '';
  }

  openDialog() {
    this.displayCriarCliente = true;
  }

  onDialogHide() {
    this.clientForm.reset();
    this.tags = [];
    this.newTag = '';
  }

  addTag() {
    const tag = this.newTag.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.newTag = '';
  }

  // Remove tag pelo índice
  removeTag(index: number) {
    this.tags.splice(index, 1);
  }
  createClient() {
    if (this.clientForm.invalid) return;

    const payload: Client = {
      ...this.clientForm.value,
      tags: [...this.tags]
    };
  
    if (this.editingIndex > -1) {
      this.client[this.editingIndex] = payload;
    } else {
      this.client.push(payload);
    }
  

    console.log('Clientes atuais:', this.client);

    this.clientForm.reset();
    this.tags = [];
    this.editingIndex = -1;
    this.displayCriarCliente = false;
  }
  

  get dialogHeader(): string {
    return this.editingIndex > -1 ? 'Dados do cliente' : 'Criar um novo cliente';
  }
  
}
