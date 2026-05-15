import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../../core/auth/auth.service';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        RippleModule,
        ToastModule,
        AppFloatingConfigurator
    ],
    providers: [MessageService],
    templateUrl: './forgot-password.html'
})
export class ForgotPassword {
    email = '';
    loading = false;

    constructor(
        private auth: AuthService,
        private messageService: MessageService
    ) { }

    onEnter(ev: KeyboardEvent) {
        if (ev.key === 'Enter') this.onSubmit();
    }

    onSubmit() {
        if (!this.email) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing email',
                detail: 'Email is required.',
                life: 3000
            });
            return;
        }

        this.loading = true;

        this.auth.forgotPassword({ Email: this.email }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Check your email',
                    detail: 'If an account exists, a reset link has been sent.',
                    life: 5000
                });
            },
            error: (err) => {
                const msg =
                    err?.error?.error ||
                    err?.error ||
                    err?.message ||
                    'Could not send reset email.';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Request failed',
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
