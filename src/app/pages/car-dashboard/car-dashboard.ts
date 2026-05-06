import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';

interface CarDashboardData {
    id: string;
    nickname: string;
    make: string;
    model: string;
    trim: string;
    year: number;
    mileage: number;
    color: string;
    plate: string;
    vin: string;
    purchased: string;
    specs: {
        engine: string;
        power: string;
        torque: string;
        transmission: string;
        drivetrain: string;
        fuelType: string;
        bodyType: string;
        doors: number;
        seats: number;
        weight: string;
        acceleration: string;
        topSpeed: string;
        tankCapacity: string;
        emissions: string;
    };
    fuel: {
        avgConsumption: number;
        bestConsumption: number;
        worstConsumption: number;
        totalFuelCost: number;
        totalTrips: number;
        totalDistance: number;
    };
    monthlyConsumption: number[];
    monthlyDistance: number[];
    trips: {
        date: string;
        name: string;
        distance: number;
        avgConsumption: number;
        fuelCost: number;
    }[];
}

@Component({
    selector: 'car-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        CardModule,
        ButtonModule,
        TagModule,
        ChartModule
    ],
    templateUrl: './car-dashboard.html',
    styleUrl: './car-dashboard.scss'
})
export class CarDashboard {
    private readonly route = new ActivatedRoute();

    specsExpanded = signal(false);

    cars: CarDashboardData[] = [
        {
            id: 'bmw-330i',
            nickname: 'Daily Beast',
            make: 'BMW',
            model: '330i',
            trim: 'M Sport',
            year: 2020,
            mileage: 48250,
            color: 'Blue',
            plate: 'WHIP-330',
            vin: 'WBA5R7C00LFH12345',
            purchased: '14 Mar 2023',
            specs: {
                engine: '2.0L turbo inline-4',
                power: '255 hp',
                torque: '295 lb-ft',
                transmission: '8-speed automatic',
                drivetrain: 'RWD',
                fuelType: 'Petrol',
                bodyType: 'Sedan',
                doors: 4,
                seats: 5,
                weight: '3,582 lb',
                acceleration: '5.6 sec',
                topSpeed: '155 mph',
                tankCapacity: '15.6 gal',
                emissions: '156 g/km'
            },
            fuel: {
                avgConsumption: 31.4,
                bestConsumption: 38.2,
                worstConsumption: 24.8,
                totalFuelCost: 1420,
                totalTrips: 87,
                totalDistance: 9120
            },
            monthlyConsumption: [29.8, 31.2, 30.5, 32.7, 33.1, 31.4],
            monthlyDistance: [920, 1100, 780, 1450, 1280, 1620],
            trips: [
                { date: '02 May 2026', name: 'Lisbon to Porto', distance: 195, avgConsumption: 35.2, fuelCost: 34 },
                { date: '27 Apr 2026', name: 'Work commute week', distance: 168, avgConsumption: 30.1, fuelCost: 31 },
                { date: '20 Apr 2026', name: 'Sintra weekend', distance: 74, avgConsumption: 28.8, fuelCost: 15 },
                { date: '12 Apr 2026', name: 'Airport run', distance: 42, avgConsumption: 33.5, fuelCost: 8 }
            ]
        },
        {
            id: 'golf-gti',
            nickname: 'Pocket Rocket',
            make: 'Volkswagen',
            model: 'Golf GTI',
            trim: 'Performance',
            year: 2019,
            mileage: 61500,
            color: 'White',
            plate: 'GTI-019',
            vin: 'WVWZZZAUZKW123456',
            purchased: '21 Aug 2022',
            specs: {
                engine: '2.0L turbo inline-4',
                power: '245 hp',
                torque: '273 lb-ft',
                transmission: '7-speed DSG',
                drivetrain: 'FWD',
                fuelType: 'Petrol',
                bodyType: 'Hatchback',
                doors: 5,
                seats: 5,
                weight: '3,062 lb',
                acceleration: '6.2 sec',
                topSpeed: '155 mph',
                tankCapacity: '13.2 gal',
                emissions: '148 g/km'
            },
            fuel: {
                avgConsumption: 34.7,
                bestConsumption: 41.5,
                worstConsumption: 26.2,
                totalFuelCost: 1185,
                totalTrips: 104,
                totalDistance: 10480
            },
            monthlyConsumption: [33.4, 34.1, 35.8, 36.2, 33.9, 34.7],
            monthlyDistance: [870, 990, 1200, 1350, 1100, 1480],
            trips: [
                { date: '03 May 2026', name: 'Mountain road', distance: 112, avgConsumption: 29.4, fuelCost: 24 },
                { date: '28 Apr 2026', name: 'City errands', distance: 58, avgConsumption: 27.8, fuelCost: 13 },
                { date: '19 Apr 2026', name: 'Coastal drive', distance: 146, avgConsumption: 37.6, fuelCost: 27 }
            ]
        },
        {
            id: 'mx5',
            nickname: 'Weekend Toy',
            make: 'Mazda',
            model: 'MX-5',
            trim: 'Sport',
            year: 2022,
            mileage: 14200,
            color: 'Red',
            plate: 'MX5-FUN',
            vin: 'JM1NDAC70N0123456',
            purchased: '09 Jun 2024',
            specs: {
                engine: '2.0L naturally aspirated inline-4',
                power: '181 hp',
                torque: '151 lb-ft',
                transmission: '6-speed manual',
                drivetrain: 'RWD',
                fuelType: 'Petrol',
                bodyType: 'Roadster',
                doors: 2,
                seats: 2,
                weight: '2,341 lb',
                acceleration: '5.7 sec',
                topSpeed: '135 mph',
                tankCapacity: '11.9 gal',
                emissions: '155 g/km'
            },
            fuel: {
                avgConsumption: 36.1,
                bestConsumption: 44.3,
                worstConsumption: 27.5,
                totalFuelCost: 640,
                totalTrips: 46,
                totalDistance: 5120
            },
            monthlyConsumption: [35.2, 36.8, 37.1, 35.9, 38.4, 36.1],
            monthlyDistance: [420, 530, 690, 760, 840, 910],
            trips: [
                { date: '01 May 2026', name: 'Sunday blast', distance: 88, avgConsumption: 34.2, fuelCost: 16 },
                { date: '25 Apr 2026', name: 'Beach road', distance: 121, avgConsumption: 39.1, fuelCost: 20 },
                { date: '14 Apr 2026', name: 'Evening drive', distance: 46, avgConsumption: 32.7, fuelCost: 9 }
            ]
        }
    ];

    car = computed(() => {
        const carId = this.route.snapshot.paramMap.get('carId');
        return this.cars.find((car) => car.id === carId) ?? this.cars[0];
    });

    fuelChartData = computed(() => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'MPG',
                data: this.car().monthlyConsumption,
                tension: 0.4,
                fill: false
            }
        ]
    }));

    distanceChartData = computed(() => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Miles',
                data: this.car().monthlyDistance
            }
        ]
    }));

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'var(--text-color)'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'var(--text-color-secondary)'
                },
                grid: {
                    color: 'var(--surface-border)'
                }
            },
            y: {
                ticks: {
                    color: 'var(--text-color-secondary)'
                },
                grid: {
                    color: 'var(--surface-border)'
                }
            }
        }
    };

    toggleSpecs() {
        this.specsExpanded.update((value) => !value);
    }
}
