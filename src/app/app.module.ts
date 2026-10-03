import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import {
  IonApp,
  IonRouterOutlet,
  IonicRouteStrategy,
  provideIonicAngular
} from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { ConnectionService } from './services/connection.service';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonApp, IonRouterOutlet, AppRoutingModule],
  providers: [
    provideIonicAngular(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:3000'
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAppInitializer(() => {
      const connectionService = inject(ConnectionService);
      const authService = inject(AuthService);
      return connectionService.initialize().then(() => authService.initialize());
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
