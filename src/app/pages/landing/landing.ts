import { Component } from '@angular/core';

import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        TopbarWidget,
        HeroWidget
    ],
    template: `
        <div
            class="relative min-h-screen overflow-hidden
                   bg-surface-0 dark:bg-surface-950"
        >
            <topbar-widget />

            <hero-widget />
        </div>
    `
})
export class Landing { }
