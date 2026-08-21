import { Injectable } from '@angular/core';
import { map } from 'rxjs';

import { RequestsService } from './requests.service';
import { LayoutConfig } from '../../layout/service/layout.service';

import { EMPTY } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

export type UserTheme = Pick<
    LayoutConfig,
    'darkTheme' | 'primary' | 'surface' | 'preset'
>;

type ThemeResponse = {
    success: boolean;
    theme: UserTheme;
};

@Injectable({
    providedIn: 'root'
})
export class UserSettingsService {
    constructor(
        private req: RequestsService,
        private auth: AuthService
    ) { }

    getTheme() {
        if (!this.auth.isLoggedIn()) {
            return EMPTY;
        }

        return this.req
            .api<ThemeResponse>('GET', 'users/theme')
            .pipe(
                map((res) => {
                    const body: any = res.body;
                    const result = body?.data ?? body;

                    return result.theme as UserTheme;
                })
            );
    }

    saveTheme(config: LayoutConfig) {
        if (!this.auth.isLoggedIn()) {
            return EMPTY;
        }

        const theme: UserTheme = {
            darkTheme: config.darkTheme,
            primary: config.primary,
            surface: config.surface ?? null,
            preset: config.preset
        };

        return this.req
            .api<ThemeResponse>('PATCH', 'users/theme', {
                body: theme
            })
            .pipe(
                map((res) => {
                    const body: any = res.body;
                    const result = body?.data ?? body;

                    return result.theme as UserTheme;
                })
            );
    }
}
