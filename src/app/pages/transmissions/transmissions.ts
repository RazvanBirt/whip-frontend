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
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { CountryService } from '../service/country.service';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { TableLazyLoadEvent } from 'primeng/table';

export interface Transmission {
    id?: string;
    type?: string;
    gears?: string;
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
    selector: 'transmissions',
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
    templateUrl: './transmissions.html',
    providers: [MessageService, ConfirmationService, RequestsService, CountryService]
})
export class Transmissions implements OnInit {
    transmissionDialog: boolean = false;
    transmission!: Transmission;
    transmissions = signal<Transmission[]>([]);

    selectedTransmissions!: Transmission[] | null;
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

        this.requestsService.api('GET', 'transmissions').subscribe(res => {
            this.transmissions.set(res.body?.['transmissions'] ?? []);
        });
    }

    loadTransmissions(event?: TableLazyLoadEvent | { first: number; rows: number }) {
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

        this.requestsService.api('GET', 'body-types', {
            query: {
                page,
                limit,
                search: s || undefined,
                sortField: sortField || undefined,
                sortOrder: sortField ? sortOrder : undefined,
            }
        }).subscribe({
            next: (res) => {
                this.transmissions.set(res.body?.['transmissions'] ?? []);
                this.totalRecords.set(res.body?.['total'] ?? 0);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load transmissions',
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
            this.loadTransmissions({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadTransmissions({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    openNew() {
        this.transmission = {};
        this.submitted = false;
        this.transmissionDialog = true;
    }

    editTransmission(transmission: Transmission) {
        this.transmission = { ...transmission };
        this.transmissionDialog = true;
    }

    hideDialog() {
        this.transmissionDialog = false;
        this.submitted = false;
    }

    deleteTransmission(transmission: Transmission) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${transmission.type}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.requestsService
                    .api('DELETE', 'transmissions', { body: { ids: [transmission.id] } })
                    .subscribe({
                        next: () => {
                            this.transmissions.set(this.transmissions().filter((val) => val.id !== transmission.id));
                            this.transmission = {} as any;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Transmission Deleted',
                                life: 3000,
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete transmission',
                                life: 4000,
                            });
                        },
                    });
            },
        });
    }

    deleteSelectedTransmissions() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected transmissions?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedTransmissions ?? [];
                if (!selected.length) return;

                const ids = selected.map(m => m.id);

                this.requestsService.api('DELETE', 'transmissions', { body: { ids } }).subscribe({
                    next: () => {
                        // remove from UI list
                        this.transmissions.set(this.transmissions().filter(m => !ids.includes(m.id)));

                        // clear selection + current transmission
                        this.selectedTransmissions = null;
                        this.transmission = {} as any;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Transmissions Deleted',
                            life: 3000,
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: err?.message ?? 'Could not delete selected transmissions',
                            life: 4000,
                        });
                    },
                });
            },
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.transmissions().length; i++) {
            if (this.transmissions()[i].id === id) {
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

    async saveTransmission() {
        this.submitted = true;

        try {
            const payload = {
                type: this.transmission.type,
                gears: this.transmission.gears,
            };

            // UPDATE
            if (this.transmission.id) {
                const res: any = await this.requestsService
                    .api('PATCH', 'transmissions', {
                        ids: this.transmission.id,
                        body: payload,
                    })
                    .toPromise();

                this.transmission = res?.body?.transmission ?? this.transmission;
            }

            // CREATE
            else {
                const res: any = await this.requestsService
                    .api('POST', 'transmissions', {
                        body: payload,
                    })
                    .toPromise();

                this.transmission = res?.body?.transmission ?? this.transmission;
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Transmission saved successfully',
            });

            this.transmissionDialog = false;
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
