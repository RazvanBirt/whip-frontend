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

export interface Drivetain {
    id?: string;
    type?: string;
    description?: string;
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
    selector: 'drivetrains',
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
    templateUrl: './drivetrains.html',
    providers: [MessageService, ConfirmationService, RequestsService, CountryService]
})
export class Drivetrains implements OnInit {
    drivetrainDialog: boolean = false;
    drivetrain!: Drivetain;
    drivetrains = signal<Drivetain[]>([]);

    selectedDrivetrains!: Drivetain[] | null;
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

        this.requestsService.api('GET', 'drivetrains').subscribe(res => {
            this.drivetrains.set(res.body?.['drivetrains'] ?? []);
        });
    }

    loadDrivetrains(event?: TableLazyLoadEvent | { first: number; rows: number }) {
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

        this.requestsService.api('GET', 'drivetrains', {
            query: {
                page,
                limit,
                search: s || undefined,
                sortField: sortField || undefined,
                sortOrder: sortField ? sortOrder : undefined,
            }
        }).subscribe({
            next: (res) => {
                this.drivetrains.set(res.body?.['drivetrains'] ?? []);
                this.totalRecords.set(res.body?.['total'] ?? 0);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load drivetrains',
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
            this.loadDrivetrains({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadDrivetrains({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    openNew() {
        this.drivetrain = {};
        this.submitted = false;
        this.drivetrainDialog = true;
    }

    editDrivetrain(drivetrain: Drivetain) {
        this.drivetrain = { ...drivetrain };
        this.drivetrainDialog = true;
    }

    hideDialog() {
        this.drivetrainDialog = false;
        this.submitted = false;
    }

    deleteDrivetrain(drivetrain: Drivetain) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${drivetrain.type}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.requestsService
                    .api('DELETE', 'drivetrains', { body: { ids: [drivetrain.id] } })
                    .subscribe({
                        next: () => {
                            this.drivetrains.set(this.drivetrains().filter((val) => val.id !== drivetrain.id));
                            this.drivetrain = {} as any;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Drivetrain Deleted',
                                life: 3000,
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete drivetrain',
                                life: 4000,
                            });
                        },
                    });
            },
        });
    }

    deleteSelectedDrivetrains() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected drivetrains?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedDrivetrains ?? [];
                if (!selected.length) return;

                const ids = selected.map(m => m.id);

                this.requestsService.api('DELETE', 'drivetrains', { body: { ids } }).subscribe({
                    next: () => {
                        // remove from UI list
                        this.drivetrains.set(this.drivetrains().filter(m => !ids.includes(m.id)));

                        // clear selection + current drivetrain
                        this.selectedDrivetrains = null;
                        this.drivetrain = {} as any;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Drivetrains Deleted',
                            life: 3000,
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: err?.message ?? 'Could not delete selected drivetrains',
                            life: 4000,
                        });
                    },
                });
            },
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.drivetrains().length; i++) {
            if (this.drivetrains()[i].id === id) {
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

    async saveDrivetrain() {
        this.submitted = true;

        try {
            const payload = {
                type: this.drivetrain.type,
                description: this.drivetrain.description,
            };

            // UPDATE
            if (this.drivetrain.id) {
                const res: any = await this.requestsService
                    .api('PATCH', 'drivetrains', {
                        ids: this.drivetrain.id,
                        body: payload,
                    })
                    .toPromise();

                this.drivetrain = res?.body?.drivetrain ?? this.drivetrain;
            }

            // CREATE
            else {
                const res: any = await this.requestsService
                    .api('POST', 'drivetrains', {
                        body: payload,
                    })
                    .toPromise();

                this.drivetrain = res?.body?.drivetrain ?? this.drivetrain;
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Drivetrain saved successfully',
            });

            this.drivetrainDialog = false;
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
