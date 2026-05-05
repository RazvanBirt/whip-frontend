import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export interface ApiResponse<T = any> {
    data?: T;
    msg?: string;
    [key: string]: any;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Id = string | number;
type Ids = Id | Id[];
type Query = Record<string, string | number | boolean | null | undefined>;

function handleError(err: HttpErrorResponse) {
    const backend = err.error;
    const message =
        (backend && (backend.error || backend.msg)) ||
        err.message ||
        'Request failed';

    return throwError(() => ({
        status: err.status,
        message,
        error: backend,
    }));
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
    // TODO env
    private readonly BASE_URL = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    private normalizeEndpoint(endpoint: string) {
        return endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    }

    private buildParams(query?: Query): HttpParams | undefined {
        if (!query) return undefined;
        let params = new HttpParams();
        for (const [k, v] of Object.entries(query)) {
            if (v === null || v === undefined) continue;
            params = params.set(k, String(v));
        }
        return params;
    }

    private joinIds(ids?: Ids): string {
        if (ids === undefined || ids === null) return '';
        const parts = Array.isArray(ids) ? ids : [ids];
        if (!parts.length) return '';
        return '/' + parts.map((x) => encodeURIComponent(String(x))).join('/');
    }

    /**
     * The one method you use everywhere.
     *
     * Patterns:
     * - GET list:    api('GET', 'makes')
     * - GET by id:   api('GET', 'makes', { ids: makeId })
     * - Nested ids:  api('GET', 'makes', { ids: [makeId, 'models'] })  // or ids:[makeId, modelId]
     * - Query:       api('GET', 'models', { query: { makeId } })
     * - POST:        api('POST', 'makes', { body: {...} })
     * - PATCH:       api('PATCH', 'makes', { ids: makeId, body: {...} })
     * - DELETE:      api('DELETE', 'makes', { ids: makeId }) // sends softDeleted body by default
     */
    api<T = any>(
        method: Method,
        endpoint: string,
        options?: {
            ids?: Ids;
            query?: Query;
            body?: any;
        }
    ): Observable<HttpResponse<ApiResponse<T>>> {
        const ep = this.normalizeEndpoint(endpoint);
        const idsPart = this.joinIds(options?.ids);
        const url = `${this.BASE_URL}/${ep}${idsPart}`;

        const token = localStorage.getItem('access_token');

        const headers = token
            ? new HttpHeaders({ Authorization: `Bearer ${token}` })
            : undefined;

        // console.log('Request URL:', url);

        const params = method === 'GET' ? this.buildParams(options?.query) : undefined;

        let body = options?.body;

        return this.http
            .request<ApiResponse<T>>(method, url, {
                observe: 'response',
                params,
                body,
                headers,
            })
            .pipe(catchError(handleError));
    }
}
