import { Injectable } from '@angular/core';
import { RemoteService } from './remote.service';
import { environmentCommon } from '../../environments/environment.common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  api = environmentCommon.api;


  constructor(private remote:RemoteService, private http: HttpClient) { }
 


}
