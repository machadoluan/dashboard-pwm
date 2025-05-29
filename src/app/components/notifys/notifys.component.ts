import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-notifys',
  imports: [CommonModule],
  templateUrl: './notifys.component.html',
  styleUrl: './notifys.component.scss',
})
export class NotifysComponent {
  @Input() visible: boolean = false;
  animatingOut = false;

  @Output() closeNotify = new EventEmitter<void>();

  close() {
    this.closeNotify.emit();
    this.animatingOut = true;
  }

  onTransitionEnd() {
    if (!this.visible) {
      this.animatingOut = false;
    }
  }
}
