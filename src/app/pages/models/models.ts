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
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { finalize } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

export interface Model {
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

// ===== Catalog Builder Types =====
type UIKey = string;

type IdName = { id?: string; name?: string };

type EnginePick = {
    id?: string;
    code?: string;
    fuelType?: string;
    powerKw?: number;
    powerPs?: number;
    torqueNm?: number;
    torqueLbft?: number;
};

type MakePick = { id: string; name: string };

type MakeOption =
    | (MakePick & { __kind?: 'make' })
    | { __kind: 'loadMore'; label: string }
    | { __kind: 'noMore'; label: string };

type TransmissionPick = { id?: string; label?: string; type?: string; gears?: number };
type DrivetrainPick = { id?: string; label?: string; type?: string; description?: string };

type CatalogSpec = {
    fuelType?: string;
    powerPsOverride?: number;
    powerKwOverride?: number;
    torqueNmOverride?: number;
    torqueLbftOverride?: number;
    topSpeedKmh?: number;
    zeroTo100?: number;
    curbWeightKg?: number;
    trunkLiters?: number;
    data?: any;
};

type CatalogConfig = {
    id?: string;
    __key: UIKey;
    year?: number | null;

    engine?: EnginePick | string;
    transmission?: TransmissionPick | string;
    transmissionGears?: number | null;
    drivetrain?: DrivetrainPick | string;

    engineDetails: Partial<EnginePick>;
    showSpec?: boolean;
    spec: Partial<CatalogSpec>;
    specJson?: string;
};

type CatalogVersion = {
    id?: string;
    __key: UIKey;
    name?: string;
    startYear?: number | null;
    endYear?: number | null;
    phaseName?: string | null;
    phaseId?: string | null;
    configs: CatalogConfig[];
};

type CatalogBodyVariant = {
    id?: string;
    __key: UIKey;
    name?: string;
    doors?: number | null;
    wheelbaseMm?: number | null;
    notes?: string | null;
    bodyType?: IdName | string;
    versions: CatalogVersion[];
};

type CatalogPhase = {
    id?: string;
    __key: UIKey;
    name?: string;
    startYear?: number | null;
    endYear?: number | null;
};

type CatalogGeneration = {
    id?: string;
    __key: UIKey;
    name?: string;
    startYear?: number | null;
    endYear?: number | null;
    phases: CatalogPhase[];
    bodyVariants: CatalogBodyVariant[];
};

type CatalogRoot = {
    make: MakePick | string;
    model: {
        id?: string;
        name?: string;
    };
    generations: CatalogGeneration[];
};

type Pager<T> = {
    // state
    q: string;
    page: number;
    limit: number;
    loading: boolean;
    hasMore: boolean;
    items: T[];

    // methods
    search: (ev: any) => void;
    more: () => void;
    hoverStart: () => void;
    hoverEnd: () => void;
};


@Component({
    selector: 'models',
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
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        AutoCompleteModule,
        FileUploadModule,
        TooltipModule,
        DividerModule,
        InputNumberModule,
        TabsModule
    ],
    templateUrl: './models.html',
    providers: [MessageService, ConfirmationService, RequestsService, CountryService]
})
export class Models implements OnInit {

    catalogStep: 'gen' | 'ph' | 'bv' | 'ver' | 'cfg' = 'gen';

    selectedGen: CatalogGeneration | null = null;
    selectedBv: CatalogBodyVariant | null = null;
    selectedVer: CatalogVersion | null = null;
    selectedCfg: CatalogConfig | null = null;

    // dialogs + forms
    genDialog = false;
    phaseDialog = false;
    bvDialog = false;
    verDialog = false;
    cfgDialog = false;

    genForm!: CatalogGeneration;
    phaseForm!: CatalogPhase;
    bvForm!: CatalogBodyVariant;
    verForm!: CatalogVersion;
    cfgForm!: CatalogConfig;

    // selecting rows
    selectGen(g: CatalogGeneration | null) {
        this.selectedGen = g;
        this.selectedBv = null;
        this.selectedVer = null;

        if (g) this.catalogStep = 'ph';
    }

