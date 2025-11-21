import { Routes } from '@angular/router';

export const appRoutes: Routes = [
    {
        path: 'event/selfie-onboarding',
        loadComponent: () => import('./app/selfie-onboard/components/event-wrapper/event-wrapper.component').then(m => m.EventWrapperComponent),
        children: [
            {
                path: 'signup',
                loadComponent: () => import('./app/selfie-onboard/components/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'signup',
                loadComponent: () => import('./app/selfie-onboard/components/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'otp',
                loadComponent: () => import('./app/selfie-onboard/components/otp/otp.component').then(m => m.OtpComponent)
            },
            {
                path: 'selfie',
                loadComponent: () => import('./app/selfie-onboard/components/selfie/selfie.component').then(m => m.SelfieComponent)
            },
            {
                path: 'summary',
                loadComponent: () => import('./app/selfie-onboard/components/summary/summary.component').then(m => m.SummaryComponent)
            },
            {
                path: 'gallery',
                loadComponent: () => import('./app/selfie-onboard/components/gallery/gallery.component').then(m => m.GalleryComponent)
            },
            {
                path: '',
                redirectTo: 'signup',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'event/selfie-onboarding/signup',
        redirectTo: 'event/selfie-onboarding/signup',
        pathMatch: 'full'
    },
    { path: '**', redirectTo: 'event/selfie-onboarding/signup' }
];


