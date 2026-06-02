import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const blogEditorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const puedeEditarBlog =
    authService.hasRole('DIVULGATIVO') || authService.isAdmin();

  if (authService.hasActiveSession() && puedeEditarBlog) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
