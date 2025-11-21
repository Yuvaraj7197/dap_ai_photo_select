import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig,importProvidersFrom  } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
    provideRouter,
    withEnabledBlockingInitialNavigation,
    withInMemoryScrolling
} from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { NgxGoogleAnalyticsModule,NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),
        importProvidersFrom(
            NgxGoogleAnalyticsModule.forRoot('G-4SS4S02HSX'),
            NgxGoogleAnalyticsRouterModule
        ),
        provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } }
        }),
        { provide: LocationStrategy, useClass: HashLocationStrategy } 
    ]
};
