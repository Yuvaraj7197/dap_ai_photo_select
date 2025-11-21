import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RemoteService } from './remote.service';
import { environmentCommon } from '../../environments/environment.common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private apiUrl = environment.baseURL;
  private api = environmentCommon.api;
  constructor(private http: HttpClient, private remote:RemoteService) { }



getAIImageBlob(filename: string) {
  const url = `${this.api.image.GET_IMAGE_BY_NAMES}/${filename}`;
  const token = localStorage.getItem('ai_access') || localStorage.getItem('admin_auth');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.get(url, {
    headers: headers,
    responseType: 'blob'
  });
}














}
