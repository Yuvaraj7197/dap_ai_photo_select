import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';
import { Subscription } from 'rxjs';

declare const google: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    LoginForm!: FormGroup;
    registerForm!: FormGroup;
    showLoginPassword = false;
    showRegisterPassword = false;
    isRegisterMode = false;
    eventData: any = { eventName: '', location: '' };
    google_client_id = '629116286564-hnihure3dlk2umfkc1t18tinhvr7idb7.apps.googleusercontent.com';
    private apiUrl = `${environment.baseURL}`;
    private eventDataSubscription?: Subscription;
    private routeSubscription?: Subscription;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private onboardService: SelfieOnboardService,
        private notificationService: NotificationService,
        private loadingService: LoadingService
    ) {}

    ngOnInit(): void {
        this.initializeForms();
        this.loadEventData();

        // Check route to determine if we should show register mode
        this.updateRegisterMode('register');

        // Subscribe to route changes
        this.routeSubscription = this.route.url.subscribe(() => {
            this.updateRegisterMode('register');
        });

        this.eventDataSubscription = this.onboardService.eventData$.subscribe(data => {
            if (data) {
                this.eventData = { eventName: data.eventName, location: data.location };
            }
        });
    }

    private updateRegisterMode(data:any) {
        const currentRoute = this.route.snapshot.url.join('/');
        this.isRegisterMode = currentRoute.includes(data);
        // Re-initialize Google Sign-In when mode changes
        setTimeout(() => this.initializeGoogleSignIn(), 100);
    }

    ngOnDestroy(): void {
        if (this.eventDataSubscription) {
            this.eventDataSubscription.unsubscribe();
        }
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe();
        }
    }

    ngAfterViewInit() {
        this.initializeGoogleSignIn();
    }

    private initializeForms() {
        this.LoginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            Password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            Password: ['', [Validators.required, Validators.minLength(8)]],
            acceptTerms: [false, [Validators.requiredTrue]]
        });
    }

    private loadEventData() {
        const eventName = localStorage.getItem('event_name') || '';
        const location = localStorage.getItem('location') || '';
        this.eventData = { eventName, location };
    }

    private initializeGoogleSignIn() {
        if (typeof google === 'undefined') {
            setTimeout(() => this.initializeGoogleSignIn(), 100);
            return;
        }

        google.accounts.id.initialize({
            client_id: this.google_client_id,
            callback: this.handleGoogleResponse.bind(this),
            ux_mode: 'popup'
        });

        const signInButton = document.getElementById('google-signin-btn');
        if (signInButton) {
            signInButton.innerHTML = '';
            google.accounts.id.renderButton(signInButton, {
               theme: 'filled_blue',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'pill',
            });
        }

        const signUpButton = document.getElementById('google-signup-btn');
        if (signUpButton) {
            signUpButton.innerHTML = '';
            google.accounts.id.renderButton(signUpButton, {
                theme: 'filled_blue',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'pill',
            });
        }
    }

    handleGoogleResponse(response: any) {
        this.loadingService.showLoading('Signing in with Google...');
        this.http.post(`${this.apiUrl}api/auth/google/token/ai`, { token: response.credential }).subscribe({
            next: (res: any) => {
                localStorage.setItem('ai_admin_auth',res);
                 localStorage.setItem('ai_user_id', res.user_id.toString());
                localStorage.setItem('ai_access', res.access);
                localStorage.setItem('ai_refresh', res.refresh);
                localStorage.setItem('ai_google_phone', res.phone);
                localStorage.setItem('ai_name', res.full_name);
                localStorage.setItem('ai_email', res.email);

                this.loadingService.hideLoading();
                this.notificationService.notify('success', 'Welcome', 'You are now signed in with Google.');

                if (res.face_status.requires_face_upload === true) {
                    this.router.navigate(['/event/selfie-onboarding/selfie']);
                } else {
                    this.router.navigate(['/event/selfie-onboarding/gallery']);
                }
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Google Sign-In Failed', 'Please try again');
                console.error('Google auth error:', err);
            }
        });
    }

    toggleLoginPasswordVisibility() {
        this.showLoginPassword = !this.showLoginPassword;
    }

    toggleRegisterPasswordVisibility() {
        this.showRegisterPassword = !this.showRegisterPassword;
    }

    onLoginSubmit() {
        if (this.LoginForm.invalid) return;

        const formData = {
            password: this.LoginForm.get('Password')?.value,
            email: this.LoginForm.get('email')?.value
        };

        this.loadingService.showLoading('Signing in...');
        this.http.post(`${this.apiUrl}api/ai/login`, formData).subscribe({
            next: (res: any) => {
               localStorage.setItem('ai_admin_auth',res);

                 localStorage.setItem('ai_user_id', res.user_id.toString());
                localStorage.setItem('ai_access', res.access);
                localStorage.setItem('ai_refresh', res.refresh);
                localStorage.setItem('ai_phone', res.phone);
                localStorage.setItem('ai_name', res.full_name);
                localStorage.setItem('ai_email', res.email);

                this.loadingService.hideLoading();

                if (res.face_status.requires_face_upload === true) {
                    this.router.navigate(['/event/selfie-onboarding/selfie']);
                } else {
                    this.router.navigate(['/event/selfie-onboarding/gallery']);
                }
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Unable to sign in', 'Please check your credentials and try again.');
                console.error('Login error:', err);
            }
        });
    }

    onRegisterSubmit() {
        if (this.registerForm.invalid) return;

        const event_id = localStorage.getItem('event_id') || '';
        const city_id = localStorage.getItem('studio_city_id') || '';
        const studio_id = localStorage.getItem('studio_by_id') || '';

        const formData = {
            full_name: this.registerForm.get('name')?.value,
            email: this.registerForm.get('email')?.value,
            phone: this.registerForm.get('phone')?.value,
            password: this.registerForm.get('Password')?.value,
            location: city_id ? parseInt(city_id) : null,
            eventType: event_id ? parseInt(event_id) : null,
            studio:studio_id? parseInt(studio_id):null
        };

        this.loadingService.showLoading('Creating your account...');
        this.http.post(`${this.apiUrl}api/ai/register`, formData).subscribe({
            next: (res: any) => {
                localStorage.setItem('ai_admin_auth',res);

                 localStorage.setItem('ai_user_id', res.user_id.toString());
                localStorage.setItem('ai_access', res.access);
                localStorage.setItem('ai_refresh', res.refresh);
                localStorage.setItem('ai_phone', res.phone);
                localStorage.setItem('ai_name', res.full_name);
                localStorage.setItem('ai_email', res.email);
                this.loadingService.hideLoading();
                this.notificationService.notify('success', 'Account ready', 'Registration successful! OTP sent to your email.');
                this.router.navigate(['/event/selfie-onboarding/otp']);
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Registration failed', err.error?.message || 'Please try again.');
                console.error('Register error:', err);
            }
        });
    }

    showRegisterForm() {
         this.isRegisterMode = false;
         this.updateRegisterMode('register');
    }

    showLoginForm() {
        this.isRegisterMode = true;
        this.updateRegisterMode('signup');

    }


}

