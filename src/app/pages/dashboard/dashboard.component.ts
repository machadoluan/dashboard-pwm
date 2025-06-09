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
import { NgxMaskDirective } from 'ngx-mask';
import { ContratosService } from '../../services/contratos.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from '../../services/toastr.service';
import { EquipamentosService } from '../../services/equipamentos.service';
interface EmailWithGroup {
  email: string;
  chatId: string;
  groupName?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgxMaskDirective, CommonModule, FormsModule, InputTextModule, OverlayBadgeModule, ChipsModule, DialogModule, ReactiveFormsModule, NotifysComponent],
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
  displayCriarEquipamento: boolean = false;
  editclient: Client | null = null;
  clientForm: FormGroup;
  tags: string[] = [];
  editingIndex = -1;
  newTag = '';
  showNotify = false;
  filterStatus: boolean | null = null;
  searchTerm: string = '';
  searchTermEquipamentos: string = '';
  status: { qrCode?: string; isReady?: boolean } = {};
  polling: any;
  client: Client[] = []
  equipamentos: any[] = []
  equipamentoForm: FormGroup;
  editingIndexEquipamento = -1;
  qrCode: string = '';

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
    private fb: FormBuilder,
    private contratosService: ContratosService,
    private http: HttpClient,
    private toastrService: ToastrService,
    private equipamentoService: EquipamentosService
  ) {
    this.clientForm = this.fb.group({
      nome: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      // endereco: ['', Validators.required]
    });

    this.equipamentoForm = this.fb.group({
      nome: ['', Validators.required],
      localidade: ['', Validators.required],
      ip: ['', Validators.required]
    });
  }




  ngOnInit() {

    this.http.get<any>('http://localhost:3000/whatsapp/qrcode')
      .subscribe(res => {
        this.qrCode = res.qrCode;
      });

    this.loadKeywords();
    this.loadEmail();
    this.loadContratos();
    this.loadEmailBlocked();
    this.verificarStatus();
    this.listEquipamentos();
    this.kwClient.getKeywordsBlocked().subscribe({
      next: (data: any[]) => {
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


  private previousAlertCount = 0;

  private loadAlerts() {
    this.alertClient.getAlerts().subscribe(data => {

      this.previousAlertCount = data.length;
      if (this.alerts.length !== data.length) {
        this.alerts = data;
      }
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
    if (!word) {
      this.toastrService.showError('Preencha o campo de palavra');
      return;
    }
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


  blockEmail() {
    const email = this.emailBlocked.trim();
    if (!email) {
      this.toastrService.showError('Preencha o campo de email');
      return;
    }
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
    if (!tag) {
      this.toastrService.showError('Preencha o campo de tag');
      return;
    }
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
    if (this.newEmail.email === '' || this.newEmail.senha === '' || this.newEmail.chatId === '') {
      this.toastrService.showError('Preencha todos os campos');
      return;
    }
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
    this.editclient = cliente;
    console.log(this.editclient);

    this.editingIndex = index;
    // abre diálogo
    this.displayCriarCliente = true;

    // preenche apenas os controles existentes
    this.clientForm.patchValue({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco
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
    this.editclient = null;
    console.log(this.editclient);
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




    console.log('Clientes atuais:', this.client);


  }


  get dialogHeader(): string {
    return this.editingIndex > -1 ? 'Dados do cliente' : 'Criar um novo cliente';
  }

  formatarTelefone(telefone: string): string {
    if (!telefone) return '';

    const apenasNumeros = telefone.replace(/\D/g, '');

    if (apenasNumeros.length === 11) {
      // Formato com 9 dígitos
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    } else if (apenasNumeros.length === 10) {
      // Formato com 8 dígitos
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    }

    return telefone; // fallback
  }

  loadContratos() {
    this.contratosService.getContratos().subscribe((contratos) => {
      this.client = contratos;
    });
  }

  createContrato() {
    const payload: Client = {
      ...this.clientForm.value,
      tags: [...this.tags],
      sinal: false
    };

    if (this.editingIndex > -1) {
      this.contratosService.updateContrato(this.editclient?.id!, payload).subscribe(() => {
        this.loadContratos();
        this.clientForm.reset();
        this.tags = [];
        this.editingIndex = -1;
        this.displayCriarCliente = false;
        this.editclient = null;
      });
    }
    else {
      this.contratosService.createContrato(payload).subscribe((contrato) => {
        console.log(contrato);
        this.loadContratos();
        this.clientForm.reset();
        this.tags = [];
        this.editingIndex = -1;
        this.displayCriarCliente = false;
        this.editclient = null;
      });
    }
  }



  deleteContrato() {
    console.log(this.editclient);

    this.contratosService.deleteContrato(this.editclient?.id!).subscribe((contrato) => {
      this.loadContratos();
      this.clientForm.reset();
      this.tags = [];
      this.editingIndex = -1;
      this.displayCriarCliente = false;
      this.editclient = null;
      this.editclient = null;
    });
  }

  get filteredClients(): Client[] {
    let lista = this.client;
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const termoEmMinusculas = this.searchTerm.trim().toLowerCase();
      lista = lista.filter(c =>
        // supondo que o campo seja `c.nome`
        c.nome.toLowerCase().includes(termoEmMinusculas) ||
        c.telefone.toLowerCase().includes(termoEmMinusculas) ||
        c.endereco.toLowerCase().includes(termoEmMinusculas)
      );
    }
    return lista;
  }



  // conectarWhatsapp() {
  //   if (this.polling) {
  //     clearInterval(this.polling);
  //   }

  //   this.status = {}; // limpa status anterior

  //   this.polling = setInterval(() => {
  //     this.http.get('http://localhost:3000/whatsapp/qrcode', { responseType: 'text' })
  //       .subscribe(data => {
  //         this.qrCodeImage = data; // This will be the base64 string
  //       });

  //   }, 3000);
  // }

  verificarStatus() {
    this.http.get<any>('http://localhost:3000/whatsapp/qrcode').subscribe(data => {
      this.status = data;
    });
  }


  listEquipamentos() {
    this.equipamentoService.getList().subscribe({
      next: (res) => {
        this.equipamentos = res
      }
    })
  }

  get filteredEquipamentos(): any[] {
    let lista = this.equipamentos;

    if (this.filterStatus !== null) {
      lista = lista.filter(c => {
        const statusBoolean = c.status === 'online';
        return statusBoolean === this.filterStatus;
      });
    }

    if (this.searchTermEquipamentos && this.searchTermEquipamentos.trim() !== '') {
      const termoEmMinusculas = this.searchTermEquipamentos.trim().toLowerCase();
      lista = lista.filter(c =>
        c.nome.toLowerCase().includes(termoEmMinusculas) ||
        c.localidade.toLowerCase().includes(termoEmMinusculas) ||
        c.ip.toLowerCase().includes(termoEmMinusculas)
      );
    }

    return lista;
  }


  toggleSemSinal() {
    this.filterStatus = this.filterStatus === false ? null : false;
    console.log('Filtro sem sinal:', this.filterStatus);
  }

  toggleComSinal() {
    this.filterStatus = this.filterStatus === true ? null : true;
    console.log('Filtro com sinal:', this.filterStatus);
  }

  editEquipamento(equipamento: any, index: number) {
    this.editEquipamento = equipamento;
    this.editingIndexEquipamento = index;
    this.displayCriarEquipamento = true;

    this.equipamentoForm.patchValue({
      nome: equipamento.nome,
      localidade: equipamento.localidade,
      ip: equipamento.ip
    });
  }


}
