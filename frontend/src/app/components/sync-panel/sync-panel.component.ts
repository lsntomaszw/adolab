import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SyncService } from '../../services/sync.service';
import { SyncConfig, SyncResult } from '../../domain/work-item.model';

@Component({
  selector: 'app-sync-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressBarModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <h2>Sync Configurations</h2>

    <!-- New sync form -->
    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>Add New Sync</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="form-row">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="newSync.name" placeholder="My Epic">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Epic ID</mat-label>
            <input matInput type="number" [(ngModel)]="newSync.epicId" placeholder="12345">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Organization</mat-label>
            <input matInput [(ngModel)]="newSync.orgName" placeholder="my-org">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Project</mat-label>
            <input matInput [(ngModel)]="newSync.project" placeholder="my-project">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="createSync()" [disabled]="!canCreate()">
            <mat-icon>add</mat-icon> Create
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-divider class="divider"></mat-divider>

    <!-- Syncing indicator -->
    @if (syncing()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <!-- Sync configs list -->
    @if (configs().length === 0) {
      <p class="empty">No sync configurations yet. Create one above.</p>
    }

    @for (config of configs(); track config.id) {
      <mat-card class="sync-card">
        <mat-card-content class="sync-row">
          <div class="sync-info">
            <div class="sync-name">{{ config.name }}</div>
            <div class="sync-meta">
              Epic #{{ config.epicId }} &middot;
              {{ config.orgName }}/{{ config.project }} &middot;
              @if (config.lastSynced) {
                Last synced: {{ config.lastSynced | date:'short' }}
              } @else {
                Never synced
              }
            </div>
          </div>
          <div class="sync-actions">
            <button mat-stroked-button (click)="executeSync(config)" [disabled]="syncing()">
              <mat-icon>sync</mat-icon> Sync
            </button>
            <button mat-raised-button color="primary"
                    (click)="openWorkItems(config)"
                    [disabled]="!config.lastSynced">
              <mat-icon>list</mat-icon> Work Items
            </button>
            <button mat-icon-button color="warn" (click)="deleteSync(config)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- Last sync result -->
    @if (lastResult()) {
      <mat-card class="result-card">
        <mat-card-content>
          <strong>Last sync result:</strong>
          Added: {{ lastResult()!.itemsAdded }},
          Updated: {{ lastResult()!.itemsUpdated }},
          Deleted: {{ lastResult()!.itemsDeleted }},
          Comments: {{ lastResult()!.commentsSynced }},
          Duration: {{ lastResult()!.duration }}
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .form-card { margin-bottom: 16px; }
    .form-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .form-row mat-form-field { flex: 1; min-width: 150px; }
    .divider { margin: 24px 0; }
    .empty { color: #666; text-align: center; padding: 40px; }
    .sync-card { margin-bottom: 12px; }
    .sync-row { display: flex; justify-content: space-between; align-items: center; }
    .sync-name { font-weight: 600; font-size: 16px; }
    .sync-meta { color: #666; font-size: 13px; margin-top: 4px; }
    .sync-actions { display: flex; gap: 8px; align-items: center; }
    .result-card { margin-top: 16px; background: #f0f9ff; }
  `]
})
export class SyncPanelComponent implements OnInit {
  private syncService = inject(SyncService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  configs = signal<SyncConfig[]>([]);
  syncing = signal(false);
  lastResult = signal<SyncResult | null>(null);

  newSync = { name: '', epicId: 0, orgName: '', project: '' };

  ngOnInit() {
    this.loadConfigs();
  }

  loadConfigs() {
    this.syncService.list().subscribe(configs => this.configs.set(configs));
  }

  canCreate(): boolean {
    return !!this.newSync.name && !!this.newSync.epicId && !!this.newSync.orgName && !!this.newSync.project;
  }

  createSync() {
    this.syncService.create(this.newSync).subscribe(() => {
      this.snackBar.open('Sync config created', 'OK', { duration: 3000 });
      this.newSync = { name: '', epicId: 0, orgName: '', project: '' };
      this.loadConfigs();
    });
  }

  executeSync(config: SyncConfig) {
    this.syncing.set(true);
    this.lastResult.set(null);
    this.syncService.execute(config.id).subscribe({
      next: result => {
        this.lastResult.set(result);
        this.syncing.set(false);
        this.loadConfigs();
        this.snackBar.open(`Synced ${result.itemsSynced} items in ${result.duration}`, 'OK', { duration: 5000 });
      },
      error: err => {
        this.syncing.set(false);
        this.snackBar.open('Sync failed: ' + (err.error?.error || err.message), 'OK', { duration: 5000 });
      }
    });
  }

  openWorkItems(config: SyncConfig) {
    this.router.navigate(['/sync', config.id, 'workitems']);
  }

  deleteSync(config: SyncConfig) {
    if (confirm(`Delete sync "${config.name}"?`)) {
      this.syncService.delete(config.id).subscribe(() => {
        this.snackBar.open('Deleted', 'OK', { duration: 2000 });
        this.loadConfigs();
      });
    }
  }
}
