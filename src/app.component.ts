import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonService } from './app/services/common.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule,CommonModule,],
    template: `
       <router-outlet></router-outlet>`,

})
export class AppComponent implements OnInit, OnDestroy {
  private loaderSub!: Subscription;

  private blockContextMenuHandler = (event: MouseEvent) => {
    event.preventDefault();
  };

  private blockKeyboardHandler = (event: KeyboardEvent) => {
    if (
      (event.ctrlKey && ['c', 'C', 'u', 'U', 's', 'S'].includes(event.key)) ||
      (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') ||
      event.key === 'F12'
    ) {
      event.preventDefault();
      event.stopPropagation();

    }
  };

constructor( private common: CommonService) {}

  ngOnInit() {
   

   
  }

  ngOnDestroy() {
   
  }
}
