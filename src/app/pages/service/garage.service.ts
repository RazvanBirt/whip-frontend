import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { RequestsService } from './requests.service';
import {
    AddGarageCarPayload,
    UpdateGarageCarPayload,
    UserCar
} from '../garage/garage.types';

type GarageListResponse = {
    success: boolean;
    cars: UserCar[];
};

type GarageCarResponse = {
    success: boolean;
    car: UserCar;
};

@Injectable({ providedIn: 'root' })
export class GarageService {
    constructor(private req: RequestsService) { }

    getMyGarage() {
        return this.req.api<GarageListResponse>('GET', 'garage').pipe(
            map((res) => {
                const body: any = res.body;
                const result = body?.data ?? body;
                return result?.cars ?? [];
            })
        );
    }

    getCar(id: string) {
        return this.req.api<GarageCarResponse>('GET', 'garage', { ids: id }).pipe(
            map((res) => {
                const body: any = res.body;
                const result = body?.data ?? body;
                return result?.car;
            })
        );
    }

    addCar(payload: AddGarageCarPayload) {
        return this.req.api<GarageCarResponse>('POST', 'garage', { body: payload }).pipe(
            map((res) => {
                const body: any = res.body;
                const result = body?.data ?? body;
                return result?.car;
            })
        );
    }

    updateCar(id: string, payload: UpdateGarageCarPayload) {
        return this.req.api<GarageCarResponse>('PATCH', 'garage', {
            ids: id,
            body: payload
        }).pipe(
            map((res) => {
                const body: any = res.body;
                const result = body?.data ?? body;
                return result?.car;
            })
        );
    }

    deleteCar(id: string) {
        return this.req.api('DELETE', 'garage', { ids: id }).pipe(
            map((res) => res.body?.data ?? res.body)
        );
    }
}
