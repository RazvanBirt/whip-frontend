import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../../core/auth/auth.service';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        FormsModule,
        RouterModule,
        RippleModule,
        ToastModule,
        AppFloatingConfigurator
    ],
    providers: [MessageService],
    templateUrl: './register.html'
})
export class Register {
    email = '';
    password = '';
    checked = false;
    loading = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        private messageService: MessageService
    ) { }

    onEnter(ev: KeyboardEvent) {
        if (ev.key === 'Enter') this.onRegister();
    }

    onRegister() {
        if (!this.email || !this.password) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing fields',
                detail: 'Email and password are required.',
                life: 3000
            });
            return;
        }

        this.loading = true;

        this.auth.register({ Email: this.email, Password: this.password }).subscribe({
            next: () => {
                this.router.navigateByUrl('/dashboard');
            },
            error: (err) => {
                const msg =
                    err?.error?.error ||
                    err?.error ||
                    err?.message ||
                    'Could not create account';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Registration failed',
                    detail: msg,
                    life: 4000
                });

                this.loading = false;
            },
            complete: () => {
                this.loading = false;
            }
        });
    }
}
