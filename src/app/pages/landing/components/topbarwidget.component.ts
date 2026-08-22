import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';

@Component({
    selector: 'topbar-widget',
    standalone: true,
    imports: [
        RouterModule,
        ButtonModule,
        AppFloatingConfigurator
    ],
    template: `
        <header
            class="relative z-20 w-full max-w-7xl mx-auto
                   flex items-center justify-between
                   px-6 lg:px-8 py-6"
        >
            <!-- Brand -->
            <a
                routerLink="/landing"
                class="flex items-center gap-3 no-underline"
            >
                <div
                    class="w-10 h-10 rounded-xl
                           bg-primary text-primary-contrast
                           flex items-center justify-center
                           font-bold text-lg"
                >
                    W
                </div>

                <span
                    class="text-xl font-semibold tracking-tight
                           text-surface-900 dark:text-surface-0"
                >
                    WHIP
                </span>
            </a>

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <app-floating-configurator [float]="false" />

                <button
                    pButton
                    type="button"
                    label="Login"
                    routerLink="/auth/login"
                    [text]="true"
                    severity="secondary"
                ></button>

                <button
                    pButton
                    type="button"
                    label="Get started"
                    routerLink="/auth/register"
                ></button>
            </div>
        </header>
    `
})
export class TopbarWidget { }
