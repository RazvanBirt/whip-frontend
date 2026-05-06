import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { RouterLink } from '@angular/router';

import { RequestsService } from '../service/requests.service';

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

type AddGarageForm = {
    versionConfigId: string | null;
    nickname: string;
    vin: string;
    licensePlate: string;
    color: string;
    mileageKm: number | null;
    isPrimary: boolean;
};

@Component({
    selector: 'my-garage',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        CardModule,
        DialogModule,
        DividerModule,
        InputNumberModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        RouterLink
    ],
    providers: [MessageService],
    templateUrl: './my-garage.html',
    styleUrl: './my-garage.scss'
})

export class MyGarage implements OnInit {
    cars = signal<UserCar[]>([]);
    loadingGarage = signal(false);
    garageError = signal<string | null>(null);

    addCarDialog = false;

    catalogModels = signal<any[]>([]);
    loadingCatalog = signal(false);
    catalogError = signal<string | null>(null);

    savingCar = signal(false);

    selectedModel: any = null;
    selectedGeneration: any = null;
    selectedBodyVariant: any = null;
    selectedVersion: any = null;
    selectedConfig: any = null;

    addForm: AddGarageForm = this.emptyAddForm();

    constructor(
        private requestsService: RequestsService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadGarage();
    }

    loadGarage() {
        this.loadingGarage.set(true);
        this.garageError.set(null);

        this.requestsService.api('GET', 'garage').subscribe({
            next: (res) => {
                const body = this.bodyData(res);
                this.cars.set(body?.cars ?? []);
                this.loadingGarage.set(false);
            },
            error: (err) => {
                this.garageError.set(err?.message ?? 'Could not load garage.');
                this.loadingGarage.set(false);
            }
        });
    }

    openAddCarDialog() {
        this.addCarDialog = true;
        this.resetSelectionsOnly();

        if (!this.catalogModels().length) {
            this.loadCatalog();
        }
    }

    resetAddCarDialog() {
        this.resetSelectionsOnly();
        this.addForm = this.emptyAddForm();
        this.savingCar.set(false);
    }

    private resetSelectionsOnly() {
        this.selectedModel = null;
        this.selectedGeneration = null;
        this.selectedBodyVariant = null;
        this.selectedVersion = null;
        this.selectedConfig = null;
    }

    private emptyAddForm(): AddGarageForm {
        return {
            versionConfigId: null,
            nickname: '',
            vin: '',
            licensePlate: '',
            color: '',
            mileageKm: null,
            isPrimary: false
        };
    }

    loadCatalog() {
        this.loadingCatalog.set(true);
        this.catalogError.set(null);

        this.requestsService
            .api('GET', 'models/models', {
                query: {
                    includeCatalog: true,
                    page: 1,
                    limit: 500
                }
            })
            .subscribe({
                next: (res) => {
                    const body = this.bodyData(res);
                    const models = body?.models ?? [];

                    this.catalogModels.set(
                        models.map((m: any) => ({
                            ...m,
                            displayLabel: this.modelLabel(m)
                        }))
                    );

                    this.loadingCatalog.set(false);
                },
                error: (err) => {
                    this.catalogError.set(
                        err?.message ?? 'Could not load catalog models.'
                    );
                    this.loadingCatalog.set(false);
                }
            });
    }

    onModelChange() {
        this.selectedGeneration = null;
        this.selectedBodyVariant = null;
        this.selectedVersion = null;
        this.selectedConfig = null;
    }

    onGenerationChange() {
        this.selectedBodyVariant = null;
        this.selectedVersion = null;
        this.selectedConfig = null;
    }

    onBodyVariantChange() {
        this.selectedVersion = null;
        this.selectedConfig = null;
    }

    onVersionChange() {
        this.selectedConfig = null;
    }

    onConfigChange() {
        this.addForm.versionConfigId = this.selectedConfig?.id ?? null;
    }

    generationOptions() {
        return this.selectedModel?.generations ?? [];
    }

    bodyVariantOptions() {
        return (this.selectedGeneration?.bodyVariants ?? []).map((bv: any) => ({
            ...bv,
            displayLabel: this.bodyVariantLabel(bv)
        }));
    }

    versionOptions() {
        return (this.selectedBodyVariant?.versions ?? []).map((v: any) => ({
            ...v,
            displayLabel: this.versionLabel(v)
        }));
    }

    configOptions() {
        return (this.selectedVersion?.configs ?? []).map((cfg: any) => ({
            ...cfg,
            displayLabel: this.configLabel(cfg)
        }));
    }

