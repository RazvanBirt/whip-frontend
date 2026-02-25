import { Component } from '@angular/core';

@Component({
    selector: 'my-garage',
    standalone: true,
    template: ` <div class="card">
        <div class="font-semibold text-xl mb-4">My Garage</div>
        <p>Use this page to manage your garage.</p>
    </div>`
})
export class MyGarage { }
