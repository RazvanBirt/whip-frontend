import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RequestsService } from '../service/requests.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CountryService } from '../service/country.service';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { TableLazyLoadEvent } from 'primeng/table';

export interface Engine {
    id?: string;
    code?: string;
    configuration?: string;
    displacementLiters?: number;
    displacementCc?: number;
    cylinders?: number;
    fuelType?: string;
    aspiration?: string;
    powerPs?: number;
    powerKw?: number;
    torqueNm?: number;
    torqueLbft?: number;
}

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'engines',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        AutoCompleteModule,
        FileUploadModule,
        TooltipModule
    ],
    templateUrl: './engines.html',
    providers: [MessageService, ConfirmationService, RequestsService, CountryService]
})
export class Engines implements OnInit {
    engineDialog: boolean = false;

    engine!: Engine;
    engines = signal<Engine[]>([]);

    selectedEngines!: Engine[] | null;
    submitted: boolean = false;

    autoValue: string[] = [];
    autoFilteredValue: string[] = [];

    selectedAutoValue: any = null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    totalRecords = signal<number>(0);
    loading = signal<boolean>(false);

    // server-side search text
    searchText = signal<string>('');

    private searchTimer: any = null;

    fuelTypeOptions = [
        { label: 'Petrol', value: 'Petrol' },
        { label: 'Diesel', value: 'Diesel' },
        { label: 'Hybrid', value: 'Hybrid' },
        { label: 'Electric', value: 'Electric' },
        { label: 'LPG', value: 'LPG' },
        { label: 'CNG', value: 'CNG' },
        { label: 'Ethanol', value: 'Ethanol' },
    ];


    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private requestsService: RequestsService,
        private countryService: CountryService
    ) { }

    exportCSV() {
        this.dt.exportCSV();
    }

    async ngOnInit() {
        const countries = await this.countryService.getCountries();
        this.autoValue = countries.map(c => c.name);

        this.requestsService.api('GET', 'engines/engines').subscribe(res => {
            this.engines.set(res.body?.['engines'] ?? []);
        });
    }

    loadEngines(event?: TableLazyLoadEvent | { first: number; rows: number }) {
        const first = (event as any)?.first ?? 0;
        const rows = (event as any)?.rows ?? 5;

        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        // optional sorting support
        const sortField = (event as any)?.sortField;
        const sortOrder = (event as any)?.sortOrder === -1 ? 'desc' : 'asc';

        const params: any = {
            page,
            limit,
        };

        const s = this.searchText().trim();
        if (s) params.search = s;

        if (sortField) {
            params.sortField = sortField;
            params.sortOrder = sortOrder;
        }

        this.loading.set(true);

        this.requestsService.api('GET', 'engines/engines', {
            query: {
                page,
                limit,
                search: s || undefined,
                sortField: sortField || undefined,
                sortOrder: sortField ? sortOrder : undefined,
            }
        }).subscribe({
            next: (res) => {
                this.engines.set(res.body?.['engines'] ?? []);
                this.totalRecords.set(res.body?.['total'] ?? 0);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load engines',
                    life: 4000,
                });
            }
        });
    }

    onGlobalFilter(event: Event) {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.searchText.set(value);

        // simple debounce
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.dt.first = 0;         // reset to first page on new search
            this.loadEngines({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadEngines({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    openNew() {
        this.engine = {};
        this.submitted = false;
        this.engineDialog = true;
    }

    editEngine(product: Engine) {
        this.engine = { ...product };
        this.engineDialog = true;
    }

    hideDialog() {
        this.engineDialog = false;
        this.submitted = false;
    }

    deleteEngine(engine: Engine) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${engine.code}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.requestsService
                    .api('DELETE', 'engines/engines', { body: { ids: [engine.id] } })
                    .subscribe({
                        next: () => {
                            this.engines.set(this.engines().filter((val) => val.id !== engine.id));
                            this.engine = {} as any;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Engine Deleted',
                                life: 3000,
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete engine',
                                life: 4000,
                            });
                        },
                    });
            },
        });
    }

    deleteSelectedEngines() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected engines?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedEngines ?? [];
                if (!selected.length) return;

                const ids = selected.map(m => m.id);

                this.requestsService.api('DELETE', 'engines/engines', { body: { ids } }).subscribe({
                    next: () => {
                        // remove from UI list
                        this.engines.set(this.engines().filter(m => !ids.includes(m.id)));

                        // clear selection + current engine
                        this.selectedEngines = null;
                        this.engine = {} as any;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Engines Deleted',
                            life: 3000,
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: err?.message ?? 'Could not delete selected engines',
                            life: 4000,
                        });
                    },
                });
            },
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.engines().length; i++) {
            if (this.engines()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    createId(): string {
        let id = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    getSeverity(status: string) {
        switch (status) {
            case 'INSTOCK':
                return 'success';
            case 'LOWSTOCK':
                return 'warn';
            case 'OUTOFSTOCK':
                return 'danger';
            default:
                return 'info';
        }
    }

    async saveEngine() {
        this.submitted = true;

        try {
            const payload = {
                code: this.engine.code,
                configuration: this.engine.configuration,
                displacementLiters: this.engine.displacementLiters,
                displacementCc: this.engine.displacementCc,
                cylinders: this.engine.cylinders,
                fuelType: this.engine.fuelType,
                aspiration: this.engine.aspiration,
                powerPs: this.engine.powerPs,
                powerKw: this.engine.powerKw,
                torqueNm: this.engine.torqueNm,
                torqueLbft: this.engine.torqueLbft,
            };

            // UPDATE
            if (this.engine.id) {
                const res: any = await this.requestsService
                    .api('PATCH', 'engines/engines', {
                        ids: this.engine.id,
                        body: payload,
                    })
                    .toPromise();

                this.engine = res?.body?.engine ?? this.engine;
            }

            // CREATE
            else {
                const res: any = await this.requestsService
                    .api('POST', 'engines/engines', {
                        body: payload,
                    })
                    .toPromise();

                this.engine = res?.body?.engine ?? this.engine;
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Engine saved successfully',
            });

            this.engineDialog = false;
            this.refreshCurrentPage();

        } catch (e: any) {
            console.error(e);
            this.messageService.add({
                severity: 'error',
                summary: 'Save failed',
                detail: e?.message || 'Something went wrong',
            });
        }
    }
}