    addCarToGarage() {
        if (!this.selectedConfig?.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing configuration',
                detail: 'Please select the exact car configuration.'
            });
            return;
        }

        this.savingCar.set(true);

        const payload = {
            versionConfigId: this.selectedConfig.id,
            nickname: this.cleanString(this.addForm.nickname),
            vin: this.cleanString(this.addForm.vin),
            licensePlate: this.cleanString(this.addForm.licensePlate),
            color: this.cleanString(this.addForm.color),
            mileageKm: this.addForm.mileageKm,
            isPrimary: this.addForm.isPrimary
        };

        this.requestsService
            .api('POST', 'garage', {
                body: payload
            })
            .subscribe({
                next: (res) => {
                    const body = this.bodyData(res);
                    const created = body?.car;

                    if (created) {
                        this.cars.set([created, ...this.cars()]);
                    } else {
                        this.loadGarage();
                    }

                    this.savingCar.set(false);
                    this.addCarDialog = false;

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Added',
                        detail: 'Car added to your garage.'
                    });
                },
                error: (err) => {
                    this.savingCar.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Add failed',
                        detail: err?.message ?? 'Could not add car to garage.'
                    });
                }
            });
    }

    deleteCar(car: UserCar) {
        this.requestsService
            .api('DELETE', 'garage', {
                ids: car.id
            })
            .subscribe({
                next: () => {
                    this.cars.set(this.cars().filter((x) => x.id !== car.id));

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Removed',
                        detail: 'Car removed from garage.'
                    });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Remove failed',
                        detail: err?.message ?? 'Could not remove car.'
                    });
                }
            });
    }

    getCarTitle(car: UserCar) {
        if (car.nickname) return car.nickname;

        const config = car.versionConfig;
        const version = config?.version;
        const bodyVariant = version?.bodyVariant;
        const generation = bodyVariant?.generation;
        const model = generation?.model;
        const make = model?.make;

        return [make?.name, model?.name, generation?.name]
            .filter(Boolean)
            .join(' ') || 'Unknown car';
    }

    getCarSubtitle(car: UserCar) {
        const config = car.versionConfig;
        const version = config?.version;
        const engine = config?.engine;
        const transmission = config?.transmission;
        const drivetrain = config?.drivetrain;
        const spec = config?.spec;

        const ps = spec?.powerPsOverride ?? engine?.powerPs;

        return [
            config?.year,
            version?.name,
            engine?.code,
            ps ? `${ps} PS` : null,
            this.transmissionLabel(transmission),
            drivetrain?.type
        ]
            .filter(Boolean)
            .join(' · ');
    }

    private modelLabel(model: any) {
        const makeName = model?.make?.name;
        const modelName = model?.name;

        return [makeName, modelName].filter(Boolean).join(' ') || 'Unknown model';
    }

    private bodyVariantLabel(bv: any) {
        const bodyType = bv?.bodyType?.name;
        const doors = bv?.doors ? `${bv.doors}D` : null;

        return [bv?.name, bodyType, doors].filter(Boolean).join(' · ');
    }

    private versionLabel(version: any) {
        const phase = version?.phase?.name ?? version?.phaseName;
        const years = this.yearRange(version?.startYear, version?.endYear);

        return [version?.name, phase, years].filter(Boolean).join(' · ');
    }

    private configLabel(cfg: any) {
        const engine = cfg?.engine;
        const transmission = cfg?.transmission;
        const drivetrain = cfg?.drivetrain;
        const spec = cfg?.spec;

        const powerPs = spec?.powerPsOverride ?? engine?.powerPs;
        const fuelType = spec?.fuelType ?? engine?.fuelType;

        return [
            cfg?.year,
            this.cleanEngineCode(engine?.code),
            fuelType,
            powerPs ? `${powerPs} PS` : null,
            this.transmissionLabel(transmission),
            drivetrain?.type
        ]
            .filter(Boolean)
            .join(' · ');
    }

    private transmissionLabel(t: any) {
        if (!t) return null;

        if (t.gears === null || t.gears === undefined || Number(t.gears) <= 0) {
            return t.type;
        }

        return `${t.type} ${t.gears}`;
    }

    private yearRange(start?: number | null, end?: number | null) {
        if (!start && !end) return null;
        if (start && !end) return `${start}–present`;
        if (!start && end) return `${end}`;
        return `${start}–${end}`;
    }

    private cleanString(value: string) {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
    }

    private cleanEngineCode(code?: string | null) {
        if (!code) return null;

        return code
            .replace(/^FOR_/, '')
            .replace(/^VW_/, '')
            .replace(/^AUDI_/, '')
            .replace(/^BMW_/, '')
            .replace(/^MB_/, '')
            .replace(/^MAZ_/, '')
            .replace(/^TOY_/, '')
            .replace(/^HON_/, '')
            .replace(/^REN_/, '')
            .replace(/^VOL_/, '')
            .replace(/^POR_/, '')
            .replaceAll('_', ' ');
    }

    private bodyData(res: any) {
        return res?.body?.data ?? res?.body ?? res;
    }
}



// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';

// interface GarageCar {
//     id: string;
//     nickname: string;
//     make: string;
//     model: string;
//     year: number;
//     mileage: number;
//     color: string;
//     plate: string;
// }

// @Component({
//     selector: 'my-garage',
//     standalone: true,
//     imports: [CommonModule, RouterLink, CardModule, ButtonModule, TagModule],
//     template: `
//         <div class="garage-page">
//             <div class="garage-header">
//                 <div>
//                     <p class="eyebrow">Garage</p>
//                     <h1>My Garage</h1>
//                     <p class="subtitle">Select a car to open its dashboard.</p>
//                 </div>

