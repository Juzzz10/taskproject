import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Interceptor now looks in sessionStorage for the token
    const token = sessionStorage.getItem('token');

    let authReq = req.clone({
      setHeaders: {
        'Accept': 'application/json'
      }
    });

    if (token) {
      authReq = authReq.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq);
  }
}