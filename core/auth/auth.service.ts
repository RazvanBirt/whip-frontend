import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { RequestsService } from '../../src/app/pages/service/requests.service';
import { HttpResponse } from '@angular/common/http';

type UserDto = { id: string; email: string; displayName?: string };

type RegisterPayload = { Email: string; Password: string };
type LoginPayload = { Email: string; Password: string };
type LogoutPayload = { refreshToken: string };

type AuthSuccess = {
    success: true;
    user: UserDto;
    accessToken: string;
    refreshToken: string;
};

type AuthFail = { success: false; error: string };

type AuthResponse = AuthSuccess | AuthFail;

@Injectable({ providedIn: 'root' })
export class AuthService {
    private ACCESS_KEY = 'access_token';
    private REFRESH_KEY = 'refresh_token';
    private USER_KEY = 'auth_user';

    constructor(private req: RequestsService) { }

    // ----- session helpers -----
    isLoggedIn(): boolean {
        return !!localStorage.getItem(this.ACCESS_KEY);
    }

    get accessToken(): string | null {
        return localStorage.getItem(this.ACCESS_KEY);
    }

    get refreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_KEY);
    }

    get email(): string | null {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw)?.email ?? null : null;
        } catch {
            return null;
        }
    }

    setSession(accessToken: string, refreshToken: string, user?: any) {
        // console.log('res:', accessToken, refreshToken, user)
        localStorage.setItem(this.ACCESS_KEY, accessToken);
        localStorage.setItem(this.REFRESH_KEY, refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    clearSession() {
        localStorage.removeItem(this.ACCESS_KEY);
        localStorage.removeItem(this.REFRESH_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    // ----- API calls -----
    register(payload: RegisterPayload) {
        //TODO : fix any> typing
        return this.req.api<any>('POST', 'auth/register', { body: payload }).pipe(
            map((res) => res.body),
            map((body) => {
                const result = body?.data ?? body;
                if (!result?.success) throw result;
                this.setSession(result.accessToken, result.refreshToken, result.user);
                return result;
            })
        );
    }

    login(payload: LoginPayload) {
        //TODO : fix any> typing
        return this.req.api<any>('POST', 'auth/login', { body: payload }).pipe(
            map((res) => res.body),
            map((body) => {

                const result = body?.data ?? body;
                if (!result?.success) throw result;

                this.setSession(result.accessToken, result.refreshToken, result.user);

                return result;
            })
        );
    }

    logout() {
        const rt = this.refreshToken;

        // clear local session immediately (good UX)
        this.clearSession();

        // if we don't have a refresh token, nothing to revoke server-side
        if (!rt) return this.req.api('POST', 'auth/logout', { body: { refreshToken: '' } });

        return this.req.api('POST', 'auth/logout', { body: { refreshToken: rt } });
    }

    refresh() {
        const rt = this.refreshToken;
        if (!rt) throw new Error('Missing refresh token');

        return this.req.api<{ success: boolean; accessToken?: string; refreshToken?: string }>(
            'POST',
            'auth/refresh',
            { body: { refreshToken: rt } }
        ).pipe(
            map((r: HttpResponse<any>) => r.body),
            map((body: any) => {
                if (!body?.success) throw body;
                // refresh rotates refreshToken too in your backend
                if (body.accessToken) localStorage.setItem(this.ACCESS_KEY, body.accessToken);
                if (body.refreshToken) localStorage.setItem(this.REFRESH_KEY, body.refreshToken);
                return body;
            })
        );
    }
}