//                 <button pButton label="Add car" icon="pi pi-plus"></button>
//             </div>

//             <div class="garage-grid">
//                 @for (car of cars; track car.id) {
//                     <a class="car-card-link" [routerLink]="['/pages/my-garage', car.id]">
//                         <p-card>
//                             <ng-template pTemplate="header">
//                                 <div class="car-card-hero">
//                                     <i class="pi pi-car"></i>
//                                 </div>
//                             </ng-template>

//                             <div class="car-card-body">
//                                 <div class="car-title-row">
//                                     <div>
//                                         <h2>{{ car.nickname }}</h2>
//                                         <p>{{ car.year }} {{ car.make }} {{ car.model }}</p>
//                                     </div>

//                                     <p-tag [value]="car.color"></p-tag>
//                                 </div>

//                                 <div class="car-meta">
//                                     <span>
//                                         <strong>{{ car.mileage | number }}</strong>
//                                         miles
//                                     </span>
//                                     <span>{{ car.plate }}</span>
//                                 </div>

//                                 <button
//                                     pButton
//                                     label="Open dashboard"
//                                     icon="pi pi-arrow-right"
//                                     iconPos="right"
//                                     class="w-full"
//                                 ></button>
//                             </div>
//                         </p-card>
//                     </a>
//                 }
//             </div>
//         </div>
//     `,
//     styles: [
//         `
//             .garage-page {
//                 display: flex;
//                 flex-direction: column;
//                 gap: 1.5rem;
//             }

//             .garage-header {
//                 display: flex;
//                 align-items: center;
//                 justify-content: space-between;
//                 gap: 1rem;
//             }

//             .eyebrow {
//                 margin: 0 0 0.25rem;
//                 color: var(--primary-color);
//                 font-weight: 700;
//                 text-transform: uppercase;
//                 letter-spacing: 0.08em;
//                 font-size: 0.75rem;
//             }

//             h1,
//             h2,
//             p {
//                 margin: 0;
//             }

//             h1 {
//                 font-size: 2rem;
//                 font-weight: 800;
//             }

//             .subtitle {
//                 margin-top: 0.35rem;
//                 color: var(--text-color-secondary);
//             }

//             .garage-grid {
//                 display: grid;
//                 grid-template-columns: repeat(3, minmax(0, 1fr));
//                 gap: 1rem;
//             }

//             .car-card-link {
//                 color: inherit;
//                 text-decoration: none;
//                 display: block;
//             }

//             .car-card-link:hover {
//                 transform: translateY(-2px);
//                 transition: transform 160ms ease;
//             }

//             .car-card-hero {
//                 height: 120px;
//                 display: flex;
//                 align-items: center;
//                 justify-content: center;
//                 background:
//                     radial-gradient(circle at top left, color-mix(in srgb, var(--primary-color), transparent 65%), transparent 40%),
//                     var(--surface-card);
//                 border-radius: 12px 12px 0 0;
//             }

//             .car-card-hero i {
//                 font-size: 3rem;
//                 color: var(--primary-color);
//             }

//             .car-card-body {
//                 display: flex;
//                 flex-direction: column;
//                 gap: 1rem;
//             }

//             .car-title-row {
//                 display: flex;
//                 align-items: flex-start;
//                 justify-content: space-between;
//                 gap: 1rem;
//             }

//             .car-title-row h2 {
//                 font-size: 1.25rem;
//                 font-weight: 800;
//             }

//             .car-title-row p {
//                 color: var(--text-color-secondary);
//                 margin-top: 0.25rem;
//             }

//             .car-meta {
//                 display: flex;
//                 align-items: center;
//                 justify-content: space-between;
//                 color: var(--text-color-secondary);
//                 font-size: 0.9rem;
//             }

//             .car-meta strong {
//                 color: var(--text-color);
//             }

//             @media (max-width: 1100px) {
//                 .garage-grid {
//                     grid-template-columns: repeat(2, minmax(0, 1fr));
//                 }
//             }

//             @media (max-width: 700px) {
//                 .garage-header {
//                     align-items: flex-start;
//                     flex-direction: column;
//                 }

//                 .garage-grid {
//                     grid-template-columns: 1fr;
//                 }
//             }
//         `
//     ]
// })
// export class MyGarage {
//     cars: GarageCar[] = [
//         {
//             id: 'bmw-330i',
//             nickname: 'Daily Beast',
//             make: 'BMW',
//             model: '330i',
//             year: 2020,
//             mileage: 48250,
//             color: 'Blue',
//             plate: 'WHIP-330'
//         },
//         {
//             id: 'golf-gti',
//             nickname: 'Pocket Rocket',
//             make: 'Volkswagen',
//             model: 'Golf GTI',
//             year: 2019,
//             mileage: 61500,
//             color: 'White',
//             plate: 'GTI-019'
//         },
//         {
//             id: 'mx5',
//             nickname: 'Weekend Toy',
//             make: 'Mazda',
//             model: 'MX-5',
//             year: 2022,
//             mileage: 14200,
//             color: 'Red',
//             plate: 'MX5-FUN'
//         }
//     ];
// }
