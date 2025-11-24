import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {}

  logout() {
    localStorage.removeItem('ai_admin_auth');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access');
  }
}
