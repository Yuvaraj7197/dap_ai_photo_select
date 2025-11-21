import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AlbumService } from '../../../services/album.service';
import { SelfieOnboardService } from '../../../services/selfie-onboard.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { NotificationStackComponent } from '../shared/notification-stack.component';

@Component({
    selector: 'app-gallery',
    standalone: true,
    imports: [CommonModule, RouterModule, LoadingOverlayComponent, NotificationStackComponent],
    templateUrl: './gallery.component.html',
    styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit, OnDestroy {
    galleryImages: any[] = [];
    currentImageIndex: number = 0;
    isFullScreenView: boolean = false;
    selectedImages: Set<number> = new Set();
    isSelectionMode: boolean = false;
    showImageInfo: boolean = false;
    viewMode: 'grid' | 'timeline' | 'grouped' = 'grid';
    showSmartViewMenu: boolean = false;
    groupedImages: { date: string; images: any[] }[] = [];
    showSmartSelectMenu: boolean = false;
    touchStartX: number = 0;
    touchEndX: number = 0;
    isZoomed: boolean = false;
    imageScale: number = 1;
    slideDirection: 'left' | 'right' | 'none' = 'none';
    showActionToast: boolean = false;
    toastMessage: string = '';
    lastTap: number = 0;
    private apiUrl = `${environment.baseURL}`;
    user_details:any;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private albumService: AlbumService,
        private onboardService: SelfieOnboardService,
        private notificationService: NotificationService,
        public loadingService: LoadingService
    ) {}

    ngOnInit(): void {

         this.getUserPhotos();

    }

    ngOnDestroy(): void {
        // Cleanup object URLs to prevent memory leaks
        this.galleryImages.forEach(img => {
            if (img.url && img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url);
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.isFullScreenView) return;

        switch(event.key) {
            case 'ArrowLeft':
                this.previousGalleryImage();
                break;
            case 'ArrowRight':
                this.nextGalleryImage();
                break;
            case 'Escape':
                this.closeFullScreenView();
                break;
        }
    }

    onTouchStart(event: TouchEvent) {
        this.touchStartX = event.changedTouches[0].screenX;
    }

    onTouchEnd(event: TouchEvent) {
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && this.hasNextImage) {
                this.nextGalleryImage();
                this.slideDirection = 'left';
            } else if (diff < 0 && this.hasPreviousImage) {
                this.previousGalleryImage();
                this.slideDirection = 'right';
            }

            setTimeout(() => {
                this.slideDirection = 'none';
            }, 300);
        }
    }

    onDoubleTap() {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;

        if (tapLength < 300 && tapLength > 0) {
            this.toggleZoom();
        }
        this.lastTap = currentTime;
    }

    toggleZoom() {
        this.isZoomed = !this.isZoomed;
        this.imageScale = this.isZoomed ? 2 : 1;
    }

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        if (!this.isSelectionMode) {
            this.selectedImages.clear();
            this.showSmartSelectMenu = false;
        }
    }

    toggleImageSelection(index: number) {
        if (this.selectedImages.has(index)) {
            this.selectedImages.delete(index);
        } else {
            this.selectedImages.add(index);
        }
    }

    isImageSelected(index: number): boolean {
        return this.selectedImages.has(index);
    }

    selectAll() {
        if (this.selectedImages.size === this.galleryImages.length) {
            this.selectedImages.clear();
        } else {
            this.galleryImages.forEach((_, index) => this.selectedImages.add(index));
        }
    }

    async shareSelectedImages() {
        if (this.selectedImages.size === 0) {
            this.showToast('No images selected');
            return;
        }

        if (!navigator.share) {
            this.showToast('Sharing is not supported on this device');
            return;
        }

        try {
            this.loadingService.showLoading(`Preparing ${this.selectedImages.size} image(s) for sharing...`);

            const selectedIndices = Array.from(this.selectedImages).sort((a, b) => a - b);
            const files: File[] = [];

            for (let i = 0; i < selectedIndices.length; i++) {
                const index = selectedIndices[i];
                const image = this.galleryImages[index];
                const imageUrl = image?.url || image?.image_url || image;

                if (imageUrl) {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const fileType = blob.type || 'image/jpeg';
                    const fileName = `selfie_${index + 1}.${fileType.split('/')[1] || 'jpg'}`;
                    const file = new File([blob], fileName, { type: fileType });
                    files.push(file);
                }

                if (i < selectedIndices.length - 1) {
                    this.loadingService.showLoading(`Preparing images... (${i + 1}/${selectedIndices.length})`);
                    this.cdr.detectChanges();
                }
            }

            if (files.length === 0) {
                this.showToast('No valid images to share');
                this.loadingService.hideLoading();
                return;
            }

            if (navigator.canShare && navigator.canShare({ files: files })) {
                await navigator.share({
                    files: files,
                    title: `${files.length} Selfie${files.length > 1 ? 's' : ''}`,
                    text: `Check out these ${files.length} selfie${files.length > 1 ? 's' : ''}!`
                });
                this.showToast(`${files.length} image(s) shared successfully`);
            } else if (navigator.canShare && navigator.canShare({ files: [files[0]] })) {
                await navigator.share({
                    files: [files[0]],
                    title: `Selfie ${selectedIndices[0] + 1}`,
                    text: `Check out this selfie! (${files.length} selected)`
                });
                this.showToast('First image shared (multiple file sharing not supported)');
            } else {
                this.showToast('Sharing is not available');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing images:', error);
                this.showToast('Failed to share images');
            }
        } finally {
            this.loadingService.hideLoading();
        }
    }

    async shareImage() {
        const image = this.currentGalleryImage;
        if (!image) {
            this.showToast('No image to share');
            return;
        }

        const imageUrl = image?.url || image?.image_url || image;
        if (!imageUrl) {
            this.showToast('Image URL not found');
            return;
        }

        if (!navigator.share) {
            this.showToast('Sharing is not supported on this device');
            return;
        }

        try {
            this.loadingService.showLoading('Preparing image for sharing...');

            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const fileType = blob.type || 'image/jpeg';
            const fileName = `selfie_${this.currentImageIndex + 1}.${fileType.split('/')[1] || 'jpg'}`;
            const file = new File([blob], fileName, { type: fileType });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Selfie ${this.currentImageIndex + 1}`,
                    text: `Check out this selfie!`
                });
                this.showToast('Image shared successfully');
            } else if (navigator.canShare({ url: imageUrl })) {
                await navigator.share({
                    title: `Selfie ${this.currentImageIndex + 1}`,
                    text: `Check out this selfie!`,
                    url: imageUrl
                });
                this.showToast('Image shared successfully');
            } else {
                this.showToast('Sharing is not available');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing image:', error);
                this.showToast('Failed to share image');
            }
        } finally {
            this.loadingService.hideLoading();
        }
    }

    downloadImage() {
        const image = this.currentGalleryImage;
        const link = document.createElement('a');
        link.href = image?.url || image?.image_url || image;
        link.download = `image_${this.currentImageIndex + 1}.jpg`;
        link.click();
        this.showToast('Image downloaded');
    }

    showToast(message: string) {
        this.toastMessage = message;
        this.showActionToast = true;
        setTimeout(() => {
            this.showActionToast = false;
        }, 2000);
    }

    toggleImageInfo() {
        this.showImageInfo = !this.showImageInfo;
    }

    getUserPhotos() {
        const user_id = localStorage.getItem('ai_user_id');
        const accessToken = localStorage.getItem('ai_access');
         const headers = new HttpHeaders({
            Authorization: `Bearer ${accessToken}`
        });

        if (!user_id) {
            this.notificationService.notify('error', 'Authentication Error', 'User ID not found. Please login again.');
            this.loadingService.hideLoading();
            return;
        }

        this.loadingService.showLoading('Loading your photos...');

        this.http.get(`${this.apiUrl}api/aiphoto/user/image/match/${user_id}`,{headers}).subscribe({
            next: (res: any) => {
                if (res.matches && res.matches.length > 0) {
                    this.loadingService.showLoading('Processing images...');
                    this.getbolbImage(res.matches);
                } else {
                    this.loadingService.hideLoading();
                    this.galleryImages = [];
                    this.groupedImages = [];
                    this.notificationService.notify('info', 'No Photos', 'No photos found. The system is still processing your images, please try again shortly.');
                }
            },
            error: (err: any) => {
                this.loadingService.hideLoading();
                this.galleryImages = [];
                this.groupedImages = [];
            }
        });
    }

    refreshGallery() {
        this.galleryImages = [];
        this.groupedImages = [];
        this.selectedImages.clear();
        this.getUserPhotos();
    }

    getbolbImage(images: any[]) {
        let processedCount = 0;
        let errorCount = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
            this.loadingService.hideLoading();
            return;
        }

        images.forEach((img: any, index: number) => {
            const filename = this.extractFileName(img.file_url);

            this.albumService.getAIImageBlob(filename).subscribe({
                next: (blob) => {
                    const objectUrl = URL.createObjectURL(blob);
                    this.galleryImages.push({
                        url: objectUrl,
                        date: new Date(img.created_at || Date.now())
                    });
                    processedCount++;

                    if (processedCount < totalImages) {
                        this.loadingService.showLoading(`Loading images... (${processedCount}/${totalImages})`);
                        this.cdr.detectChanges();
                    } else {
                        this.loadingService.hideLoading();
                        this.groupImagesByDate();

                        if (errorCount > 0) {
                            this.notificationService.notify('warn', 'Partial Load', `${errorCount} image(s) failed to load. ${processedCount} image(s) loaded successfully.`);
                        }
                    }
                },
                error: (err: any) => {
                    errorCount++;
                    processedCount++;

                    console.error(`Error loading image ${index + 1}:`, err);

                    if (processedCount >= totalImages) {
                        this.loadingService.hideLoading();
                        this.groupImagesByDate();

                        if (errorCount === totalImages) {
                            this.notificationService.notify('error', 'Failed to Load Images', 'Unable to load any images. Please try refreshing the gallery.');
                        } else if (errorCount > 0) {
                            this.notificationService.notify('warn', 'Partial Load', `${errorCount} image(s) failed to load. ${processedCount - errorCount} image(s) loaded successfully.`);
                        }
                    } else {
                        this.loadingService.showLoading(`Loading images... (${processedCount}/${totalImages})`);
                        this.cdr.detectChanges();
                    }
                }
            });
        });
    }

    extractFileName(path: string): string {
        const parts = path.split('/');
        return parts.slice(parts.length - 2).join('/');
    }

    openFullScreenView(index: number) {
        if (this.isSelectionMode) {
            this.toggleImageSelection(index);
        } else {
            this.currentImageIndex = index;
            this.isFullScreenView = true;
        }
    }

    closeFullScreenView() {
        this.isFullScreenView = false;
        this.isZoomed = false;
        this.imageScale = 1;
    }

    nextGalleryImage() {
        if (this.hasNextImage) {
            this.currentImageIndex++;
            this.slideDirection = 'left';
            setTimeout(() => this.slideDirection = 'none', 300);
        }
    }

    previousGalleryImage() {
        if (this.hasPreviousImage) {
            this.currentImageIndex--;
            this.slideDirection = 'right';
            setTimeout(() => this.slideDirection = 'none', 300);
        }
    }

    get currentGalleryImage() {
        return this.galleryImages[this.currentImageIndex];
    }

    get currentImageDate() {
        const date = this.currentGalleryImage?.date;
        if (!date) return { day: '', time: '' };

        const d = new Date(date);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        const day = d.toLocaleDateString('en-US', options);
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        return { day, time };
    }

    get hasNextImage(): boolean {
        return this.currentImageIndex < this.galleryImages.length - 1;
    }

    get hasPreviousImage(): boolean {
        return this.currentImageIndex > 0;
    }

    toggleSmartViewMenu() {
        this.showSmartViewMenu = !this.showSmartViewMenu;
        if (this.showSmartViewMenu) {
            this.showSmartSelectMenu = false;
        }
    }

    setViewMode(mode: 'grid' | 'timeline' | 'grouped') {
        this.viewMode = mode;
        this.showSmartViewMenu = false;
        if (mode === 'grouped') {
            this.groupImagesByDate();
        }
    }

    groupImagesByDate() {
        const groups: { [key: string]: any[] } = {};

        this.galleryImages.forEach((image, index) => {
            const date = image?.date ? new Date(image.date) : new Date();
            const dateKey = this.getDateKey(date);

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push({ ...image, originalIndex: index });
        });

        this.groupedImages = Object.keys(groups)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(date => ({
                date,
                images: groups[date]
            }));
    }

    getDateKey(date: Date): string {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toDateString();
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();

        if (dateStr === todayStr) return 'Today';
        if (dateStr === yesterdayStr) return 'Yesterday';

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (date >= weekAgo) {
            return 'This Week';
        }

        if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            return 'This Month';
        }

        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    formatGroupDate(dateKey: string): string {
        if (dateKey === 'Today' || dateKey === 'Yesterday' || dateKey === 'This Week' || dateKey === 'This Month') {
            return dateKey;
        }
        return dateKey;
    }

    get displayedImages(): any[] {
        return this.galleryImages;
    }

    openImageFromGroup(groupImage: any) {
        this.currentImageIndex = groupImage.originalIndex;
        this.isFullScreenView = true;
    }

    getImageDate(image: any): string {
        const date = image?.date ? new Date(image.date) : new Date();
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('en-US', options);
    }

    logout() {
        this.onboardService.clearUserData();
        this.router.navigate(['/event/selfie-onboarding/signup']);
    }
}

