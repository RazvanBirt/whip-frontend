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
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
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

type TransmissionPick = {
    id?: string;
    label?: string;
    type?: string;
    gears?: number | null;
};

type DrivetrainPick = {
    id?: string;
    label?: string;
    type?: string;
    description?: string;
};

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
    q: string;
    page: number;
    limit: number;
    loading: boolean;
    hasMore: boolean;
    items: T[];

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

    // stable local keys for tables
    private keyCounter = 0;

    private key() {
        return 'k_' + ++this.keyCounter;
    }

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

    modelDialog = false;

    model!: Model;
    models = signal<Model[]>([]);

    selectedModels!: Model[] | null;
    submitted = false;

    autoValue: string[] = [];
    autoFilteredValue: string[] = [];

    selectedAutoValue: any = null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    totalRecords = signal<number>(0);
    loading = signal<boolean>(false);

    searchText = signal<string>('');

    private searchTimer: any = null;
    private selectedImageFile: File | null = null;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private requestsService: RequestsService,
        private countryService: CountryService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        const countries = await this.countryService.getCountries();
        this.autoValue = countries.map((c) => c.name);

        this.requestsService.api('GET', 'models/models').subscribe((res) => {
            const body = this.bodyData(res);
            this.models.set(body?.models ?? []);
            this.totalRecords.set(body?.total ?? 0);
        });
    }

    // --------------------
    // Response helpers
    // --------------------

    private bodyData(res: any) {
        return res?.body?.data ?? res?.body ?? res;
    }

    private rowsFrom<T = any>(res: any, key: string): T[] {
        const body = this.bodyData(res);
        return body?.[key] ?? [];
    }

    private totalFrom(res: any) {
        const body = this.bodyData(res);
        return body?.total;
    }

    // --------------------
    // Table/list logic
    // --------------------

    exportCSV() {
        this.dt.exportCSV();
    }

    loadModels(event?: TableLazyLoadEvent | { first: number; rows: number }) {
        const first = (event as any)?.first ?? 0;
        const rows = (event as any)?.rows ?? 5;

        const page = Math.floor(first / rows) + 1;
        const limit = rows;

        const sortField = (event as any)?.sortField;
        const sortOrder = (event as any)?.sortOrder === -1 ? 'desc' : 'asc';

        const s = this.searchText().trim();

        this.loading.set(true);

        this.requestsService
            .api('GET', 'models/models', {
                query: {
                    page,
                    limit,
                    search: s || undefined,
                    sortField: sortField || undefined,
                    sortOrder: sortField ? sortOrder : undefined
                }
            })
            .subscribe({
                next: (res) => {
                    const body = this.bodyData(res);
                    this.models.set(body?.models ?? []);
                    this.totalRecords.set(body?.total ?? 0);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Load failed',
                        detail: 'Could not load models',
                        life: 4000
                    });
                }
            });
    }

    onGlobalFilter(event: Event) {
        const value = (event.target as HTMLInputElement).value ?? '';
        this.searchText.set(value);

        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.dt.first = 0;
            this.loadModels({ first: 0, rows: this.dt.rows });
        }, 250);
    }

    refreshCurrentPage() {
        this.loadModels({ first: this.dt.first ?? 0, rows: this.dt.rows ?? 5 });
    }

    // --------------------
    // Catalog builder root
    // --------------------

    openCatalogBuilder(modelId?: string) {
        this.catalogStep = 'gen';
        this.selectedGen = null;
        this.selectedBv = null;
        this.selectedVer = null;
        this.selectedCfg = null;

        if (!modelId) {
            this.catalog = this.newCatalog();
            this.catalogDialog = true;
            return;
        }

        this.loading.set(true);

        this.requestsService
            .api('GET', `models/models/${modelId}`, {
                query: { includeCatalog: true }
            })
            .subscribe({
                next: (res) => {
                    const body = this.bodyData(res);
                    const m = body?.model;

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
                        life: 4000
                    });
                }
            });
    }

    closeCatalogBuilder() {
        this.catalogDialog = false;
        this.catalogSubmitted = false;
    }

    newCatalog(): CatalogRoot {
        return {
            make: '',
            model: { name: '' },
            generations: []
        };
    }

    private mapModelToCatalog(m: any): CatalogRoot {
        const key = () => this.key();

        return {
            make: m?.make ? { id: m.make.id, name: m.make.name } : '',
            model: { id: m?.id, name: m?.name ?? '' },

            generations: (m?.generations ?? []).map(
                (g: any): CatalogGeneration => ({
                    id: g.id,
                    __key: key(),
                    name: g.name ?? '',
                    startYear: g.startYear ?? null,
                    endYear: g.endYear ?? null,

                    phases: (g.phases ?? []).map(
                        (ph: any): CatalogPhase => ({
                            id: ph.id,
                            __key: key(),
                            name: ph.name ?? '',
                            startYear: ph.startYear ?? null,
                            endYear: ph.endYear ?? null
                        })
                    ),

                    bodyVariants: (g.bodyVariants ?? []).map(
                        (bv: any): CatalogBodyVariant => ({
                            id: bv.id,
                            __key: key(),
                            name: bv.name ?? '',
                            doors: bv.doors ?? null,
                            wheelbaseMm: bv.wheelbaseMm ?? null,
                            notes: bv.notes ?? null,

                            bodyType: bv.bodyType
                                ? { id: bv.bodyType.id, name: bv.bodyType.name }
                                : bv.bodyTypeId
                                    ? { id: bv.bodyTypeId, name: bv.bodyTypeName ?? '' }
                                    : '',

                            versions: (bv.versions ?? []).map(
                                (v: any): CatalogVersion => ({
                                    id: v.id,
                                    __key: key(),
                                    name: v.name ?? '',
                                    startYear: v.startYear ?? null,
                                    endYear: v.endYear ?? null,

                                    phaseName: v.phase?.name ?? v.phaseName ?? null,
                                    phaseId: v.phaseId ?? null,

                                    configs: (v.configs ?? []).map(
                                        (c: any): CatalogConfig => ({
                                            id: c.id,
                                            __key: key(),
                                            year: c.year ?? null,

                                            engine: c.engine
                                                ? {
                                                    id: c.engine.id,
                                                    code: c.engine.code,
                                                    fuelType: c.engine.fuelType,
                                                    powerKw: c.engine.powerKw,
                                                    powerPs: c.engine.powerPs,
                                                    torqueNm: c.engine.torqueNm,
                                                    torqueLbft: c.engine.torqueLbft
                                                }
                                                : '',

                                            transmission: c.transmission
                                                ? {
                                                    id: c.transmission.id,
                                                    type: c.transmission.type,
                                                    gears: c.transmission.gears,
                                                    label:
                                                        c.transmission.label ??
                                                        this.transmissionLabel(c.transmission)
                                                }
                                                : '',

                                            transmissionGears:
                                                c.transmission?.gears ?? null,

                                            drivetrain: c.drivetrain
                                                ? {
                                                    id: c.drivetrain.id,
                                                    type: c.drivetrain.type,
                                                    description:
                                                        c.drivetrain.description,
                                                    label:
                                                        c.drivetrain.label ??
                                                        this.drivetrainLabel(c.drivetrain)
                                                }
                                                : '',

                                            engineDetails: {},

                                            showSpec: !!c.spec,
                                            spec: c.spec
                                                ? {
                                                    topSpeedKmh: c.spec.topSpeedKmh,
                                                    zeroTo100: c.spec.zeroTo100,
                                                    curbWeightKg:
                                                        c.spec.curbWeightKg,
                                                    trunkLiters:
                                                        c.spec.trunkLiters,
                                                    powerPsOverride:
                                                        c.spec.powerPsOverride,
                                                    powerKwOverride:
                                                        c.spec.powerKwOverride,
                                                    torqueNmOverride:
                                                        c.spec.torqueNmOverride,
                                                    torqueLbftOverride:
                                                        c.spec.torqueLbftOverride,
                                                    fuelType: c.spec.fuelType
                                                }
                                                : {},

                                            specJson: c.spec?.data
                                                ? JSON.stringify(c.spec.data, null, 2)
                                                : ''
                                        })
                                    )
                                })
                            )
                        })
                    )
                })
            )
        };
    }

    // --------------------
    // Selection steps
    // --------------------

    selectGen(g: CatalogGeneration | null) {
        this.selectedGen = g;
        this.selectedBv = null;
        this.selectedVer = null;
        this.selectedCfg = null;

        if (g) this.catalogStep = 'ph';
    }

    selectBv(bv: CatalogBodyVariant | null) {
        this.selectedBv = bv;
        this.selectedVer = null;
        this.selectedCfg = null;

        if (bv) this.catalogStep = 'ver';
    }

    selectVer(v: CatalogVersion | null) {
        this.selectedVer = v;
        this.selectedCfg = null;

        if (v) this.catalogStep = 'cfg';
    }

    // --------------------
    // Model CRUD
    // --------------------

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
                            this.models.set(
                                this.models().filter((val) => val.id !== model.id)
                            );
                            this.model = {} as any;

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Model Deleted',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail: err?.message ?? 'Could not delete model',
                                life: 4000
                            });
                        }
                    });
            }
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

                const ids = selected.map((m) => m.id);

                this.requestsService
                    .api('DELETE', 'models/models', { body: { ids } })
                    .subscribe({
                        next: () => {
                            this.models.set(
                                this.models().filter((m) => !ids.includes(m.id))
                            );

                            this.selectedModels = null;
                            this.model = {} as any;

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Models Deleted',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Delete failed',
                                detail:
                                    err?.message ?? 'Could not delete selected models',
                                life: 4000
                            });
                        }
                    });
            }
        });
    }

    async saveModel() {
        this.submitted = true;

        try {
            if (this.model.id) {
                if (this.selectedImageFile) {
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

                    const body = this.bodyData(res);
                    this.model = body?.model ?? this.model;
                } else {
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
            } else {
                if (this.selectedImageFile) {
                    const fd = new FormData();
                    fd.append('name', this.model.name || '');
                    fd.append('country', this.model.country || '');
                    fd.append('image', this.selectedImageFile);

                    const createRes: any = await this.requestsService
                        .api('POST', 'models/models/with-image', { body: fd })
                        .toPromise();

                    const body = this.bodyData(createRes);
                    const created = body?.model;
                    if (created) this.model = created;
                } else {
                    await this.requestsService
                        .api('POST', 'models/models', {
                            body: {
                                name: this.model.name,
                                country: this.model.country
                            }
                        })
                        .toPromise();
                }
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Model saved successfully'
            });

            this.modelDialog = false;
            this.selectedImageFile = null;

            this.refreshCurrentPage();
        } catch (e: any) {
            console.error(e);
            this.messageService.add({
                severity: 'error',
                summary: 'Save failed',
                detail: e?.message || 'Something went wrong'
            });
        }
    }

    // --------------------
    // Catalog save
    // --------------------

    async saveCatalog() {
        this.catalogSubmitted = true;

        const makeName = this.pickText(this.catalog.make, 'name');

        if (!makeName) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'Make is required'
            });
            return;
        }

        if (!this.catalog.model?.name?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'Model name is required'
            });
            return;
        }

        try {
            const payload = this.toUpsertPayload(this.catalog);

            await this.requestsService
                .api('POST', 'models/catalog/models/full', { body: payload })
                .toPromise();

            this.messageService.add({
                severity: 'success',
                summary: 'Saved',
                detail: 'Catalog upsert completed'
            });

            this.catalogDialog = false;
            this.catalogSubmitted = false;
        } catch (e: any) {
            console.error(e);
            this.messageService.add({
                severity: 'error',
                summary: 'Save failed',
                detail: e?.message || 'Something went wrong'
            });
        }
    }

    private toUpsertPayload(cat: CatalogRoot) {
        const makeObj = this.pickObj(cat.make);
        const makeName = this.pickText(cat.make, 'name');

        return {
            make: makeObj?.id
                ? { id: makeObj.id, name: makeObj.name }
                : { name: makeName },
            model: {
                id: cat.model.id,
                name: cat.model.name?.trim()
            },
            generations: (cat.generations ?? []).map((gen) => ({
                id: gen.id,
                name: gen.name?.trim(),
                startYear: gen.startYear ?? null,
                endYear: gen.endYear ?? null,

                phases: (gen.phases ?? []).map((ph) => ({
                    id: ph.id,
                    name: ph.name?.trim(),
                    startYear: ph.startYear ?? null,
                    endYear: ph.endYear ?? null
                })),

                bodyVariants: (gen.bodyVariants ?? []).map((bv) => {
                    const btObj = this.pickObj(bv.bodyType);
                    const btName = this.pickText(bv.bodyType, 'name');

                    return {
                        id: bv.id,
                        name: bv.name?.trim(),
                        doors: bv.doors ?? null,
                        wheelbaseMm: bv.wheelbaseMm ?? null,
                        notes: bv.notes ?? null,

                        bodyType: btObj?.id
                            ? { id: btObj.id, name: btObj.name }
                            : { name: btName },

                        versions: (bv.versions ?? []).map((v) => ({
                            id: v.id,
                            name: v.name?.trim(),
                            startYear: v.startYear ?? null,
                            endYear: v.endYear ?? null,
                            phaseName: v.phaseName ?? null,

                            configs: (v.configs ?? []).map((cfg) => {
                                const engineObj = this.pickObj(cfg.engine);
                                const engineCode =
                                    this.pickText(cfg.engine, 'code') ||
                                    (typeof cfg.engine === 'string'
                                        ? cfg.engine.trim()
                                        : '');

                                const transObj = this.pickObj(cfg.transmission);
                                const driveObj = this.pickObj(cfg.drivetrain);

                                const spec = this.normalizeSpec(cfg);

                                const transType =
                                    transObj?.type ||
                                    (typeof cfg.transmission === 'string'
                                        ? cfg.transmission.trim()
                                        : '') ||
                                    this.pickText(cfg.transmission, 'type');

                                const gears =
                                    cfg.transmissionGears ??
                                    transObj?.gears ??
                                    null;

                                const drivetrainType =
                                    driveObj?.type ||
                                    (typeof cfg.drivetrain === 'string'
                                        ? cfg.drivetrain.trim()
                                        : '') ||
                                    this.pickText(cfg.drivetrain, 'type');

                                return {
                                    id: cfg.id,
                                    year: cfg.year ?? null,

                                    engine: engineObj?.id
                                        ? { id: engineObj.id }
                                        : engineCode
                                            ? {
                                                code: engineCode,
                                                ...this.stripUndef({
                                                    fuelType:
                                                        cfg.engineDetails?.fuelType,
                                                    powerKw:
                                                        cfg.engineDetails?.powerKw,
                                                    powerPs:
                                                        cfg.engineDetails?.powerPs,
                                                    torqueNm:
                                                        cfg.engineDetails?.torqueNm
                                                })
                                            }
                                            : null,

                                    /**
                                     * Important after Prisma cleanup:
                                     * Transmission uniqueness is type + gears.
                                     * If an existing transmission is selected, send id.
                                     * If free text is used, send both type and gears.
                                     *
                                     * gears = 0 is valid for CVT/eCVT.
                                     */
                                    transmission: transObj?.id
                                        ? { id: transObj.id }
                                        : transType
                                            ? this.stripUndef({
                                                type: transType,
                                                gears
                                            })
                                            : null,

                                    drivetrain: driveObj?.id
                                        ? { id: driveObj.id }
                                        : drivetrainType
                                            ? { type: this.normalizeDrivetrainType(drivetrainType) }
                                            : null,

                                    spec
                                };
                            })
                        }))
                    };
                })
            }))
        };
    }

    // --------------------
    // Generation CRUD
    // --------------------

    addGeneration() {
        this.catalog.generations.push({
            __key: this.key(),
            name: '',
            startYear: null,
            endYear: null,
            phases: [],
            bodyVariants: []
        });
    }

    removeGeneration(i: number) {
        this.catalog.generations.splice(i, 1);
    }

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
                bodyVariants: []
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
                life: 4000
            });
            return;
        }

        const idx = this.catalog.generations.findIndex(
            (x) => x.__key === this.genForm.__key
        );

        if (idx >= 0) {
            this.catalog.generations[idx] = {
                ...this.catalog.generations[idx],
                ...this.genForm
            };
        } else {
            this.catalog.generations.push(this.genForm);
        }

        this.genDialog = false;
        this.genSubmitted = false;
    }

    closeGenDialog() {
        this.genDialog = false;
        this.genSubmitted = false;
    }

    removeGen(g: any) {
        this.catalog.generations = this.catalog.generations.filter(
            (x: any) => x.__key !== g.__key
        );

        if (this.selectedGen?.__key === g.__key) this.selectGen(null);
    }

    // --------------------
    // Phase CRUD
    // --------------------

    openPhaseDialog(ph?: CatalogPhase) {
        if (!this.selectedGen) return;

        this.phaseSubmitted = false;

        this.phaseForm = ph
            ? { ...ph }
            : { __key: this.key(), name: '', startYear: null, endYear: null };

        this.phaseDialog = true;
    }

    savePhase() {
        if (!this.selectedGen) return;

        if (!this.phaseForm.name?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail: 'Phase name required'
            });
            return;
        }

        this.selectedGen.phases = this.selectedGen.phases || [];

        const idx = this.selectedGen.phases.findIndex(
            (x: any) => x.__key === this.phaseForm.__key
        );

        if (idx >= 0) this.selectedGen.phases[idx] = this.phaseForm;
        else this.selectedGen.phases.push(this.phaseForm);

        this.phaseDialog = false;
        this.phaseSubmitted = false;
    }

    removePhase(ph: any) {
        if (!this.selectedGen) return;

        this.selectedGen.phases = (this.selectedGen.phases || []).filter(
            (x: any) => x.__key !== ph.__key
        );
    }

    // --------------------
    // Body Variant CRUD
    // --------------------

    openBvDialog(bv?: CatalogBodyVariant) {
        if (!this.selectedGen) return;

        this.bvSubmitted = false;

        this.bvForm = bv
            ? { ...bv }
            : {
                __key: this.key(),
                name: '',
                doors: null,
                bodyType: '',
                versions: []
            };

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
            (x) => x.__key === this.bvForm.__key
        );

        if (idx >= 0) {
            this.selectedGen.bodyVariants[idx] = {
                ...this.selectedGen.bodyVariants[idx],
                ...this.bvForm
            };
        } else {
            this.selectedGen.bodyVariants.push(this.bvForm);
        }

        this.bvDialog = false;
        this.bvSubmitted = false;
    }

    removeBv(bv: any) {
        if (!this.selectedGen) return;

        this.selectedGen.bodyVariants = (
            this.selectedGen.bodyVariants || []
        ).filter((x: any) => x.__key !== bv.__key);

        if (this.selectedBv?.__key === bv.__key) this.selectBv(null);
    }

    // --------------------
    // Version CRUD
    // --------------------

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
            (x) => x.__key === this.verForm.__key
        );

        if (idx >= 0) {
            this.selectedBv.versions[idx] = {
                ...this.selectedBv.versions[idx],
                ...this.verForm
            };
        } else {
            this.selectedBv.versions.push(this.verForm);
        }

        this.verDialog = false;
        this.verSubmitted = false;
    }

    removeVer(v: any) {
        if (!this.selectedBv) return;

        this.selectedBv.versions = (this.selectedBv.versions || []).filter(
            (x: any) => x.__key !== v.__key
        );

        if (this.selectedVer?.__key === v.__key) this.selectVer(null);
    }

    // --------------------
    // Config CRUD
    // --------------------

    openCfgDialog(cfg?: CatalogConfig) {
        if (!this.selectedVer) return;

        this.cfgSubmitted = false;

        if (cfg) {
            const engineObj =
                cfg.engine && typeof cfg.engine === 'object' ? cfg.engine : null;

            const tObj =
                cfg.transmission && typeof cfg.transmission === 'object'
                    ? cfg.transmission
                    : null;

            this.cfgForm = {
                ...cfg,
                engineDetails: engineObj
                    ? {
                        fuelType: engineObj.fuelType,
                        powerKw: engineObj.powerKw,
                        powerPs: engineObj.powerPs,
                        torqueNm: engineObj.torqueNm,
                        torqueLbft: engineObj.torqueLbft
                    }
                    : { ...(cfg.engineDetails ?? {}) },
                spec: { ...(cfg.spec ?? {}) },
                specJson: cfg.specJson ?? '',
                showSpec: cfg.showSpec ?? false,
                transmissionGears: cfg.transmissionGears ?? tObj?.gears ?? null
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
                specJson: ''
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
        const transText =
            this.pickText(this.cfgForm.transmission, 'label') ||
            this.pickText(this.cfgForm.transmission, 'type') ||
            (typeof this.cfgForm.transmission === 'string'
                ? this.cfgForm.transmission.trim()
                : '');

        const transmissionHasGears =
            this.cfgForm.transmissionGears !== null &&
            this.cfgForm.transmissionGears !== undefined;

        const transmissionOk =
            !!transObj?.id || (!!transText && transmissionHasGears);

        const driveObj = this.pickObj(this.cfgForm.drivetrain);
        const driveText =
            this.pickText(this.cfgForm.drivetrain, 'label') ||
            this.pickText(this.cfgForm.drivetrain, 'type') ||
            (typeof this.cfgForm.drivetrain === 'string'
                ? this.cfgForm.drivetrain.trim()
                : '');

        const drivetrainOk = !!driveObj?.id || !!driveText;

        if (!yearOk || !engineOk || !transmissionOk || !drivetrainOk) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing',
                detail:
                    'Year, engine, transmission, transmission gears and drivetrain are required.',
                life: 3000
            });
            return;
        }

        if (this.cfgForm.specJson?.trim()) {
            try {
                JSON.parse(this.cfgForm.specJson);
            } catch {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Invalid JSON',
                    detail: 'Spec JSON is not valid JSON.',
                    life: 3000
                });
                return;
            }
        }

        this.selectedVer.configs = this.selectedVer.configs || [];

        const idx = this.selectedVer.configs.findIndex(
            (x) => x.__key === this.cfgForm.__key
        );

        if (idx >= 0) {
            this.selectedVer.configs[idx] = {
                ...this.selectedVer.configs[idx],
                ...this.cfgForm
            };
        } else {
            this.selectedVer.configs.push(this.cfgForm);
        }

        this.cfgDialog = false;
        this.cfgSubmitted = false;
    }

    removeCfg(cfg: any) {
        if (!this.selectedVer) return;

        this.selectedVer.configs = (this.selectedVer.configs || []).filter(
            (x: any) => x.__key !== cfg.__key
        );
    }

    onEngineSelect(e: any) {
        const eng = e?.value;
        if (!eng) return;

        this.cfgForm.engineDetails = {
            fuelType: eng.fuelType ?? null,
            powerKw: eng.powerKw ?? null,
            powerPs: eng.powerPs ?? null,
            torqueNm: eng.torqueNm ?? null,
            torqueLbft: eng.torqueLbft ?? null
        };
    }

    onTransmissionSelect(ev: any) {
        const t = ev?.value ?? ev;

        if (t?.gears !== null && t?.gears !== undefined) {
            this.cfgForm.transmissionGears = Number(t.gears);
        }
    }

    // --------------------
    // Helpers
    // --------------------

    normalizeSpec(cfg: CatalogConfig) {
        const hasAny =
            cfg.specJson?.trim() ||
            Object.values(cfg.spec ?? {}).some(
                (v) => v !== undefined && v !== null && v !== ''
            );

        if (!hasAny) return null;

        let data: any = undefined;

        if (cfg.specJson?.trim()) {
            try {
                data = JSON.parse(cfg.specJson);
            } catch {
                throw new Error('Invalid JSON in spec JSON field');
            }
        }

        return this.stripUndef({
            ...cfg.spec,
            data: data ?? cfg.spec?.data
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

        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined) out[k] = v;
        }

        return out;
    }

    private transmissionLabel(t: any) {
        if (!t) return '';

        const type = t.type ?? '';

        if (t.gears === null || t.gears === undefined) {
            return type;
        }

        const gears = Number(t.gears);

        if (gears <= 0) {
            return type;
        }

        return `${type} • ${gears} gears`;
    }

    private drivetrainLabel(d: any) {
        if (!d) return '';

        return `${d.type ?? 'Drivetrain'}${d.description ? ' • ' + d.description : ''}`;
    }

    /**
     * Keep drivetrain catalog simple after schema cleanup.
     * These aliases may come from old data, imports, or pasted seed content.
     */
    private normalizeDrivetrainType(type: string) {
        switch (type) {
            case 'AWD_quattro':
            case 'AWD_xDrive':
            case 'AWD_4Matic':
            case 'AWD_Haldex':
            case 'AWD_Performance':
                return 'AWD';

            case 'RWD_Performance':
                return 'RWD';

            default:
                return type;
        }
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
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 5; i++) {
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

    // --------------------
    // Generic pagers
    // --------------------

    createPager<T>(
        fetchFn: (q: string, page: number, limit: number) => any,
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
                p.more();
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
                        this.cdr.detectChanges();
                    }
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
            }
        };

        return p;
    }

    makePager = this.createPager<MakePick>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'makes/makes', {
                query: { search: q, page, limit }
            }),
        (res) =>
            this.rowsFrom<any>(res, 'makes').map((m: any) => ({
                id: m.id,
                name: m.name
            })),
        (res) => this.totalFrom(res),
        10
    );

    drivetrainPager = this.createPager<any>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'drivetrains/drivetrains', {
                query: { search: q, page, limit }
            }),
        (res) =>
            this.rowsFrom<any>(res, 'drivetrains').map((d: any) => ({
                ...d,
                label: d.label ?? this.drivetrainLabel(d)
            })),
        (res) => this.totalFrom(res),
        10
    );

    bodyTypePager = this.createPager<any>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'body-types/body-types', {
                query: { search: q, page, limit }
            }),
        (res) => this.rowsFrom<any>(res, 'bodyTypes'),
        (res) => this.totalFrom(res),
        10
    );

    enginePager = this.createPager<EnginePick>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'engines/engines', {
                query: { search: q, page, limit }
            }),
        (res) => this.rowsFrom<EnginePick>(res, 'engines'),
        (res) => this.totalFrom(res),
        10
    );

    transmissionPager = this.createPager<any>(
        (q, page, limit) =>
            this.requestsService.api('GET', 'transmissions/transmissions', {
                query: { search: q, page, limit }
            }),
        (res) => {
            const list = this.rowsFrom<any>(res, 'transmissions');

            return list.map((t: any) => ({
                ...t,
                label: t.label ?? this.transmissionLabel(t)
            }));
        },
        (res) => this.totalFrom(res),
        10
    );
}
