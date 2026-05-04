import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';

export const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const logged = auth.isLoggedIn();
    // console.log('[authGuard] loggedIn =', logged);

    return logged ? true : router.parseUrl('/landing');
};

export const noAuthGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const logged = auth.isLoggedIn();
    // console.log('[noAuthGuard] loggedIn =', logged);

    return logged ? router.parseUrl('/dashboard') : true;
};

export const rootRedirectGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const logged = auth.isLoggedIn();

    return logged
        ? router.parseUrl('/dashboard')
        : router.parseUrl('/landing');
};

class DummyComponent { }

export const appRoutes: Routes = [
    // Dynamic default
    { path: '', pathMatch: 'full', canMatch: [rootRedirectGuard], component: DummyComponent },

    // Public
    {
        path: 'landing',
        canMatch: [noAuthGuard],
        loadComponent: () => import('./app/pages/landing/landing').then(m => m.Landing),
    },
    {
        path: 'auth',
        canMatch: [noAuthGuard],
        loadChildren: () => import('./app/pages/auth/auth.routes'),
    },

    // Protected shell
    {
        path: '',
        canMatch: [authGuard],
        loadComponent: () => import('./app/layout/component/app.layout').then(m => m.AppLayout),
        children: [
            // ✅ default inside shell goes to /dashboard
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

            // ✅ /dashboard is the real dashboard route
            { path: 'dashboard', loadComponent: () => import('./app/pages/dashboard/dashboard').then(m => m.Dashboard) },

            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', loadComponent: () => import('./app/pages/documentation/documentation').then(m => m.Documentation) },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
        ],
    },

    // 404
    { path: 'notfound', loadComponent: () => import('./app/pages/notfound/notfound').then(m => m.Notfound) },
    { path: '**', redirectTo: '/notfound' },
];
