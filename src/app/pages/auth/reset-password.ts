import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        ToastModule,
        AppFloatingConfigurator
    ],
    providers: [MessageService],
    template: `
        <app-floating-configurator />

        <p-toast />

        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 rounded-2xl shadow">
                    <div class="text-center mb-8">
                        <div class="mb-8">
                            <p class="text-primary font-semibold mb-2">Set new password</p>

                            <h2 class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-2">
                                Choose a new password
                            </h2>

                            <p class="text-muted-color m-0">
                                Your reset link was accepted. Enter your new password below.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            New password
                        </label>

                        <p-password
                            id="password"
                            [(ngModel)]="password"
                            placeholder="New password"
                            [toggleMask]="true"
                            styleClass="mb-4 w-full"
                            inputStyleClass="w-full"
                            [feedback]="true"
                        />

                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">
                            Confirm password
                        </label>

                        <p-password
                            id="confirmPassword"
                            [(ngModel)]="confirmPassword"
                            placeholder="Confirm password"
                            [toggleMask]="true"
                            styleClass="mb-8 w-full"
                            inputStyleClass="w-full"
                            [feedback]="false"
                            (keydown)="onEnter($event)"
                        />

                        <p-button
                            label="Reset password"
                            styleClass="w-full mb-4"
                            [loading]="loading"
                            (onClick)="onSubmit()"
                        />

                        <div class="text-center">
                            <a routerLink="/auth/login" class="text-primary font-medium no-underline">
                                Back to login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ResetPassword implements OnInit {
    token = '';
    password = '';
    confirmPassword = '';
    loading = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auth: AuthService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

        if (!this.token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid link',
                detail: 'Password reset token is missing.',
                life: 5000
            });
        }
    }

    onEnter(ev: KeyboardEvent) {
        if (ev.key === 'Enter') this.onSubmit();
    }

    onSubmit() {
        if (!this.token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid link',
                detail: 'Password reset token is missing.',
                life: 4000
            });
            return;
        }

        if (!this.password || !this.confirmPassword) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Missing fields',
                detail: 'Password and confirmation are required.',
                life: 3000
            });
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Passwords do not match',
                detail: 'Please make sure both passwords are identical.',
                life: 3000
            });
            return;
        }

        this.loading = true;

        this.auth.resetPassword({
            Token: this.token,
            NewPassword: this.password
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Password updated',
                    detail: 'You can now log in with your new password.',
                    life: 3000
                });

                setTimeout(() => {
                    this.router.navigateByUrl('/auth/login');
                }, 800);
            },
            error: (err) => {
                const msg =
                    err?.error?.error ||
                    err?.error ||
                    err?.message ||
                    'Could not reset password.';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Reset failed',
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
