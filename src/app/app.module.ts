import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import {
  IonApp,
  IonRouterOutlet,
  IonicRouteStrategy,
  provideIonicAngular
} from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonApp, IonRouterOutlet, AppRoutingModule],
  providers: [
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
