import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private isLoadingSubject = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.isLoadingSubject.asObservable();

    private loadingMessageSubject = new BehaviorSubject<string>('Loading...');
    public loadingMessage$ = this.loadingMessageSubject.asObservable();

    showLoading(message: string = 'Loading...') {
        this.loadingMessageSubject.next(message);
        this.isLoadingSubject.next(true);
    }

    hideLoading() {
        this.isLoadingSubject.next(false);
        this.loadingMessageSubject.next('Loading...');
    }

    get isLoading(): boolean {
        return this.isLoadingSubject.value;
    }

    get loadingMessage(): string {
        return this.loadingMessageSubject.value;
    }
}

