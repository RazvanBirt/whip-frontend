import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const isApiCall = req.url.includes('/api/');
    const isAuthCall =
        req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/register') ||
        req.url.includes('/api/auth/refresh') ||
        req.url.includes('/api/auth/logout');

    const addToken = (token: string) =>
        req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });

    const token = auth.accessToken;
    const authReq = isApiCall && token && !isAuthCall ? addToken(token) : req;

    return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status !== 401 || !isApiCall || isAuthCall || !auth.refreshToken) {
                return throwError(() => err);
            }

            return auth.refresh().pipe(
                switchMap(() => {
                    const newToken = auth.accessToken;

                    if (!newToken) {
                        auth.clearSession();
                        router.navigateByUrl('/landing');
                        return throwError(() => err);
                    }

                    return next(addToken(newToken));
                }),
                catchError((refreshErr) => {
                    auth.clearSession();
                    router.navigateByUrl('/landing');
                    return throwError(() => refreshErr);
                })
            );
        })
    );
};
