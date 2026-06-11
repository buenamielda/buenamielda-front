import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSalesPointsComponent } from './admin-sales-points.component';

describe('AdminSalesPointsComponent', () => {
  let component: AdminSalesPointsComponent;
  let fixture: ComponentFixture<AdminSalesPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSalesPointsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminSalesPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
