import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

  constructor(private messageService: MessageService) { }


  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  showSucess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Sucesso!', detail: message })
  }
}
