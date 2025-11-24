import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environmentCommon } from '../../environments/environment.common';


@Injectable({ providedIn: 'root' })

export class CommonService {
    api = environmentCommon.api;
    private menuSubject = new Subject<string>();
    menuExpand$ = this.menuSubject.asObservable();
    private loaderSubject = new Subject<string>();
    showLoader$ = this.loaderSubject.asObservable();
    private containerloaderSubject = new Subject<string>();
    showContainerloader$ = this.containerloaderSubject.asObservable();

    constructor() {
    }

    menuToggle(action: boolean) {
        this.menuSubject.next(action ? 'show' : 'hide');
    }

    setLoader(action: boolean) {
        this.loaderSubject.next(action ? 'show' : 'hide');
    }

    setContainerLoader(action: boolean) {
        this.containerloaderSubject.next(action ? 'show' : 'hide');
    }

    camelize(str: string) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index === 0 ? word.toUpperCase() : word.toLowerCase();
        });
    }
}


