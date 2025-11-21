import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
    selector: 'app-notification-stack',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-stack" *ngIf="(notificationService.notifications$ | async)?.length" role="status" aria-live="polite">
            <div class="toast" *ngFor="let toast of (notificationService.notifications$ | async)" [ngClass]="toast.type">
                <div class="toast-body">
                    <p class="toast-title">{{ toast.title }}</p>
                    <p class="toast-message">{{ toast.message }}</p>
                </div>
                <button type="button" class="toast-close" aria-label="Dismiss notification" (click)="notificationService.dismissNotification(toast.id)">
                    ×
                </button>
            </div>
        </div>
    `,
    styles: [`.toast-stack {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(90vw, 420px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 40;
}

.toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 18px;
  backdrop-filter: blur(12px);
  background: rgba(15, 23, 42, 0.75);
  border-left: 4px solid var(--primary-start);
  color: #f1f5f9;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  animation: fadeInUp 0.35s ease both;

  &.success { border-color: #22c55e; }
  &.error { border-color: #ef4444; }
  &.info { border-color: #3b82f6; }
  &.warn { border-color: #f97316; }
}

.toast-title {
    text-align: center;
  margin: 0 0 0.15rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.toast-message {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(226, 232, 240, 0.8);
}

.toast-close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.65;
  }
}`]
})
export class NotificationStackComponent {
    constructor(public notificationService: NotificationService) {}
}

