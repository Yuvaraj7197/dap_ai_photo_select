import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GoogleUser {
    name: string;
    email: string;
    picture?: string;
}

export interface EventData {
    eventName: string;
    location: string;
    eventId?: string;
    studioCityId?: string;
}

export interface UserData {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    phone?: string;
    name?: string;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SelfieOnboardService {
    private eventDataSubject = new BehaviorSubject<EventData | null>(null);
    public eventData$ = this.eventDataSubject.asObservable();

    private userDataSubject = new BehaviorSubject<UserData | null>(null);
    public userData$ = this.userDataSubject.asObservable();

    private previewImageSubject = new BehaviorSubject<string | null>(null);
    public previewImage$ = this.previewImageSubject.asObservable();

    private submissionDataSubject = new BehaviorSubject<any>(null);
    public submissionData$ = this.submissionDataSubject.asObservable();

    constructor() {
        this.loadFromLocalStorage();
    }

    // Event Data Management
    setEventData(data: EventData) {
        this.eventDataSubject.next(data);
        if (data.eventId) {
            localStorage.setItem('event_id', data.eventId);
        }
        if (data.studioCityId) {
            localStorage.setItem('studio_city_id', data.studioCityId);
        }
    }

    getEventData(): EventData | null {
        return this.eventDataSubject.value;
    }

    // User Data Management
    setUserData(data: UserData) {
        this.userDataSubject.next(data);
        if (data.userId) {
            localStorage.setItem('ai_user_id', data.userId);
        }
        if (data.accessToken) {
            localStorage.setItem('ai_access', data.accessToken);
        }
        if (data.refreshToken) {
            localStorage.setItem('ai_refresh', data.refreshToken);
        }
        if (data.phone) {
            localStorage.setItem('ai_phone', data.phone);
        }
        if (data.name) {
            localStorage.setItem('ai_name', data.name);
        }
        if (data.email) {
            localStorage.setItem('ai_email', data.email);
        }
    }

    getUserData(): UserData | null {
        return this.userDataSubject.value;
    }

    // Preview Image Management
    setPreviewImage(image: string | null) {
        this.previewImageSubject.next(image);
    }

    getPreviewImage(): string | null {
        return this.previewImageSubject.value;
    }

    // Submission Data Management
    setSubmissionData(data: any) {
        this.submissionDataSubject.next(data);
    }

    getSubmissionData(): any {
        return this.submissionDataSubject.value;
    }

    // Local Storage Management
    private loadFromLocalStorage() {
        const userId = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');
        const refreshToken = localStorage.getItem('ai_refresh');
        const phone = localStorage.getItem('ai_phone');
        const name = localStorage.getItem('ai_name');
        const email = localStorage.getItem('ai_email');

        if (userId || accessToken) {
            this.userDataSubject.next({
                userId: userId || undefined,
                accessToken: accessToken || undefined,
                refreshToken: refreshToken || undefined,
                phone: phone || undefined,
                name: name || undefined,
                email: email || undefined
            });
        }

        const eventId = localStorage.getItem('event_id');
        const studioCityId = localStorage.getItem('studio_city_id');
        if (eventId || studioCityId) {
            // Event data will be loaded from API
        }
    }

    clearUserData() {
        this.userDataSubject.next(null);
        this.previewImageSubject.next(null);
        this.submissionDataSubject.next(null);
        localStorage.removeItem('ai_user_id');
        localStorage.removeItem('ai_access');
        localStorage.removeItem('ai_refresh');
        localStorage.removeItem('ai_phone');
        localStorage.removeItem('ai_name');
        localStorage.removeItem('ai_email');
        localStorage.removeItem('ai_google_phone')
    }

    clearAll() {
        this.clearUserData();
        this.eventDataSubject.next(null);
        localStorage.removeItem('event_id');
        localStorage.removeItem('studio_city_id');
        localStorage.removeItem('studio_by_id');
    }

    isAuthenticated(): boolean {
        const userData = this.getUserData();
        return !!(userData?.userId && userData?.accessToken);
    }

    hasCompleteProfile(): boolean {
        const userData = this.getUserData();
        return !!(userData?.phone && userData?.name && userData?.email);
    }
}

