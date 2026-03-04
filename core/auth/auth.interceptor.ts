import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service'; // adjust path if needed

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const token = auth.accessToken; // make sure getter exists

    // only attach to your backend API calls (optional but recommended)
    if (!token || !req.url.includes('/api/')) return next(req);

    return next(
        req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        })
    );
};
