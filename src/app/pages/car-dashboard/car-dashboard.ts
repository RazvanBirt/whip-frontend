import { Component, effect, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';

import { RequestsService } from '../service/requests.service';
import { LayoutService } from '@/app/layout/service/layout.service';

type UserCar = {
    id: string;
    nickname?: string | null;
    vin?: string | null;
    licensePlate?: string | null;
    color?: string | null;
    mileageKm?: number | null;
    isPrimary?: boolean;
    versionConfig?: any;
    createdAt?: string;
    updatedAt?: string;
};

type EditableBasicField =
    | 'nickname'
    | 'mileageKm'
    | 'color'
    | 'licensePlate'
    | 'vin';

type BasicDraft = {
    nickname: string;
    mileageKm: number | null;
    color: string;
    licensePlate: string;
    vin: string;
};

@Component({
    selector: 'car-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        // RouterLink,
        CardModule,
        ButtonModule,
        TagModule,
        ChartModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        ToastModule
    ],
    templateUrl: './car-dashboard.html',
    styleUrl: './car-dashboard.scss',
    providers: [MessageService],
})
export class CarDashboard {
    private readonly route = inject(ActivatedRoute);
    private readonly requestsService = inject(RequestsService);
    private readonly messageService: MessageService = inject(MessageService);

    layoutService = inject(LayoutService);

    private readonly paramMap = toSignal(this.route.paramMap);

    specsPopup = signal(false);

    car = signal<UserCar | null>(null);
    loadingCar = signal(false);
    carError = signal<string | null>(null);

    editingField = signal<EditableBasicField | null>(null);

    basicOriginal = signal<BasicDraft>({
        nickname: '',
        mileageKm: null,
        color: '',
        licensePlate: '',
        vin: '',
    });

    basicDraft = signal<BasicDraft>({
        nickname: '',
        mileageKm: null,
        color: '',
        licensePlate: '',
        vin: '',
    });

    basicDirty = computed(() => {
        const original = this.basicOriginal();
        const draft = this.basicDraft();

        return (
            original.nickname !== draft.nickname ||
            original.mileageKm !== draft.mileageKm ||
            original.color !== draft.color ||
            original.licensePlate !== draft.licensePlate ||
            original.vin !== draft.vin
        );
    });

    carId = computed(() => this.paramMap()?.get('carId'));

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'var(--text-color)'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'var(--text-color-secondary)'
                },
                grid: {
                    color: 'var(--surface-border)'
                }
            },
            y: {
                ticks: {
                    color: 'var(--text-color-secondary)'
                },
                grid: {
                    color: 'var(--surface-border)'
                }
            }
        }
    };

    mileageChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Mileage',
                data: [132000, 133100, 134250, 135400, 136800, 138565],
                tension: 0.35,
                fill: false
            }
        ]
    };

    fuelChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Fuel consumption',
                data: [6.8, 7.1, 6.9, 7.4, 7.0, 6.7],
                tension: 0.35,
                fill: false
            }
        ]
    };

    costChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Fuel cost',
                data: [85, 92, 88, 105, 97, 90],
                tension: 0.35,
                fill: false
            }
        ]
    };

    lineOptions = signal<any>(null);
    lineData = signal<any>(null);

    chartEffect = effect(() => {
        this.layoutService.layoutConfig().darkTheme;
        setTimeout(() => this.initCharts(), 150);
    })

    initCharts() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.lineData.set({
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'First Dataset',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                    borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                    tension: 0.4
                },
                {
                    label: 'Second Dataset',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    borderColor: documentStyle.getPropertyValue('--p-primary-200'),
                    tension: 0.4
                }
            ]
        });

        this.lineOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        });

    }

    ngOnInit() {
        this.loadCar();
    }

    loadCar() {
        const carId = this.route.snapshot.paramMap.get('carId');

        if (!carId) {
            this.carError.set('No car id provided.');
            return;
        }

        this.loadingCar.set(true);
        this.carError.set(null);

        this.requestsService.api<UserCar>('GET', 'garage', { ids: carId }).subscribe({
            next: (res) => {
                const body = this.bodyData(res);
                const loadedCar = body?.car ?? body;

                this.car.set(loadedCar);

                const basicData = this.createBasicDraftFromCar(loadedCar);
                this.basicOriginal.set(basicData);
                this.basicDraft.set(basicData);

                this.loadingCar.set(false);
            },
            error: (err) => {
                this.carError.set(err?.message ?? 'Could not load car.');
                this.loadingCar.set(false);
            }
        });
    }

    toggleSpecs() {
        this.specsPopup.update((value) => !value);
    }

    editField(field: EditableBasicField) {
        this.editingField.set(field);
    }

    stopEditing() {
        this.editingField.set(null);
    }

    discardBasicChanges() {
        this.basicDraft.set(this.basicOriginal());
        this.stopEditing();
    }

    saveBasicChanges() {
        const draft = this.basicDraft();

        this.car.update(car =>
            car
                ? {
                    ...car,
                    nickname: draft.nickname,
                    mileageKm: draft.mileageKm,
                    color: draft.color,
                    licensePlate: draft.licensePlate,
                    vin: draft.vin,
                }
                : car
        );

        this.basicOriginal.set(draft);
        this.stopEditing();

        this.requestsService.api<UserCar>('PATCH', 'garage', {
            ids: this.carId() ?? undefined,
            body: draft
        }).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Basic information updated',
                    life: 3000,
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update basic information',
                    life: 3000,
                });
            }
        });
    }

    updateNickname(value: string) {
        this.basicDraft.update(draft => ({
            ...draft,
            nickname: value,
        }));
    }

    updateMileageKm(value: string) {
        this.basicDraft.update(draft => ({
            ...draft,
            mileageKm: value === '' ? null : Number(value),
        }));
    }

    updateColor(value: string) {
        this.basicDraft.update(draft => ({
            ...draft,
            color: value,
        }));
    }

    updateLicensePlate(value: string) {
        this.basicDraft.update(draft => ({
            ...draft,
            licensePlate: value,
        }));
    }

    updateVin(value: string) {
        this.basicDraft.update(draft => ({
            ...draft,
            vin: value,
        }));
    }

    private createBasicDraftFromCar(car: UserCar | null): BasicDraft {
        return {
            nickname: car?.nickname ?? '',
            mileageKm: car?.mileageKm ?? null,
            color: car?.color ?? '',
            licensePlate: car?.licensePlate ?? '',
            vin: car?.vin ?? '',
        };
    }

    private bodyData(res: any) {
        return res?.body?.data ?? res?.body ?? res;
    }
}
