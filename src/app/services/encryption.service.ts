import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
 private secretKey = 'YourSecretKey1234!'; // Keep this secure

  encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey).toString();
  }

  decrypt(textToDecrypt: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(textToDecrypt, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      
      return '';
    }
  }
}
