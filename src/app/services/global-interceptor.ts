import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take, finalize, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { RemoteService } from './remote.service';
import { CommonService } from './common.service';

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private remoteService: RemoteService,
    private messageService: MessageService,
    private common: CommonService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const modifiedReq = this.addAuthToken(req);

    return next.handle(modifiedReq).pipe(
      tap((event: HttpEvent<any>) => {
        // Handle successful responses
        if (event instanceof HttpResponse) {
          this.common.setLoader(false);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.common.setLoader(false);

        // Check for status 401 errors
        if (error.status === 401) {
          // If the error response has code 'token_not_valid' and a detail message 'Token is invalid or expired'
          if (error.error?.code === 'token_not_valid' && error.error?.detail === 'Token is invalid or expired') {
            this.showToast('Session expired. Please log in again.');
            this.remoteService.logoutUser();
            return throwError(() => new Error('Session expired. Please log in again.'));
          } else {
            // Otherwise, try to refresh the token.
            return this.handle401Error(req, next);
          }
        }

        return throwError(() => error);
      }),
      finalize(() => {
        // This ensures loader is always set to false regardless of success or error
        this.common.setLoader(false);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.remoteService.refreshToken().pipe(
        switchMap((newAccessToken: string | null) => {
          this.isRefreshing = false;

          if (!newAccessToken) {
            this.showToast('Session expired. Please log in again.');
            this.remoteService.logoutUser();
            return throwError(() => new Error('Session expired. Please log in again.'));
          }

          this.refreshTokenSubject.next(newAccessToken);
          return next.handle(this.addAuthToken(req, newAccessToken)).pipe(
            tap((event: HttpEvent<any>) => {
              // Handle successful responses after token refresh
              if (event instanceof HttpResponse) {
                this.common.setLoader(false);
              }
            }),
            catchError((retryError: HttpErrorResponse) => {
              this.common.setLoader(false);
              return throwError(() => retryError);
            }),
            finalize(() => {
              this.common.setLoader(false);
            })
          );
        }),
        catchError(refreshError => {
          this.showToast('Session expired. Please log in again.');
          this.isRefreshing = false;
          this.common.setLoader(false);
          this.remoteService.logoutUser();
          return throwError(() => refreshError);
        }),
        finalize(() => {
          this.common.setLoader(false);
        })
      );
    } else {
      // If a refresh is already in progress, wait for it to finish.
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token =>
          next.handle(this.addAuthToken(req, token)).pipe(
            tap((event: HttpEvent<any>) => {
              // Handle successful responses for queued requests
              if (event instanceof HttpResponse) {
                this.common.setLoader(false);
              }
            }),
            catchError((queuedError: HttpErrorResponse) => {
              this.common.setLoader(false);
              return throwError(() => queuedError);
            }),
            finalize(() => {
              this.common.setLoader(false);
            })
          )
        )
      );
    }
  }

  private addAuthToken(request: HttpRequest<any>, token?: string | null): HttpRequest<any> {
    const authData = localStorage.getItem('admin_auth');
    const accessToken = token || (authData ? JSON.parse(authData)?.access : null);

    if (!accessToken) {
      return request;
    }

    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  private showToast(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
}
