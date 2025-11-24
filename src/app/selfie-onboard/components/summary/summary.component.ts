import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';

@Component({
    selector: 'app-summary',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    templateUrl: './summary.component.html',
    styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
    eventData: any = { eventName: '', location: '' };
    userData: any = {};
    previewImage: string | null = null;
    username: any;
    email: any;
    location: any;
    eventname: any;

    constructor(
        private router: Router,
        private onboardService: SelfieOnboardService
    ) {}

    ngOnInit(): void {
        this.username = localStorage.getItem('ai_name');
        this.email = localStorage.getItem('ai_email') || '';
        this.eventname = localStorage.getItem('event_name');
        this.location = localStorage.getItem('location');

        this.eventData = this.onboardService.getEventData() || { eventName: '', location: '' };
        this.userData = this.onboardService.getUserData() || {};
        this.previewImage = this.onboardService.getPreviewImage();

        // Auto-navigate to gallery after 3 seconds
        setTimeout(() => {
            this.viewAllSubmissions();
        }, 3000);
    }



    viewAllSubmissions() {
        this.router.navigate(['/event/selfie-onboarding/gallery']);
    }

    retakeSelfie() {
        this.router.navigate(['/event/selfie-onboarding/selfie']);
    }
}

