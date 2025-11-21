import { Component, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    imports: [CommonModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
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
    private apiUrl = `${environment.baseURL}`;
    user_details: any;

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
            setTimeout(() => this.startCamera(), 200);
        }
    }

    ngOnDestroy(): void {
        this.stopCamera();
        if (this.detectionInterval) clearInterval(this.detectionInterval);
    }

    async loadFaceApi() {
        try {
            this.loadingService.showLoading('Initializing face detection...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            this.faceApiLoaded = true;
            this.loadingService.hideLoading();
        } catch (err) {
            this.loadingService.hideLoading();
            console.warn('Face API not available:', err);
        }
    }

    private async waitForVideoElement(maxAttempts: number = 10, delay: number = 100): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            if (this.videoElement?.nativeElement) {
                return;
            }
            this.cdr.detectChanges();
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        throw new Error('Video element not found in DOM after waiting');
    }

    async startCamera() {
        try {
            this.loadingService.showLoading('Starting camera...');
            this.stopCamera();
            this.previewImage = null;
            this.onboardService.setPreviewImage(null);

            this.cdr.detectChanges();
            await this.waitForVideoElement();

            if (!this.videoElement?.nativeElement) {
                throw new Error('Video element not available');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser.');
            }

            let constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1920, min: 640 }
                },
                audio: false
            };

            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (highQualityError) {
                console.warn('High quality camera failed, trying with basic constraints:', highQualityError);
                constraints = {
                    video: { facingMode: 'user' },
                    audio: false
                };
                this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            if (!this.videoStream) {
                throw new Error('Failed to get camera stream');
            }

            this.videoElement.nativeElement.srcObject = this.videoStream;

            await new Promise<void>((resolve, reject) => {
                const video = this.videoElement.nativeElement;
                const onLoadedMetadata = () => {
                    video.removeEventListener('loadedmetadata', onLoadedMetadata);
                    resolve();
                };
                const onError = () => {
                    video.removeEventListener('error', onError);
                    reject(new Error('Video failed to load'));
                };
                video.addEventListener('loadedmetadata', onLoadedMetadata);
                video.addEventListener('error', onError);
                video
                    .play()
                    .then(() => {
                        if (video.readyState >= 2) {
                            video.removeEventListener('loadedmetadata', onLoadedMetadata);
                            video.removeEventListener('error', onError);
                            resolve();
                        }
                    })
                    .catch(reject);
            });

            this.videoReady = true;

            if (this.faceApiLoaded) {
                this.startFaceDetection();
            }
            this.loadingService.hideLoading();
        } catch (err: any) {
            this.loadingService.hideLoading();
            this.videoReady = false;

            let errorMessage = 'We could not access your camera.';
            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
                errorMessage = 'Camera is being used by another application. Please close it and try again.';
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
            this.videoStream.getTracks().forEach((t) => t.stop());
            this.videoStream = null;
        }
        this.videoReady = false;
        this.isFaceAligned = false;
    }

    startFaceDetection() {
        if (this.detectionInterval) return;

        this.detectionInterval = setInterval(async () => {
            const video = this.videoElement.nativeElement;
            if (!video || video.readyState !== 4) return;

            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
                if (detection) {
                    this.isFaceAligned = true;
                } else {
                    this.isFaceAligned = false;
                }
            } catch (err) {
                console.warn('Face detection error:', err);
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

    submit() {
        if (!this.previewImage) {
            this.notificationService.notify('warn', 'No Image', 'Please capture a selfie first');
            return;
        }

       const user_id = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');

        if (!user_id) {
            this.notificationService.notify('error', 'Session expired', 'Please login again');
            return;
        }

        const imageBlob = this.dataURLtoBlob(this.previewImage);
        const imageFile = new File([imageBlob], 'selfie.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('image', imageFile, 'selfie.png');

        const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
        });

        this.loadingService.showLoading('Uploading selfie...');
        this.http.post(`${this.apiUrl}api/aiphoto/upload-selfie`, formData, { headers }).subscribe({
            next: (response: any) => {
                this.onboardService.setSubmissionData(response);
                this.loadingService.hideLoading();
                this.notificationService.notify('success', 'Submission complete', 'Registration completed successfully.');
                this.router.navigate(['/event/selfie-onboarding/summary']);
            },
            error: (err) => {
                this.loadingService.hideLoading();
                this.notificationService.notify('error', 'Submission failed', err.error?.message || 'Please try again.');
                console.error('Submit error:', err);
            }
        });
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
        this.stopCamera();
        this.router.navigate(['/event/selfie-onboarding/signup']);
    }
}
