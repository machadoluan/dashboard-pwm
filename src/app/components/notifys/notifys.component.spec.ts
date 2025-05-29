import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotifysComponent } from './notifys.component';

describe('NotifysComponent', () => {
  let component: NotifysComponent;
  let fixture: ComponentFixture<NotifysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotifysComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotifysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
