import { Component, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';

declare const faceapi: any;

@Component({
    selector: 'app-selfie',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    templateUrl: './selfie.component.html',
    styleUrl: './selfie.component.scss'
})
export class SelfieComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    videoStream: MediaStream | null = null;
    videoReady = false;
    previewImage: string | null = null;
    faceApiLoaded = false;
    detectionInterval: any;
    isFaceAligned = false;
    isSubmitting = false;
    showMobileInput = false; // Set to true if you want to show mobile input
    mobileNumber = '';
    private apiUrl = `${environment.baseURL}`;
    user_details: any;

    // Phone number modal properties
    showPhoneModal = false;
    phoneModalNumber = '';
    phoneModalPassword = '';
    isUpdatingPhone = false;
    showPhonePassword = false;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private onboardService: SelfieOnboardService,
        private notificationService: NotificationService,
        private loadingService: LoadingService
    ) {}

    ngOnInit(): void {
        this.user_details = this.onboardService.getUserData();

        this.loadFaceApi();
        this.previewImage = this.onboardService.getPreviewImage();
    }

    ngAfterViewInit() {
        if (!this.previewImage) {
            // Wait a bit longer to ensure DOM is fully rendered
            setTimeout(() => {
                this.startCamera();
            }, 300);
        }
    }

    ngOnDestroy(): void {
        this.stopCamera();
        if (this.detectionInterval) clearInterval(this.detectionInterval);
    }

    async loadFaceApi() {
        try {
            // Check if faceapi is available
            if (typeof faceapi === 'undefined' || !faceapi.nets) {
                console.warn('Face API library not loaded');
                return;
            }

            this.loadingService.showLoading('Initializing face detection...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            this.faceApiLoaded = true;
            this.loadingService.hideLoading();

            // If camera is already ready, start face detection
            if (this.videoReady && this.videoElement?.nativeElement) {
                this.startFaceDetection();
            }
        } catch (err) {
            this.loadingService.hideLoading();
            console.warn('Face API not available:', err);
            // Don't block camera functionality if face API fails
            this.faceApiLoaded = false;
        }
    }

    private async waitForVideoElement(maxAttempts: number = 20, delay: number = 150): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            if (this.videoElement?.nativeElement) {
                const video = this.videoElement.nativeElement;
                // Ensure element is in DOM and not hidden
                if (video.offsetParent !== null || video.getBoundingClientRect().width > 0) {
                    return;
                }
            }
            this.cdr.detectChanges();
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        throw new Error('Video element not found or not visible in DOM after waiting');
    }

    async startCamera() {
        try {
            this.loadingService.showLoading('Starting camera...');
            this.stopCamera();
            this.previewImage = null;
            this.onboardService.setPreviewImage(null);
            this.videoReady = false;

            // Force change detection to ensure previewImage is cleared
            this.cdr.detectChanges();

            // Wait a bit for the DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));

            await this.waitForVideoElement();

            if (!this.videoElement?.nativeElement) {
                throw new Error('Video element not available');
            }

            const video = this.videoElement.nativeElement;

            // Ensure video element is visible
            if (video.hasAttribute('hidden')) {
                video.removeAttribute('hidden');
            }
            video.style.display = 'block';
            this.cdr.detectChanges();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser.');
            }

            let constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 1280, min: 640 }
                },
                audio: false
            };

            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (highQualityError) {
                console.warn('High quality camera failed, trying with basic constraints:', highQualityError);
                try {
                    constraints = {
                        video: {
                            facingMode: 'user',
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        },
                        audio: false
                    };
                    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (mediumError) {
                    console.warn('Medium quality camera failed, trying with minimal constraints:', mediumError);
                    constraints = {
                        video: { facingMode: 'user' },
                        audio: false
                    };
                    this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
                }
            }

            if (!this.videoStream) {
                throw new Error('Failed to get camera stream');
            }

            // Set the stream to video element
            video.srcObject = this.videoStream;

            // Wait for video to be ready
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Video loading timeout'));
                }, 10000); // 10 second timeout

                const onLoadedMetadata = () => {
                    clearTimeout(timeout);
                    video.removeEventListener('loadedmetadata', onLoadedMetadata);
                    video.removeEventListener('error', onError);
                    resolve();
                };

                const onError = (error: any) => {
                    clearTimeout(timeout);
                    video.removeEventListener('loadedmetadata', onLoadedMetadata);
                    video.removeEventListener('error', onError);
                    reject(new Error('Video failed to load: ' + (error?.message || 'Unknown error')));
                };

                video.addEventListener('loadedmetadata', onLoadedMetadata);
                video.addEventListener('error', onError);

                // Try to play the video
                video.play()
                    .then(() => {
                        if (video.readyState >= 2) {
                            clearTimeout(timeout);
                            video.removeEventListener('loadedmetadata', onLoadedMetadata);
                            video.removeEventListener('error', onError);
                            resolve();
                        }
                    })
                    .catch((playError) => {
                        // If play fails but metadata is loaded, still resolve
                        if (video.readyState >= 2) {
                            clearTimeout(timeout);
                            video.removeEventListener('loadedmetadata', onLoadedMetadata);
                            video.removeEventListener('error', onError);
                            resolve();
                        } else {
                            reject(playError);
                        }
                    });
            });

            this.videoReady = true;
            this.cdr.detectChanges();

            // Start face detection if available
            if (this.faceApiLoaded) {
                this.startFaceDetection();
            }

            this.loadingService.hideLoading();
        } catch (err: any) {
            this.loadingService.hideLoading();
            this.videoReady = false;
            this.stopCamera();

            let errorMessage = 'We could not access your camera.';
            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
                errorMessage = 'Camera is being used by another application. Please close it and try again.';
            } else if (err?.name === 'OverconstrainedError') {
                errorMessage = 'Camera constraints not supported. Trying with basic settings...';
                // Retry with basic constraints
                setTimeout(() => this.startCamera(), 1000);
                return;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            this.notificationService.notify('error', 'Camera Error', errorMessage);
            console.error('Camera error details:', err);
        }
    }

    stopCamera() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        if (this.videoStream) {
            this.videoStream.getTracks().forEach((t) => {
                t.stop();
                t.enabled = false;
            });
            this.videoStream = null;
        }

        if (this.videoElement?.nativeElement) {
            const video = this.videoElement.nativeElement;
            video.srcObject = null;
            video.pause();
        }

        this.videoReady = false;
        this.isFaceAligned = false;
    }

    startFaceDetection() {
        if (this.detectionInterval) return;

        // Check if face API is available
        if (typeof faceapi === 'undefined' || !faceapi.detectSingleFace) {
            console.warn('Face API not available for detection');
            return;
        }

        this.detectionInterval = setInterval(async () => {
            const video = this.videoElement?.nativeElement;
            if (!video || video.readyState !== 4 || !this.videoReady) {
                return;
            }

            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
                const wasAligned = this.isFaceAligned;
                this.isFaceAligned = !!detection;

                // Only trigger change detection if alignment state changed
                if (wasAligned !== this.isFaceAligned) {
                    this.cdr.detectChanges();
                }
            } catch (err: any) {
                console.warn('Face detection error:', err);
                // If face detection fails repeatedly, stop trying
                if (err && typeof err === 'object' && 'message' in err &&
                    typeof err.message === 'string' && err.message.includes('not loaded')) {
                    clearInterval(this.detectionInterval);
                    this.detectionInterval = null;
                }
            }
        }, 350);
    }

    capture() {
        const video = this.videoElement.nativeElement;
        const canvas = this.canvasElement.nativeElement;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const videoWidth = video.videoWidth || 1280;
        const videoHeight = video.videoHeight || 1280;

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.previewImage = canvas.toDataURL('image/png', 1.0);
        this.onboardService.setPreviewImage(this.previewImage);

        this.stopCamera();
        this.notificationService.notify('success', 'Captured', 'Selfie captured successfully.');
        this.cdr.detectChanges();
    }

    retake() {
        this.previewImage = null;
        this.onboardService.setPreviewImage(null);
        this.startCamera();
    }

    async submit() {
        const googlephnumber = localStorage.getItem('ai_google_phone');

        // Validate null, "null", empty, undefined, or whitespace
        // if (!googlephnumber || googlephnumber === 'null' || googlephnumber.trim() === '') {
        //     this.showPhoneModal = true;
        //     this.cdr.detectChanges();
        //     return;
        // }

        if (!this.previewImage) {
            this.notificationService.notify('warn', 'No Image', 'Please capture a selfie first');
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        const user_id = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');

        if (!user_id) {
            this.notificationService.notify('error', 'Session expired', 'Please login again');
            return;
        }

        this.isSubmitting = true;
        const imageBlob = this.dataURLtoBlob(this.previewImage);
        const imageFile = new File([imageBlob], 'selfie.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('image', imageFile, 'selfie.png');

        // Add mobile number if provided
        if (this.mobileNumber && this.mobileNumber.trim()) {
            formData.append('mobile_number', this.mobileNumber.trim());
        }

        let headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
        });
        headers = headers.set('X-Ai-Origin', 'https://aiphoto.albumflux.com');

        this.loadingService.showLoading('Uploading selfie...');
        this.http.post(`${this.apiUrl}api/aiphoto/upload-selfie`, formData, { headers }).subscribe({
            next: (response: any) => {
                this.onboardService.setSubmissionData(response);
                this.loadingService.hideLoading();
                this.isSubmitting = false;
                this.notificationService.notify('success', 'Submission complete', 'Registration completed successfully.');
                this.router.navigate(['/event/selfie-onboarding/summary']);
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.isSubmitting = false;
                this.notificationService.notify('error', 'Submission failed', err.error?.message || 'Please try again.');
                console.error('Submit error:', err);
            }
        });
    }

    async updatePhoneNumber() {
        if (!this.phoneModalNumber || !this.phoneModalNumber.trim()) {
            this.notificationService.notify('warn', 'Invalid Input', 'Please enter a valid phone number');
            return;
        }

        if (!this.phoneModalPassword || !this.phoneModalPassword.trim()) {
            this.notificationService.notify('warn', 'Invalid Input', 'Please enter your password');
            return;
        }

        const user_id = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');

        if (!user_id || !accessToken) {
            this.notificationService.notify('error', 'Session expired', 'Please login again');
            this.showPhoneModal = false;
            return;
        }

        this.isUpdatingPhone = true;
        this.loadingService.showLoading('Updating phone number...');

        const updateData = {
            phone: this.phoneModalNumber.trim(),
            password: this.phoneModalPassword.trim()
        };

        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        });
        headers = headers.set('X-Ai-Origin', 'https://aiphoto.albumflux.com');

        try {
            const response: any = await firstValueFrom(this.http.put(`${this.apiUrl}api/aiuser/update/${user_id}/`, updateData, { headers }));

            // Update localStorage with new phone number
            localStorage.setItem('ai_google_phone', this.phoneModalNumber.trim());
            localStorage.setItem('ai_phone', this.phoneModalNumber.trim());

            this.loadingService.hideLoading();
            this.isUpdatingPhone = false;
            this.showPhoneModal = false;
            this.phoneModalNumber = '';
            this.phoneModalPassword = '';

            this.notificationService.notify('success', 'Phone Updated', 'Phone number updated successfully');

            // Proceed with the upload after phone number is updated
            await this.continueSubmit();
        } catch (err: any) {
            this.loadingService.hideLoading();
            this.isUpdatingPhone = false;
            this.notificationService.notify('error', 'Update Failed', err.error?.message || 'Failed to update phone number. Please try again.');
            console.error('Update phone error:', err);
        }
    }

    private async continueSubmit() {
        if (!this.previewImage) {
            this.notificationService.notify('warn', 'No Image', 'Please capture a selfie first');
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        const user_id = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');

        if (!user_id) {
            this.notificationService.notify('error', 'Session expired', 'Please login again');
            return;
        }

        this.isSubmitting = true;
        const imageBlob = this.dataURLtoBlob(this.previewImage);
        const imageFile = new File([imageBlob], 'selfie.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('image', imageFile, 'selfie.png');

        // Add mobile number if provided
        if (this.mobileNumber && this.mobileNumber.trim()) {
            formData.append('mobile_number', this.mobileNumber.trim());
        }

        let headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
        });
        headers = headers.set('X-Ai-Origin', 'https://aiphoto.albumflux.com');

        this.loadingService.showLoading('Uploading selfie...');
        this.http.post(`${this.apiUrl}api/aiphoto/upload-selfie`, formData, { headers }).subscribe({
            next: (response: any) => {
                this.onboardService.setSubmissionData(response);
                this.loadingService.hideLoading();
                this.isSubmitting = false;
                this.notificationService.notify('success', 'Submission complete', 'Registration completed successfully.');
                this.router.navigate(['/event/selfie-onboarding/summary']);
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.isSubmitting = false;
                this.notificationService.notify('error', 'Submission failed', err.error?.message || 'Please try again.');
                console.error('Submit error:', err);
            }
        });
    }

    closePhoneModal() {
        this.showPhoneModal = false;
        this.phoneModalNumber = '';
        this.phoneModalPassword = '';
    }

    showHelp() {
        this.notificationService.notify('info', 'Selfie Tips',
            '• Ensure good lighting\n' +
            '• Center your face in the frame\n' +
            '• Remove glasses if possible\n' +
            '• Look directly at the camera'
        );
    }

    private dataURLtoBlob(dataURL: string): Blob {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }

    backToLogin() {
        this.onboardService.clearUserData();
        this.stopCamera();
        this.router.navigate(['/event/selfie-onboarding/signup']);
    }
}