    selectBv(bv: CatalogBodyVariant | null) {
        this.selectedBv = bv;
        this.selectedVer = null;

        if (bv) this.catalogStep = 'ver';
    }

    selectVer(v: CatalogVersion | null) {
        this.selectedVer = v;

        if (v) this.catalogStep = 'cfg';
    }

    // stable local keys for tables
    private keyCounter = 0;
    private key() { return 'k_' + (++this.keyCounter); }

    // ===== Dialog state =====
    catalogDialog = false;
    catalogSubmitted = false;

    genSubmitted = false;
    phaseSubmitted = false;
    bvSubmitted = false;
    verSubmitted = false;
    cfgSubmitted = false;

    catalog: CatalogRoot = this.newCatalog();

    // ===== Autocomplete suggestions =====
    makeSuggestions: MakeOption[] = [];
    makeLoading = false;
    makeHasMore = true;
    // Make infinite scroll state
    makePage = 1;
    makeLimit = 5;
    makeQuery = '';


    bodyTypeSuggestions: any[] = [];
    bodyTypeLoading = false;

    engineSuggestions: EnginePick[] = [];
    engineLoading = false;

    transmissionSuggestions: any[] = [];
    transmissionLoading = false;

    drivetrainSuggestions: any[] = [];
    drivetrainLoading = false;

    modelDialog: boolean = false;

    model!: Model;
    models = signal<Model[]>([]);

