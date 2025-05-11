import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slidebar-mobile',
  imports: [RouterLink, CommonModule],
  templateUrl: './slidebar-mobile.component.html',
  styleUrl: './slidebar-mobile.component.scss'
})
export class SlidebarMobileComponent {

  constructor(private router: Router) { }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

}
