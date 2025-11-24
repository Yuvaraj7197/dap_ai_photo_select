import { Component, OnInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';

@Component({
    selector: 'app-otp',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    templateUrl: './otp.component.html',
    styleUrl: './otp.component.scss'
})
export class OtpComponent implements OnInit, OnDestroy {
    @ViewChildren('otpBox') otpInputs!: QueryList<ElementRef>;

    otpDigits: string[] = new Array(6).fill('');
    isOtpVerifying = false;
    canResendOtp = false;
    resendCountdown = 30;
    private resendTimer: any;
    userEmail: string = '';
    private apiUrl = `${environment.baseURL}`;

    constructor(
        private http: HttpClient,
        private router: Router,
        private onboardService: SelfieOnboardService,
        private notificationService: NotificationService,
        private loadingService: LoadingService
    ) {}

    ngOnInit(): void {
        this.loadUserEmail();
        this.startResendTimer();
    }

    ngOnDestroy(): void {
        if (this.resendTimer) clearInterval(this.resendTimer);
    }

    private loadUserEmail() {
        const userData = this.onboardService.getUserData();
        this.userEmail = userData?.email || '';
    }

    trackByFn(index: number) {
        return index;
    }

    onOtpInput(event: any, index: number) {
        let value = event.target.value.replace(/\D/g, '').slice(0, 1);
        this.otpDigits[index] = value;
        this.otpDigits = [...this.otpDigits];

        if (value && index < 5) {
            this.focusInput(index + 1);
        }
    }

    onOtpKeyDown(event: KeyboardEvent, index: number) {
        const input = event.target as HTMLInputElement;

        if (event.key === 'Backspace') {
            if (!input.value && index > 0) {
                this.otpDigits[index - 1] = '';
                this.focusInput(index - 1);
            } else {
                this.otpDigits[index] = '';
            }
            this.otpDigits = [...this.otpDigits];
        }
    }

    onOtpPaste(event: ClipboardEvent) {
        event.preventDefault();
        const paste = event.clipboardData?.getData('text') ?? '';
        const clean = paste.replace(/\D/g, '').slice(0, 6).split('');

        clean.forEach((digit, i) => {
            this.otpDigits[i] = digit;
        });

        this.otpDigits = [...this.otpDigits];
        const focusIndex = clean.length >= 6 ? 5 : clean.length;
        this.focusInput(focusIndex);
    }

    focusInput(index: number) {
        const inputs = this.otpInputs.toArray();
        const inp = inputs[index]?.nativeElement;
        if (inp) {
            setTimeout(() => {
                inp.focus();
                inp.select();
            }, 10);
        }
    }

    get otpValue(): string {
        return this.otpDigits.join('');
    }

    verifyOtp() {
        if (this.otpValue.length !== 6) {
            this.notificationService.notify('error', 'Incomplete OTP', 'Please enter all 6 digits');
            return;
        }

        this.isOtpVerifying = true;
        this.loadingService.showLoading('Verifying OTP...');
        const user_id = localStorage.getItem('ai_user_id');

        const payload = {
            user_id,
            otp: this.otpValue
        };

        this.http.post(`${this.apiUrl}api/aiphoto/verify-otp`, payload).subscribe({
            next: (res: any) => {
                this.isOtpVerifying = false;
                 localStorage.setItem('ai_admin_auth',res);

                 localStorage.setItem('ai_user_id', res.user_id.toString());
                localStorage.setItem('ai_access', res.access);
                localStorage.setItem('ai_refresh', res.refresh);
                localStorage.setItem('ai_phone', res.phone);
                localStorage.setItem('ai_name', res.full_name);
                localStorage.setItem('ai_email', res.email);

                this.loadingService.hideLoading();
                this.notificationService.notify('success', 'Verified', 'OTP verified successfully');
                this.router.navigate(['/event/selfie-onboarding/selfie']);
            },
            error: (err) => {
                this.isOtpVerifying = false;
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Verification failed', err.error?.message || 'Incorrect OTP');
            }
        });
    }

    resendOtp() {
        if (!this.canResendOtp) return;

        const user_id = localStorage.getItem('ai_user_id');
        const param = { user_id: user_id };

        this.loadingService.showLoading('Resending OTP...');
        this.http.post(`${this.apiUrl}api/resend/ai-sendotp`, param).subscribe({
            next: () => {
                this.loadingService.hideLoading();
                this.notificationService.notify('success', 'OTP Sent', 'A new OTP has been sent to your email');
                this.startResendTimer();
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Failed to resend', err.error?.message || 'Please try again later');
            }
        });
    }

    private startResendTimer() {
        this.canResendOtp = false;
        this.resendCountdown = 30;

        if (this.resendTimer) clearInterval(this.resendTimer);

        this.resendTimer = setInterval(() => {
            this.resendCountdown--;
            if (this.resendCountdown <= 0) {
                this.canResendOtp = true;
                clearInterval(this.resendTimer);
            }
        }, 1000);
    }

    backToRegister() {
        this.router.navigate(['/event/selfie-onboarding/signup']);
    }
}