    selectedModels!: Model[] | null;
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
        private countryService: CountryService,
        private cdr: ChangeDetectorRef,
    ) { }

    exportCSV() {
        this.dt.exportCSV();
    }

    async ngOnInit() {
        const countries = await this.countryService.getCountries();
        this.autoValue = countries.map(c => c.name);

        this.requestsService.api('GET', 'models/models').subscribe(res => {
            this.models.set(res.body?.['models'] ?? []);
        });
    }

    loadModels(event?: TableLazyLoadEvent | { first: number; rows: number }) {
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

        this.requestsService.api('GET', 'models/models', {
            query: {
                page,
                limit,
                search: s || undefined,
                sortField: sortField || undefined,
                sortOrder: sortField ? sortOrder : undefined,
            }
        }).subscribe({
            next: (res) => {
                this.models.set(res.body?.['models'] ?? []);
                this.totalRecords.set(res.body?.['total'] ?? 0);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load models',
                    life: 4000,
                });
            }
        });
    }

    openCatalogBuilder(modelId?: string) {
        // reset UI selection state
        this.catalogStep = 'gen';
        this.selectedGen = null;
        this.selectedBv = null;
        this.selectedVer = null;

        // NEW catalog
        if (!modelId) {
            this.catalog = this.newCatalog();
            this.catalogDialog = true;
            return;
        }

        // EDIT / VIEW existing catalog
        this.loading.set(true);

        this.requestsService.api('GET', `models/models/${modelId}`, {
            query: { includeCatalog: true }
        }).subscribe({
            next: (res) => {
                const m = res.body?.['model'];

                // map backend -> builder format
                this.catalog = this.mapModelToCatalog(m);

                this.catalogDialog = true;
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Load failed',
                    detail: 'Could not load model catalog',
                    life: 4000,
                });
            }
        });
    }

    private mapModelToCatalog(m: any): CatalogRoot {
        const key = () => this.key();

        return {
            make: m?.make ? { id: m.make.id, name: m.make.name } : '',
            model: { id: m?.id, name: m?.name ?? '' },

            generations: (m?.generations ?? []).map((g: any): CatalogGeneration => ({
                id: g.id,
                __key: key(),
                name: g.name ?? '',
                startYear: g.startYear ?? null,
                endYear: g.endYear ?? null,

                phases: (g.phases ?? []).map((ph: any): CatalogPhase => ({
                    id: ph.id,
                    __key: key(),
                    name: ph.name ?? '',
                    startYear: ph.startYear ?? null,
                    endYear: ph.endYear ?? null,
                })),

                bodyVariants: (g.bodyVariants ?? []).map((bv: any): CatalogBodyVariant => ({
                    id: bv.id,
                    __key: key(),
                    name: bv.name ?? '',
                    doors: bv.doors ?? null,
                    wheelbaseMm: bv.wheelbaseMm ?? null,
                    notes: bv.notes ?? null,

                    // IMPORTANT: make it object so autocomplete (field="name") displays correctly
                    bodyType: bv.bodyType
                        ? { id: bv.bodyType.id, name: bv.bodyType.name }
                        : (bv.bodyTypeId ? { id: bv.bodyTypeId, name: bv.bodyTypeName ?? '' } : ''),

                    versions: (bv.versions ?? []).map((v: any): CatalogVersion => ({
                        id: v.id,
                        __key: key(),
                        name: v.name ?? '',
                        startYear: v.startYear ?? null,
                        endYear: v.endYear ?? null,

                        // IMPORTANT: your select uses optionValue="name"
                        phaseName: v.phase?.name ?? v.phaseName ?? null,
                        phaseId: v.phaseId ?? null,

                        configs: (v.configs ?? []).map((c: any): CatalogConfig => ({
                            id: c.id,
                            __key: key(),
                            year: c.year ?? null,

                            // IMPORTANT: make it object so autocomplete (field="code") displays correctly
                            engine: c.engine
                                ? {
                                    id: c.engine.id,
                                    code: c.engine.code,
                                    fuelType: c.engine.fuelType,
                                    powerKw: c.engine.powerKw,
                                    powerPs: c.engine.powerPs,
                                    torqueNm: c.engine.torqueNm,
                                    torqueLbft: c.engine.torqueLbft,
                                }
                                : '',

                            // IMPORTANT: make it object so autocomplete (field="label") displays correctly
                            transmission: c.transmission
                                ? {
                                    id: c.transmission.id,
                                    type: c.transmission.type,
                                    gears: c.transmission.gears,
                                    label:
                                        c.transmission.label ??
                                        `${c.transmission.type ?? ''}${c.transmission.gears ? ' • ' + c.transmission.gears + ' gears' : ''}`.trim(),
                                }
                                : '',

                            drivetrain: c.drivetrain
                                ? {
                                    id: c.drivetrain.id,
                                    type: c.drivetrain.type,
                                    description: c.drivetrain.description,
                                    label: c.drivetrain.label ?? `${c.drivetrain.type ?? ''}`.trim(),
                                }
                                : '',

                            engineDetails: {},

                            showSpec: !!c.spec,
                            spec: c.spec
                                ? {
                                    topSpeedKmh: c.spec.topSpeedKmh,
                                    zeroTo100: c.spec.zeroTo100,
                                    curbWeightKg: c.spec.curbWeightKg,
                                    trunkLiters: c.spec.trunkLiters,
                                    powerPsOverride: c.spec.powerPsOverride,
                                    powerKwOverride: c.spec.powerKwOverride,
                                    torqueNmOverride: c.spec.torqueNmOverride,
                                    torqueLbftOverride: c.spec.torqueLbftOverride,
                                    fuelType: c.spec.fuelType,
                                }
                                : {},

                            specJson: c.spec?.data ? JSON.stringify(c.spec.data, null, 2) : '',
                        })),
                    })),
                })),
            })),
        };
    }

    onGlobalFilter(event: Event) {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.searchText.set(value);

        // simple debounce
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.dt.first = 0;         // reset to first page on new search
            this.loadModels({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadModels({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    openNew() {
        this.model = {};
        this.submitted = false;
        this.modelDialog = true;
    }

    hideDialog() {
        this.modelDialog = false;
        this.submitted = false;
        this.selectedImageFile = null;
    }

    deleteModel(model: Model) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${model.name}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.requestsService
                    .api('DELETE', 'models/models', { body: { ids: [model.id] } })
                    .subscribe({
                        next: () => {
                            this.models.set(this.models().filter((val) => val.id !== model.id));
                            this.model = {} as any;

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Model Deleted',
                                life: 3000,
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete model',
                                life: 4000,
                            });
                        },
                    });
            },
        });
    }

    deleteSelectedModels() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected models?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = this.selectedModels ?? [];
                if (!selected.length) return;

                const ids = selected.map(m => m.id);

                this.requestsService.api('DELETE', 'models/models', { body: { ids } }).subscribe({
                    next: () => {
                        // remove from UI list
                        this.models.set(this.models().filter(m => !ids.includes(m.id)));

                        // clear selection + current model
                        this.selectedModels = null;
                        this.model = {} as any;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Models Deleted',
                            life: 3000,
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: err?.message ?? 'Could not delete selected models',
                            life: 4000,
                        });
                    },
                });
            },
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.models().length; i++) {
            if (this.models()[i].id === id) {
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

    async saveModel() {
        this.submitted = true;

        try {
            if (this.model.id) {

                if (this.selectedImageFile) {
                    // send multipart (image + fields)
                    const fd = new FormData();
                    fd.append('name', this.model.name || '');
                    fd.append('country', this.model.country || '');
                    fd.append('image', this.selectedImageFile);

                    const res: any = await this.requestsService
                        .api('PATCH', 'models/models', {
                            ids: this.model.id,
                            body: fd
                        })
                        .toPromise();

                    this.model = res?.body?.model ?? this.model;
                }

                else {
                    // send JSON (no image)
                    await this.requestsService
                        .api('PATCH', 'models/models', {
                            ids: this.model.id,
                            body: {
                                name: this.model.name,
                                country: this.model.country
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
                    fd.append('name', this.model.name || '');
                    fd.append('country', this.model.country || '');
                    fd.append('image', this.selectedImageFile);

                    const createRes: any = await this.requestsService
                        .api('POST', 'models/models/with-image', { body: fd })
                        .toPromise();

                    const created = createRes?.body?.model;
                    if (created) this.model = created; // optional
                } else {
                    // No image: your existing JSON create endpoint
                    await this.requestsService
                        .api('POST', 'models/models', {
                            body: { name: this.model.name, country: this.model.country }
                        })
                        .toPromise();
                }
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Model saved successfully',
            });

            this.modelDialog = false;
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

    closeCatalogBuilder() {
        this.catalogDialog = false;
        this.catalogSubmitted = false;
    }

    newCatalog(): CatalogRoot {
        return {
            make: '',
            model: { name: '' },
            generations: [],
        };
    }

    addGeneration() {
        this.catalog.generations.push({
            __key: this.key(),
            name: '',
            startYear: null,
            endYear: null,
            phases: [],
            bodyVariants: [],
        });
    }

    removeGeneration(i: number) {
        this.catalog.generations.splice(i, 1);
    }

    onEngineSelect(e: any) {
        const eng = e?.value;
        if (!eng) return;

        // Fill the "Engine details" section automatically
        this.cfgForm.engineDetails = {
            fuelType: eng.fuelType ?? null,
            powerKw: eng.powerKw ?? null,
            powerPs: eng.powerPs ?? null,
            torqueNm: eng.torqueNm ?? null,
            torqueLbft: eng.torqueLbft ?? null,
        };
    }

    async saveCatalog() {
        this.catalogSubmitted = true;

        // minimal validation
        const makeName = this.pickText(this.catalog.make, 'name');
        if (!makeName) {
            this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Make is required' });
            return;
        }
        if (!this.catalog.model?.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Model name is required' });
            return;
        }

        try {
            const payload = this.toUpsertPayload(this.catalog);

            // 👇 adjust this path to your real upsert endpoint
            // e.g. POST catalog/models/full-upsert
            const res: any = await this.requestsService
                .api('POST', 'models/catalog/models/full', { body: payload })
                .toPromise();

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Catalog upsert completed',
            });

            this.catalogDialog = false;
            this.catalogSubmitted = false;

            // optional: refresh list page if needed
            // this.refreshCurrentPage();
        } catch (e: any) {
            console.error(e);
            this.messageService.add({
                severity: 'error',
                summary: 'Save failed',
                detail: e?.message || 'Something went wrong',
            });
        }
    }

    private toUpsertPayload(cat: CatalogRoot) {
        const makeObj = this.pickObj(cat.make);
        const makeName = this.pickText(cat.make, 'name');

        return {
            make: makeObj?.id ? { id: makeObj.id, name: makeObj.name } : { name: makeName },
            model: {
                id: cat.model.id,
                name: cat.model.name?.trim(),
            },
            generations: (cat.generations ?? []).map(gen => ({
                id: gen.id,
                name: gen.name?.trim(),
                startYear: gen.startYear ?? null,
                endYear: gen.endYear ?? null,

                phases: (gen.phases ?? []).map(ph => ({
                    id: ph.id,
                    name: ph.name?.trim(),
                    startYear: ph.startYear ?? null,
                    endYear: ph.endYear ?? null,
                })),

                bodyVariants: (gen.bodyVariants ?? []).map(bv => {
                    const btObj = this.pickObj(bv.bodyType);
                    const btName = this.pickText(bv.bodyType, 'name');

                    return {
                        id: bv.id,
                        name: bv.name?.trim(),
                        doors: bv.doors ?? null,
                        wheelbaseMm: bv.wheelbaseMm ?? null,
                        notes: bv.notes ?? null,

                        // server expects bodyType {name} (or id)
                        bodyType: btObj?.id ? { id: btObj.id, name: btObj.name } : { name: btName },

                        versions: (bv.versions ?? []).map(v => ({
                            id: v.id,
                            name: v.name?.trim(),
                            startYear: v.startYear ?? null,
                            endYear: v.endYear ?? null,
                            phaseName: v.phaseName ?? null,

                            configs: (v.configs ?? []).map(cfg => {

                                const engineObj = this.pickObj(cfg.engine);
                                const engineCode = this.pickText(cfg.engine, 'code') || (typeof cfg.engine === 'string' ? cfg.engine : '');

                                const transObj = this.pickObj(cfg.transmission);
                                const driveObj = this.pickObj(cfg.drivetrain);

                                const spec = this.normalizeSpec(cfg);

                                // Transmission type
                                const transType =
                                    transObj?.type ||
                                    (typeof cfg.transmission === 'string'
                                        ? cfg.transmission.trim()
                                        : '') ||
                                    this.pickText(cfg.transmission, 'type');

                                // Transmission gears
                                const gears =
                                    cfg.transmissionGears ??
                                    transObj?.gears ??
                                    undefined;

                                return {
                                    id: cfg.id,
                                    year: cfg.year ?? null,

                                    engine: engineObj?.id
                                        ? { id: engineObj.id }
                                        : engineCode
                                            ? {
                                                code: engineCode,
                                                ...this.stripUndef({
                                                    fuelType: cfg.engineDetails?.fuelType,
                                                    powerKw: cfg.engineDetails?.powerKw,
                                                    powerPs: cfg.engineDetails?.powerPs,
                                                    torqueNm: cfg.engineDetails?.torqueNm,
                                                }),
                                            }
                                            : null,

                                    transmission: transObj?.id
                                        ? { id: transObj.id }
                                        : transType
                                            ? this.stripUndef({
                                                type: transType,
                                                gears,
                                            })
                                            : null,

                                    drivetrain: driveObj?.id
                                        ? { id: driveObj.id }
                                        : (typeof cfg.drivetrain === 'string' &&
                                            cfg.drivetrain.trim())
                                            ? { type: cfg.drivetrain.trim() }
                                            : null,

                                    spec,
                                };
                            }),
                        })),
                    };
                }),
            })),
        };
    }

    // GENERATION CRUD
    openGenDialog(g?: CatalogGeneration) {
        this.genSubmitted = false;

        this.genForm = g
            ? { ...g }
            : {
                __key: this.key(),
                name: '',
                startYear: null,
                endYear: null,
                phases: [],
                bodyVariants: [],
            };

        this.genDialog = true;
    }

    saveGen() {
        this.genSubmitted = true;
        this.cdr.detectChanges();

        const nameOk = !!this.genForm.name?.trim();
        const startOk = this.genForm.startYear != null;
        const endOk = this.genForm.endYear != null;

        if (!nameOk || !startOk || !endOk) return;

        if ((this.genForm.startYear as number) > (this.genForm.endYear as number)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid years',
                detail: 'Start year cannot be greater than end year',
                life: 4000,
            });
            return;
        }

        const idx = this.catalog.generations.findIndex(x => x.__key === this.genForm.__key);
        if (idx >= 0) this.catalog.generations[idx] = { ...this.catalog.generations[idx], ...this.genForm };
        else this.catalog.generations.push(this.genForm);

        this.genDialog = false;
        this.genSubmitted = false;
    }

    closeGenDialog() {
        this.genDialog = false;
        this.genSubmitted = false;
    }

    removeGen(g: any) {
        this.catalog.generations = this.catalog.generations.filter((x: any) => x.__key !== g.__key);
        if (this.selectedGen?.__key === g.__key) this.selectGen(null);
    }

    //PHASE CRUD
    openPhaseDialog(ph?: CatalogPhase) {
        if (!this.selectedGen) return;

        this.phaseSubmitted = false; // reset validation state

        this.phaseForm = ph
            ? { ...ph }
            : { __key: this.key(), name: '', startYear: null, endYear: null };

        this.phaseDialog = true;
    }

    savePhase() {
        if (!this.selectedGen) return;
        if (!this.phaseForm.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Phase name required' });
            return;
        }

        this.selectedGen.phases = this.selectedGen.phases || [];
        const idx = this.selectedGen.phases.findIndex((x: any) => x.__key === this.phaseForm.__key);
        if (idx >= 0) this.selectedGen.phases[idx] = this.phaseForm;
        else this.selectedGen.phases.push(this.phaseForm);

        this.phaseDialog = false;
        this.phaseSubmitted = false;
    }

    removePhase(ph: any) {
        if (!this.selectedGen) return;
        this.selectedGen.phases = (this.selectedGen.phases || []).filter((x: any) => x.__key !== ph.__key);
    }

    // BODY VARIANT CRUD
    openBvDialog(bv?: CatalogBodyVariant) {
        if (!this.selectedGen) return;

        this.bvSubmitted = false;

        this.bvForm = bv
            ? { ...bv }
            : { __key: this.key(), name: '', doors: null, bodyType: '', versions: [] };

        this.bvDialog = true;
    }

    saveBv() {
        if (!this.selectedGen) return;

        this.bvSubmitted = true;

        const nameOk = !!this.bvForm.name?.trim();
        const doorsOk = this.bvForm.doors != null;
        const bodyTypeName = this.pickText(this.bvForm.bodyType, 'name');
        const bodyTypeOk = !!bodyTypeName;

        if (!nameOk || !doorsOk || !bodyTypeOk) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'All fields are required (name, doors, body type).',
                life: 3000
            });
            return;
        }

        this.selectedGen.bodyVariants = this.selectedGen.bodyVariants || [];

        const idx = this.selectedGen.bodyVariants.findIndex(
            x => x.__key === this.bvForm.__key
        );

        if (idx >= 0)
            this.selectedGen.bodyVariants[idx] = {
                ...this.selectedGen.bodyVariants[idx],
                ...this.bvForm
            };
        else
            this.selectedGen.bodyVariants.push(this.bvForm);

        this.bvDialog = false;
        this.bvSubmitted = false;
    }

    removeBv(bv: any) {
        if (!this.selectedGen) return;
        this.selectedGen.bodyVariants = (this.selectedGen.bodyVariants || []).filter((x: any) => x.__key !== bv.__key);
        if (this.selectedBv?.__key === bv.__key) this.selectBv(null);
    }

    // VERSION CRUD
    openVerDialog(v?: CatalogVersion) {
        if (!this.selectedBv) return;

        this.verSubmitted = false;

        this.verForm = v
            ? { ...v }
            : {
                __key: this.key(),
                name: '',
                phaseName: null,
                startYear: null,
                endYear: null,
                configs: []
            };

        this.verDialog = true;
    }

    saveVer() {
        if (!this.selectedBv) return;

        this.verSubmitted = true;

        const nameOk = !!this.verForm.name?.trim();
        const phaseOk = !!this.verForm.phaseName;

        if (!nameOk || !phaseOk) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'Version name and phase are required',
                life: 3000
            });
            return;
        }

        this.selectedBv.versions = this.selectedBv.versions || [];

        const idx = this.selectedBv.versions.findIndex(
            x => x.__key === this.verForm.__key
        );

        if (idx >= 0)
            this.selectedBv.versions[idx] = {
                ...this.selectedBv.versions[idx],
                ...this.verForm
            };
        else
            this.selectedBv.versions.push(this.verForm);

        this.verDialog = false;
        this.verSubmitted = false;
    }

    removeVer(v: any) {
        if (!this.selectedBv) return;
        this.selectedBv.versions = (this.selectedBv.versions || []).filter((x: any) => x.__key !== v.__key);
        if (this.selectedVer?.__key === v.__key) this.selectVer(null);
    }

    // CONFIG CRUD
    openCfgDialog(cfg?: CatalogConfig) {
        if (!this.selectedVer) return;

        this.cfgSubmitted = false;

        if (cfg) {
            const engineObj = (cfg.engine && typeof cfg.engine === 'object') ? cfg.engine : null;
            const tObj = (cfg.transmission && typeof cfg.transmission === 'object') ? cfg.transmission : null;

            this.cfgForm = {
                ...cfg,
                engineDetails: engineObj
                    ? {
                        fuelType: engineObj.fuelType,
                        powerKw: engineObj.powerKw,
                        powerPs: engineObj.powerPs,
                        torqueNm: engineObj.torqueNm,
                        torqueLbft: engineObj.torqueLbft,
                    }
                    : { ...(cfg.engineDetails ?? {}) },
                spec: { ...(cfg.spec ?? {}) },
                specJson: cfg.specJson ?? '',
                showSpec: cfg.showSpec ?? false,
                transmissionGears: cfg.transmissionGears ?? tObj?.gears ?? null, // ✅

            };
        } else {
            this.cfgForm = {
                __key: this.key(),
                year: null,
                engine: '',
                transmission: '',
                transmissionGears: null,
                drivetrain: '',
                engineDetails: {},
                showSpec: false,
                spec: {},
                specJson: '',
            };
        }

        this.cfgDialog = true;
    }

    saveCfg() {
        if (!this.selectedVer) return;

        this.cfgSubmitted = true;

        const yearOk = this.cfgForm.year != null;

        const engineCode = this.pickText(this.cfgForm.engine, 'code');
        const engineObj = this.pickObj(this.cfgForm.engine);
        const engineOk = !!engineObj?.id || !!engineCode;

        const transObj = this.pickObj(this.cfgForm.transmission);
        const transLabel = this.pickText(this.cfgForm.transmission, 'label') || (typeof this.cfgForm.transmission === 'string' ? this.cfgForm.transmission.trim() : '');
        const transmissionOk = !!transObj?.id || !!transLabel;

        const driveObj = this.pickObj(this.cfgForm.drivetrain);
        const driveLabel = this.pickText(this.cfgForm.drivetrain, 'label') || (typeof this.cfgForm.drivetrain === 'string' ? this.cfgForm.drivetrain.trim() : '');
        const drivetrainOk = !!driveObj?.id || !!driveLabel;

        if (!yearOk || !engineOk || !transmissionOk || !drivetrainOk) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'Year, engine, transmission and drivetrain are required.',
                life: 3000,
            });
            return;
        }

        // keep specs optional, but validate JSON if provided
        if (this.cfgForm.specJson?.trim()) {
            try {
                JSON.parse(this.cfgForm.specJson);
            } catch {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Invalid JSON',
                    detail: 'Spec JSON is not valid JSON.',
                    life: 3000,
                });
                return;
            }
        }

        this.selectedVer.configs = this.selectedVer.configs || [];

        const idx = this.selectedVer.configs.findIndex(x => x.__key === this.cfgForm.__key);
        if (idx >= 0) this.selectedVer.configs[idx] = { ...this.selectedVer.configs[idx], ...this.cfgForm };
        else this.selectedVer.configs.push(this.cfgForm);

        this.cfgDialog = false;
        this.cfgSubmitted = false;
    }

    removeCfg(cfg: any) {
        if (!this.selectedVer) return;
        this.selectedVer.configs = (this.selectedVer.configs || []).filter((x: any) => x.__key !== cfg.__key);
    }

    // HELPERS
    normalizeSpec(cfg: CatalogConfig) {
        const hasAny =
            cfg.specJson?.trim() ||
            Object.values(cfg.spec ?? {}).some(v => v !== undefined && v !== null && v !== '');

        if (!hasAny) return null;

        let data: any = undefined;
        if (cfg.specJson?.trim()) {
            try {
                data = JSON.parse(cfg.specJson);
            } catch {
                // invalid JSON -> fail early
                throw new Error('Invalid JSON in spec JSON field');
            }
        }

        return this.stripUndef({
            ...cfg.spec,
            data: data ?? cfg.spec?.data,
        });
    }

    pickObj(val: any): any | null {
        return val && typeof val === 'object' ? val : null;
    }

    pickText(val: any, key: string): string {
        if (!val) return '';
        if (typeof val === 'string') return val.trim();
        if (typeof val === 'object') return String(val?.[key] ?? '').trim();
        return '';
    }

    stripUndef<T extends Record<string, any>>(obj: T): T {
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
        return out;
    }

    createPager<T>(
        fetchFn: (q: string, page: number, limit: number) => any, // Observable
        mapRows: (res: any) => T[],
        mapTotal?: (res: any) => number | undefined,
        limit = 20
    ): Pager<T> {
        let hoverTimer: any = null;

        const p: Pager<T> = {
            q: '',
            page: 1,
            limit,
            loading: false,
            hasMore: true,
            items: [],

            search: (ev: any) => {
                p.q = (ev?.query || '').trim();
                p.page = 1;
                p.items = [];
                p.hasMore = true;
                p.more(); // load first page
            },

            more: () => {
                if (p.loading) return;
                if (!p.hasMore) return;

                p.loading = true;

                fetchFn(p.q, p.page, p.limit).subscribe({
                    next: (res: any) => {
                        const rows = mapRows(res);
                        p.items = [...p.items, ...rows];

                        const total = mapTotal?.(res);
                        if (typeof total === 'number') {
                            p.hasMore = p.items.length < total;
                        } else {
                            p.hasMore = rows.length === p.limit;
                        }

                        if (p.hasMore) p.page += 1;
                    },
                    error: () => {
                        p.hasMore = false;
                    },
                    complete: () => {
                        p.loading = false;
                        // keep this because your RequestsService sometimes updates outside Angular
                        this.cdr.detectChanges();
                    },
                });
            },

            hoverStart: () => {
                if (hoverTimer) return;
                hoverTimer = setTimeout(() => {
                    hoverTimer = null;
                    p.more();
                }, 450);
            },

            hoverEnd: () => {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            },
        };

        return p;
    }

    onTransmissionSelect(ev: any) {
        const t = ev?.value ?? ev;
        if (t?.gears != null) this.cfgForm.transmissionGears = t.gears;
    }

    makePager = this.createPager<MakePick>(
        (q, page, limit) => this.requestsService.api('GET', 'makes/makes', { query: { search: q, page, limit } }),
        (res) => (res.body?.['makes'] ?? []).map((m: any) => ({ id: m.id, name: m.name })),
        (res) => res.body?.['total'],
        10
    );

    drivetrainPager = this.createPager<any>(
        (q, page, limit) => this.requestsService.api('GET', 'drivetrains/drivetrains', { query: { search: q, page, limit } }),
        (res) => (res.body?.['drivetrains'] ?? []).map((d: any) => ({
            ...d,
            label: d.label ?? `${d.type ?? 'Drivetrain'}${d.description ? ' • ' + d.description : ''}`,
        })),
        (res) => res.body?.['total'],
        10
    );

    bodyTypePager = this.createPager<any>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'body-types/body-types', {
                query: { search: q, page, limit },
            }),
        (res) => res.body?.['bodyTypes'] ?? [],
        (res) => res.body?.['total'], // if your backend doesn't return total, it's fine
        10
    );

    enginePager = this.createPager<EnginePick>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'engines/engines', {
                query: { search: q, page, limit },
            }),
        (res) => res.body?.['engines'] ?? [],
        (res) => res.body?.['total'],
        10
    );

    transmissionPager = this.createPager<any>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'transmissions/transmissions', {
                query: { search: q, page, limit },
            }),
        (res) => {
            const list = res.body?.['transmissions'] ?? [];
            return list.map((t: any) => ({
                ...t,
                label: t.label ?? `${t.type ?? 'Transmission'}${t.gears ? ' • ' + t.gears + ' gears' : ''}`,
            }));
        },
        (res) => res.body?.['total'],
        10
    );

}
