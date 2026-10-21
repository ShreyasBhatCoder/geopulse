import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

function logginInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
  console.log("Intercepted!");
  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes), 
    provideHttpClient(
      withInterceptors([logginInterceptor])
    )
  ],
};
