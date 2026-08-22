import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'hero-widget',
    standalone: true,
    imports: [
        RouterModule,
        ButtonModule
    ],
    template: `
        <main class="relative min-h-[calc(100vh-88px)]">

            <!-- Dotted background -->
            <div
                class="absolute inset-0 pointer-events-none
                       text-surface-300 dark:text-surface-700 opacity-40"
                style="
                    background-image:
                        radial-gradient(circle, currentColor 1px, transparent 1px);
                    background-size: 28px 28px;
                "
            ></div>

            <!-- Fade over dots -->
            <div
                class="absolute inset-0 pointer-events-none"
                style="
                    background:
                        radial-gradient(
                            circle at center,
                            transparent 0%,
                            var(--p-surface-0) 80%
                        );
                "
            ></div>

            <!-- Primary glow -->
            <div
                class="absolute top-20 left-1/2 -translate-x-1/2
                       w-[700px] h-[500px]
                       bg-primary-300/20 dark:bg-primary-500/10
                       blur-[140px] rounded-full
                       pointer-events-none"
            ></div>

            <div
                class="relative z-10 max-w-7xl mx-auto
                       px-6 lg:px-8
                       pt-24 lg:pt-32 pb-16"
            >
                <!-- Hero -->
                <section class="max-w-4xl mx-auto text-center">

                    <div
                        class="inline-flex items-center gap-2
                               px-3 py-1.5 mb-6 rounded-full
                               border border-surface-200 dark:border-surface-700
                               bg-surface-0/70 dark:bg-surface-900/70
                               backdrop-blur"
                    >
                        <span
                            class="w-2 h-2 rounded-full bg-primary"
                        ></span>

                        <span
                            class="text-sm
                                   text-surface-600 dark:text-surface-300"
                        >
                            Your personal automotive space
                        </span>
                    </div>

                    <h1
                        class="text-5xl md:text-7xl
                               font-semibold tracking-tight
                               text-surface-950 dark:text-surface-0
                               leading-[1.05]"
                    >
                        Your garage.
                        <span class="text-primary">
                            Your cars.
                        </span>
                        One place.
                    </h1>

                    <p
                        class="max-w-2xl mx-auto mt-6
                               text-lg md:text-xl leading-relaxed
                               text-surface-600 dark:text-surface-400"
                    >
                        Keep track of your cars, explore detailed
                        specifications and build your personal digital
                        garage.
                    </p>

                    <div
                        class="flex flex-col sm:flex-row
                               justify-center gap-3 mt-8"
                    >
                        <button
                            pButton
                            type="button"
                            label="Get started"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            routerLink="/auth/register"
                            size="large"
                        ></button>

                        <button
                            pButton
                            type="button"
                            label="Login"
                            routerLink="/auth/login"
                            severity="secondary"
                            [outlined]="true"
                            size="large"
                        ></button>
                    </div>
                </section>


                <!-- Temporary content cards -->
                <section
                    class="grid grid-cols-1 md:grid-cols-3
                           gap-4 mt-20 max-w-5xl mx-auto"
                >
                    <div
                        class="p-6 rounded-2xl
                               border border-surface-200 dark:border-surface-800
                               bg-surface-0/70 dark:bg-surface-900/60
                               backdrop-blur-sm"
                    >
                        <div
                            class="w-10 h-10 rounded-xl mb-5
                                   bg-primary-100 dark:bg-primary-900/30
                                   text-primary
                                   flex items-center justify-center"
                        >
                            <i class="pi pi-car text-lg"></i>
                        </div>

                        <h3
                            class="font-semibold text-lg
                                   text-surface-900 dark:text-surface-0"
                        >
                            Your Garage
                        </h3>

                        <p
                            class="mt-2 leading-relaxed
                                   text-surface-600 dark:text-surface-400"
                        >
                            Keep your cars together in a personal
                            digital garage.
                        </p>
                    </div>


                    <div
                        class="p-6 rounded-2xl
                               border border-surface-200 dark:border-surface-800
                               bg-surface-0/70 dark:bg-surface-900/60
                               backdrop-blur-sm"
                    >
                        <div
                            class="w-10 h-10 rounded-xl mb-5
                                   bg-primary-100 dark:bg-primary-900/30
                                   text-primary
                                   flex items-center justify-center"
                        >
                            <i class="pi pi-chart-bar text-lg"></i>
                        </div>

                        <h3
                            class="font-semibold text-lg
                                   text-surface-900 dark:text-surface-0"
                        >
                            Specifications
                        </h3>

                        <p
                            class="mt-2 leading-relaxed
                                   text-surface-600 dark:text-surface-400"
                        >
                            Explore engines, transmissions and detailed
                            vehicle specifications.
                        </p>
                    </div>


                    <div
                        class="p-6 rounded-2xl
                               border border-surface-200 dark:border-surface-800
                               bg-surface-0/70 dark:bg-surface-900/60
                               backdrop-blur-sm"
                    >
                        <div
                            class="w-10 h-10 rounded-xl mb-5
                                   bg-primary-100 dark:bg-primary-900/30
                                   text-primary
                                   flex items-center justify-center"
                        >
                            <i class="pi pi-search text-lg"></i>
                        </div>

                        <h3
                            class="font-semibold text-lg
                                   text-surface-900 dark:text-surface-0"
                        >
                            Discover
                        </h3>

                        <p
                            class="mt-2 leading-relaxed
                                   text-surface-600 dark:text-surface-400"
                        >
                            Browse makes, models, generations and
                            configurations.
                        </p>
                    </div>
                </section>

            </div>
        </main>
    `
})
export class HeroWidget { }
