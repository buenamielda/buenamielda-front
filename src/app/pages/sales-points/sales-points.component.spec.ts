import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesPointsComponent } from './sales-points.component';

describe('SalesPointsComponent', () => {
  let component: SalesPointsComponent;
  let fixture: ComponentFixture<SalesPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesPointsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
