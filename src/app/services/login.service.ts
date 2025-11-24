import { Injectable } from '@angular/core';
import { environmentCommon } from '../../environments/environment.common';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  api = environmentCommon.api;

  constructor() { }
 


}
