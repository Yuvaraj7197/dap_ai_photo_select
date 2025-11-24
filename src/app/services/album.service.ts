import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environmentCommon } from '../../environments/environment.common';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private api = environmentCommon.api;
  constructor(private http: HttpClient) { }

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
