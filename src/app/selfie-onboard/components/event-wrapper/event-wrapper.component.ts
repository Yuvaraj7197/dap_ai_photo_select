import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { LoadingService } from '../../../services/loading.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';

@Component({
    selector: 'app-event-wrapper',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    template: `
        <app-loading-overlay></app-loading-overlay>
        <app-notification-stack></app-notification-stack>
        <router-outlet></router-outlet>
    `,
    styles: []
})
export class EventWrapperComponent implements OnInit {
    private apiUrl = `${environment.baseURL}`;
    randomId: string | null = null;

    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private onboardService: SelfieOnboardService,
        private loadingService: LoadingService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.randomId = params['r'] || null;

            this.getEventDetails();
        });
    }

    getEventDetails() {
        const randomId = this.randomId;
        if (!randomId) {
            this.notificationService.notify('error', 'Invalid Event', 'Event ID is required');
            return;
        }

        // this.loadingService.showLoading('Loading event details...');
        this.http.get(`${this.apiUrl}api/album/scan/${randomId}/`).subscribe({
            next: (response: any) => {
                this.onboardService.setEventData({
                    eventName: response.event_type_name,
                    location: response.studio_city_name,
                    eventId: response.event_type_id.toString(),
                    studioCityId: response.studio_city_id.toString()
                });

                localStorage.setItem('event_name', response.event_type_name);
                localStorage.setItem('location', response.studio_city_name);
                localStorage.setItem('studio_by_id', response.studio_id.toString());

                this.loadingService.hideLoading();

                // Navigate to appropriate screen based on auth state
                if (this.onboardService.isAuthenticated()) {
                    if (this.onboardService.hasCompleteProfile()) {
                        this.router.navigate(['/event/selfie-onboarding/gallery'], { replaceUrl: true });
                    } else {
                        this.router.navigate(['/event/selfie-onboarding/otp'], { replaceUrl: true });
                    }
                } else {
                    this.router.navigate(['/event/selfie-onboarding/login'], { replaceUrl: true });
                }
            },
            error: (err) => {
                this.loadingService.hideLoading();
                console.error('Failed to load event details:', err);
                this.notificationService.notify('error', 'Event Load Failed', 'Could not fetch event details');
            }
        });
    }
}

