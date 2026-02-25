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

export interface Make {
    id?: string;
    name?: string;
    country?: string;
    imageURL?: string;
    imagePath?: string;
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
    selector: 'makes',
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
    templateUrl: './makes.html',
    providers: [MessageService, ConfirmationService, RequestsService, CountryService]
})
export class Makes implements OnInit {
    makeDialog: boolean = false;

    make!: Make;
    makes = signal<Make[]>([]);

    selectedMakes!: Make[] | null;
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

    private selectedImageFile: File | null = null;

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

        this.requestsService.api('GET', 'makes/makes').subscribe(res => {
            this.makes.set(res.body?.['makes'] ?? []);
        });
    }

    loadMakes(event?: TableLazyLoadEvent | { first: number; rows: number }) {
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

        this.requestsService.api('GET', 'makes/makes', {
            query: {
                page,
                limit,
                search: s || undefined,
                sortField: sortField || undefined,
                sortOrder: sortField ? sortOrder : undefined,
            }
        }).subscribe({
            next: (res) => {
                this.makes.set(res.body?.['makes'] ?? []);
                this.totalRecords.set(res.body?.['total'] ?? 0);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load makes',
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
            this.loadMakes({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadMakes({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    openNew() {
        this.make = {};
        this.submitted = false;
        this.makeDialog = true;
    }

    async onFileSelect(event: any) {
        const file: File | null = event.files?.[0] || null;
        if (!file) return;

        // basic size sanity (bytes)
        if (file.size > 1_000_000) {
            this.messageService.add({ severity: 'warn', summary: 'Too large', detail: 'Max 1MB.', life: 3000 });
            return;
        }

        const { w, h } = await this.readImageDimensions(file);

        // dimension rules
        if (w < this.LOGO_MIN_SIZE || h < this.LOGO_MIN_SIZE) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Image too small',
                detail: `Minimum is ${this.LOGO_MIN_SIZE}x${this.LOGO_MIN_SIZE}px.`,
                life: 3500,
            });
            return;
        }

        if (w > this.LOGO_MAX_SIZE || h > this.LOGO_MAX_SIZE) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Image too large',
                detail: `Maximum is ${this.LOGO_MAX_SIZE}px on either side.`,
                life: 3500,
            });
            return;
        }

        // aspect ratio rule
        // if (!this.isAspectOk(w, h)) {
        //     this.messageService.add({
        //         severity: 'warn',
        //         summary: 'Wrong aspect ratio',
        //         detail: `Please upload a near-square logo (roughly 1:1). Yours is ${w}x${h}.`,
        //         life: 4500,
        //     });
        //     return;
        // }

        // accept file
        this.selectedImageFile = file;

        const reader = new FileReader();
        reader.onload = () => (this.make.imageURL = String(reader.result));
        reader.readAsDataURL(file);
    }

    editMake(make: Make) {
        this.make = { ...make };
        this.makeDialog = true;
    }

    hideDialog() {
        this.makeDialog = false;
        this.submitted = false;
        this.selectedImageFile = null;
    }

    deleteMake(make: Make) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${make.name}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.requestsService
                    .api('DELETE', 'makes/makes', { body: { ids: [make.id] } })
                    .subscribe({
                        next: () => {
                            this.makes.set(this.makes().filter((val) => val.id !== make.id));
                            this.make = {} as any;

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Make Deleted',
                                life: 3000,
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete make',
                                life: 4000,
                            });
                        },
                    });
            },
        });
    }

    deleteSelectedMakes() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected makes?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedMakes ?? [];
                if (!selected.length) return;

                const ids = selected.map(m => m.id);

                this.requestsService.api('DELETE', 'makes/makes', { body: { ids } }).subscribe({
                    next: () => {
                        // remove from UI list
                        this.makes.set(this.makes().filter(m => !ids.includes(m.id)));

                        // clear selection + current make
                        this.selectedMakes = null;
                        this.make = {} as any;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Makes Deleted',
                            life: 3000,
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: err?.message ?? 'Could not delete selected makes',
                            life: 4000,
                        });
                    },
                });
            },
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.makes().length; i++) {
            if (this.makes()[i].id === id) {
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

    async saveMake() {
        this.submitted = true;

        try {
            if (this.make.id) {

                if (this.selectedImageFile) {
                    // send multipart (image + fields)
                    const fd = new FormData();
                    fd.append('name', this.make.name || '');
                    fd.append('country', this.make.country || '');
                    fd.append('image', this.selectedImageFile);

                    const res: any = await this.requestsService
                        .api('PATCH', 'makes/makes', {
                            ids: this.make.id,
                            body: fd
                        })
                        .toPromise();

                    this.make = res?.body?.make ?? this.make;
                }

                else {
                    // send JSON (no image)
                    await this.requestsService
                        .api('PATCH', 'makes/makes', {
                            ids: this.make.id,
                            body: {
                                name: this.make.name,
                                country: this.make.country
                            }
                        })
                        .toPromise();
                }
            }


            // CREATE
            else {
                // If image exists: create + upload in one request
                if (this.selectedImageFile) {
                    const fd = new FormData();
                    fd.append('name', this.make.name || '');
                    fd.append('country', this.make.country || '');
                    fd.append('image', this.selectedImageFile);

                    const createRes: any = await this.requestsService
                        .api('POST', 'makes/makes/with-image', { body: fd })
                        .toPromise();

                    const created = createRes?.body?.make;
                    if (created) this.make = created; // optional
                } else {
                    // No image: your existing JSON create endpoint
                    await this.requestsService
                        .api('POST', 'makes/makes', {
                            body: { name: this.make.name, country: this.make.country }
                        })
                        .toPromise();
                }
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Make saved successfully',
            });

            this.makeDialog = false;
            this.selectedImageFile = null;

            // refresh
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

    filterCountry(event: AutoCompleteCompleteEvent) {
        const q = (event.query || '').toLowerCase().trim();

        this.autoFilteredValue = !q
            ? this.autoValue.slice(0, 20)
            : this.autoValue
                .filter(c => c.toLowerCase().includes(q))
                .slice(0, 20);
    }

    // logo rules (tweak as you like)
    private readonly LOGO_MIN_SIZE = 256;         // min width/height
    private readonly LOGO_MAX_SIZE = 2000;        // prevent huge images
    private readonly LOGO_TARGET_RATIO = 1;       // 1 = square
    private readonly LOGO_RATIO_TOLERANCE = 0.15; // allow 15% off-square (0.85–1.15)

    private async readImageDimensions(file: File): Promise<{ w: number; h: number }> {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = reject;
            r.readAsDataURL(file);
        });

        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    private isAspectOk(w: number, h: number) {
        const ratio = w / h;
        return Math.abs(ratio - this.LOGO_TARGET_RATIO) <= this.LOGO_RATIO_TOLERANCE;
    }

}
