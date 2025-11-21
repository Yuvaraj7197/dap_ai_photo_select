import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { NotificationService } from '../../../services/notification.service';
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
    submissionData: any = null;

    constructor(
        private router: Router,
        private onboardService: SelfieOnboardService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {


        this.eventData = this.onboardService.getEventData() || { eventName: '', location: '' };
        this.userData = this.onboardService.getUserData() || {};
        this.previewImage = this.onboardService.getPreviewImage();
        this.submissionData = this.onboardService.getSubmissionData();

        // Auto-navigate to gallery after 5 seconds
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

