import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatListModule,
    MatExpansionModule,
    MatDividerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mobileMenuOpen = signal(false);
  dropdownOpen = signal(false);
  managementDropdownOpen = signal(false);
  scrolled = signal(false);
  cartCount = this.cartService.itemCount;

  readonly isAuthenticated = computed(() => {
    this.authService.currentUser();
    return this.authService.hasActiveSession();
  });

  readonly authenticatedDisplayName = computed(() => {
    this.authService.currentUser();
    return this.authService.getAuthenticatedDisplayName();
  });

  readonly isAdmin = computed(() => {
    this.authService.currentUser();
    return this.authService.hasActiveSession() && this.authService.isAdmin();
  });

  apiculturaLinks = [
    { label: 'Blog educativo', route: '/blog' },
    { label: 'Temporadas', route: '/aprende/temporadas' },
  ];

  ngOnInit(): void {
    if (!this.authService.hasActiveSession()) {
      return;
    }

    this.cartService.loadCart().subscribe({
      error: () => {
        this.cartService.clear();
      },
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.dropdownOpen.set(false);
      this.managementDropdownOpen.set(false);
    }
  }

  toggleDropdown() {
    this.managementDropdownOpen.set(false);
    this.dropdownOpen.update((value) => !value);
  }

  toggleManagementDropdown() {
    this.dropdownOpen.set(false);
    this.managementDropdownOpen.update((value) => !value);
  }

  closeManagementDropdown() {
    this.managementDropdownOpen.set(false);
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clear();
    this.router.navigate(['/productos']);
  }
}
