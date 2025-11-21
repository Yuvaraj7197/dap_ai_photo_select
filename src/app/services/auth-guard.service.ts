import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class AuthGuardService implements CanActivate {
    menuData: Array<any> = [];
    action: any;

    constructor(private router: Router) {
    }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const publicRoutes = ['login', 'mfa', 'forgot-password'];
    if (publicRoutes.includes(route.routeConfig?.path?.split('/')[0]!)) {
      return true;
    }

    const authData = localStorage.getItem('admin_auth');
    const mfaVerified = localStorage.getItem('mfa_verified');

    if (authData || mfaVerified) return true;

    this.router.navigate(['/login']);
    return false;
  }


}
