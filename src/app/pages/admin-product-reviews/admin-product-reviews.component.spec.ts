import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProductReviewsComponent } from './admin-product-reviews.component';

describe('AdminProductReviewsComponent', () => {
  let component: AdminProductReviewsComponent;
  let fixture: ComponentFixture<AdminProductReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductReviewsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminProductReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
