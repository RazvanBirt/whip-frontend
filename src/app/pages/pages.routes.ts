import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { MyGarage } from './garage/my-garage';
import { Makes } from './makes/makes';
import { Models } from './models/models';
import { Engines } from './engines/engines';
import { BodyTypes } from './bodyTypes/bodyTypes';
import { Transmissions } from './transmissions/transmissions';
import { Drivetrains } from './drivetrains/drivetrains';
import { CarDashboard } from './car-dashboard/car-dashboard';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'my-garage', component: MyGarage },
    { path: 'my-garage/:carId', component: CarDashboard },

    { path: 'makes', component: Makes },
    { path: 'models', component: Models },
    { path: 'body-types', component: BodyTypes },
    { path: 'engines', component: Engines },
    { path: 'transmissions', component: Transmissions },
    { path: 'drivetrains', component: Drivetrains },

    { path: '**', redirectTo: '/notfound' },
] as Routes;
