import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
    id: number;
    type: 'success' | 'error' | 'info' | 'warn';
    title: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    private notificationIdCounter = 0;
    private notificationTimers = new Map<number, any>();

    notify(type: Notification['type'], title: string, message: string, duration = 4500) {
        const id = ++this.notificationIdCounter;
        const current = this.notificationsSubject.value;
        const newNotification: Notification = { id, type, title, message };
        this.notificationsSubject.next([...current, newNotification]);

        const timer = setTimeout(() => this.dismissNotification(id), duration);
        this.notificationTimers.set(id, timer);
    }

    dismissNotification(id: number) {
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next(current.filter((toast) => toast.id !== id));
        const timer = this.notificationTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.notificationTimers.delete(id);
        }
    }

    clearAll() {
        this.notificationTimers.forEach((timer) => clearTimeout(timer));
        this.notificationTimers.clear();
        this.notificationsSubject.next([]);
    }
}

