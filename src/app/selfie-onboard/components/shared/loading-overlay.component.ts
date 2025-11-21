import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/loading.service';

@Component({
    selector: 'app-loading-overlay',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="custom-loader-overlay" *ngIf="loadingService.isLoading$ | async">
            <div class="loader-content">
                <div class="loader-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loader-text">{{ loadingService.loadingMessage$ | async }}</p>
            </div>
        </div>
    `,
    styles: [`
        .custom-loader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.loader-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: var(--primary-start);
  border-right-color: var(--primary-end);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(2) {
    width: 70%;
    height: 70%;
    top: 15%;
    left: 15%;
    border-top-color: var(--primary-end);
    border-right-color: var(--primary-start);
    animation-duration: 1s;
    animation-direction: reverse;
  }

  &:nth-child(3) {
    width: 50%;
    height: 50%;
    top: 25%;
    left: 25%;
    border-top-color: rgba(139, 92, 246, 0.6);
    border-right-color: rgba(236, 72, 153, 0.6);
    animation-duration: 0.8s;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  letter-spacing: 0.5px;
  animation: pulse 2s ease-in-out infinite;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}`]
})
export class LoadingOverlayComponent {
    constructor(public loadingService: LoadingService) {}
}

