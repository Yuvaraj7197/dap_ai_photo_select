
// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environmentCommon } from '../../environments/environment.common';
import { Observable, tap } from 'rxjs';
import { RemoteService } from './remote.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environmentCommon.api;

  constructor(private http: HttpClient,private remote:RemoteService) {}

  logout() {
    localStorage.removeItem('ai_admin_auth');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access');
  }
}
