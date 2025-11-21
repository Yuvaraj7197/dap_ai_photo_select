import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RemoteService } from './remote.service';
import { environmentCommon } from '../../environments/environment.common';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private apiUrl = environment.baseURL;
  private api = environmentCommon.api;
  constructor(private http: HttpClient, private remote:RemoteService) { }



getAIImageBlob(filename: string) {
  const url = `${this.api.image.GET_IMAGE_BY_NAMES}/${filename}`;
  const token = localStorage.getItem('ai_access') || localStorage.getItem('ai_admin_auth');

  let headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  headers = headers.set('X-Ai-Origin', 'https://aiphoto.albumflux.com');


  return this.http.get(url, {
    headers: headers,
    responseType: 'blob'
  });
}














}
