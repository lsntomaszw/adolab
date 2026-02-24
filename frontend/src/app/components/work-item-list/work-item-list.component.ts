import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkItemService } from '../../services/work-item.service';
import { SyncService } from '../../services/sync.service';
import { WorkItem, WorkItemFilter, WorkItemMetadata } from '../../domain/work-item.model';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';

@Component({
  selector: 'app-work-item-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FilterBarComponent],
  template: `
    <div class="list-page">
      <!-- Top bar -->
      <div class="page-header">
        <div class="page-title-row">
          <h1 class="page-title">Issues</h1>
          <div class="header-actions">
            @if (lastSynced()) {
              <span class="sync-status">{{ timeAgo(lastSynced()!) }}</span>
            }
            <button class="btn btn-default" (click)="executeSync()" [disabled]="syncing()">
              <svg class="spin-icon" [class.spinning]="syncing()" width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 16h5v5"/>
              </svg>
              Sync
            </button>
          </div>
        </div>

        @if (syncing()) {
          <div class="sync-progress">
            <div class="sync-progress-bar"></div>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <app-filter-bar
          [metadata]="metadata()"
          (filterChanged)="onFilterChanged($event)">
        </app-filter-bar>

        <!-- State tabs -->
        <div class="state-tabs">
          <button class="tab" [class.active]="stateFilter() === 'all'"
                  (click)="setStateFilter('all')">
            All <span class="tab-count">{{ totalCount() }}</span>
          </button>
          <button class="tab" [class.active]="stateFilter() === 'open'"
                  (click)="setStateFilter('open')">
            Active <span class="tab-count">{{ openCount() }}</span>
          </button>
          <button class="tab" [class.active]="stateFilter() === 'closed'"
                  (click)="setStateFilter('closed')">
            Done <span class="tab-count">{{ closedCount() }}</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading">
          <div class="loading-spinner"></div>
        </div>
      }

      <!-- Issue list -->
      @if (!loading()) {
        <div class="issue-list">
          @for (item of items(); track item.id) {
            <div class="issue-row" (click)="openDetail(item)">
              <div class="issue-status">
                @if (isOpen(item)) {
                  <svg class="status-icon status-open" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="8" cy="8" r="2" fill="currentColor"/>
                  </svg>
                } @else {
                  <svg class="status-icon status-done" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              </div>

              <div class="issue-id">#{{ item.id }}</div>

              <div class="issue-body">
                <span class="issue-title">{{ item.title }}</span>
              </div>

              <div class="issue-meta-right">
                <span class="type-badge" [attr.data-type]="item.workItemType">
                  {{ shortType(item.workItemType) }}
                </span>

                <span class="col-assignee" [title]="item.assignedTo || ''">
                  @if (item.assignedTo) {
                    {{ shortName(item.assignedTo) }}
                  } @else {
                    <span class="empty-val">&mdash;</span>
                  }
                </span>

                <span class="col-date" [title]="item.createdDate || ''">
                  {{ formatDate(item.createdDate) }}
                </span>

                <span class="col-date" [title]="item.lastActivityDate || item.changedDate || ''">
                  {{ formatDate(item.lastActivityDate || item.changedDate) }}
                </span>
              </div>
            </div>
          }

          @if (items().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
                </svg>
              </div>
              @if (!lastSynced()) {
                <p>No issues synced yet. Click Sync to get started.</p>
              } @else {
                <p>No issues match your filters.</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .list-page {
      max-width: 1150px;
      margin: 0 auto;
      padding: 24px 24px 48px;
    }

    /* Header */
    .page-header {
      margin-bottom: 20px;
    }
    .page-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-title {
      font-size: var(--font-xl);
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sync-status {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 12px;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--font-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }
    .btn-default {
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border);
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .spin-icon { transition: transform 0.2s; }
    .spin-icon.spinning {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Sync progress */
    .sync-progress {
      height: 2px;
      background: var(--bg-elevated);
      border-radius: 1px;
      margin-top: 12px;
      overflow: hidden;
    }
    .sync-progress-bar {
      height: 100%;
      width: 30%;
      background: var(--accent);
      border-radius: 1px;
      animation: progress 1.5s ease-in-out infinite;
    }
    @keyframes progress {
      0% { transform: translateX(-100%); width: 30%; }
      50% { width: 50%; }
      100% { transform: translateX(400%); width: 30%; }
    }

    /* Filters section */
    .filters-section {
      margin-bottom: 4px;
    }

    /* State tabs */
    .state-tabs {
      display: flex;
      gap: 2px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
    }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: var(--font-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: -1px;

      &:hover { color: var(--text-primary); }
      &.active {
        color: var(--text-primary);
        border-bottom-color: var(--accent);
      }
    }
    .tab-count {
      color: var(--text-tertiary);
      font-size: var(--font-xs);
      font-weight: 400;
    }

    /* Loading */
    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border-light);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    /* Issue list */
    .issue-list {
      margin-top: 0;
    }
    .issue-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 8px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.1s;

      &:hover { background: var(--bg-hover); }
      &:last-child { border-bottom: none; }
    }

    /* Status icons */
    .issue-status {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .status-icon { display: block; }
    .status-open { color: var(--blue); }
    .status-done { color: var(--green); }

    /* Issue ID */
    .issue-id {
      flex-shrink: 0;
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      font-variant-numeric: tabular-nums;
      min-width: 52px;
    }

    /* Issue body */
    .issue-body {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .issue-title {
      font-size: var(--font-base);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    /* Right meta */
    .issue-meta-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .priority {
      display: flex;
      align-items: center;
    }
    .priority-high { color: var(--orange); }

    .type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      font-weight: 500;
      white-space: nowrap;
      background: var(--bg-active);
      color: var(--text-secondary);
    }
    .type-badge[data-type="Bug"] { background: var(--red-muted); color: var(--red); }
    .type-badge[data-type="Task"] { background: var(--blue-muted); color: var(--blue); }
    .type-badge[data-type="User Story"] { background: var(--purple-muted); color: var(--purple); }
    .type-badge[data-type="Feature"] { background: var(--green-muted); color: var(--green); }
    .type-badge[data-type="Epic"] { background: var(--pink-muted); color: var(--pink); }

    .iteration {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--accent-muted);
      color: var(--accent);
      font-size: 9px;
      font-weight: 600;
      flex-shrink: 0;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: var(--text-tertiary);
    }
    .empty-icon {
      margin-bottom: 12px;
      opacity: 0.4;
    }
    .empty-state p {
      margin: 0;
      font-size: var(--font-sm);
    }
  `]
})
export class WorkItemListComponent implements OnInit {
  private router = inject(Router);
  private workItemService = inject(WorkItemService);
  private syncService = inject(SyncService);
  private snackBar = inject(MatSnackBar);

  items = signal<WorkItem[]>([]);
  metadata = signal<WorkItemMetadata | null>(null);
  loading = signal(true);
  syncing = signal(false);
  lastSynced = signal<string | null>(null);
  stateFilter = signal<'open' | 'closed' | 'all'>('all');
  stateCounts = signal<Record<string, number>>({});
  currentFilter: Partial<WorkItemFilter> = {};

  openCount = computed(() => {
    const counts = this.stateCounts();
    const total = counts['total'] || 0;
    const closed = (counts['Closed'] || 0) + (counts['Resolved'] || 0) + (counts['Done'] || 0) + (counts['Removed'] || 0);
    return total - closed;
  });

  closedCount = computed(() => {
    const counts = this.stateCounts();
    return (counts['Closed'] || 0) + (counts['Resolved'] || 0) + (counts['Done'] || 0) + (counts['Removed'] || 0);
  });

  totalCount = computed(() => this.stateCounts()['total'] || 0);

  ngOnInit() {
    this.syncService.getConfig().subscribe(config => {
      this.lastSynced.set(config.lastSynced);
    });
    this.loadMetadata();
    this.loadStateCounts();
    this.loadItems();
  }

  executeSync() {
    this.syncing.set(true);
    this.syncService.execute().subscribe({
      next: result => {
        this.syncing.set(false);
        this.lastSynced.set(new Date().toISOString());
        this.snackBar.open(`Synced ${result.itemsSynced} items in ${result.duration}`, 'OK', { duration: 5000 });
        this.loadMetadata();
        this.loadStateCounts();
        this.loadItems();
      },
      error: err => {
        this.syncing.set(false);
        this.snackBar.open('Sync failed: ' + (err.error?.error || err.message), 'OK', { duration: 5000 });
      }
    });
  }

  loadMetadata() {
    this.workItemService.getMetadata().subscribe(m => this.metadata.set(m));
  }

  loadStateCounts() {
    this.workItemService.getStateCounts().subscribe(c => this.stateCounts.set(c));
  }

  loadItems() {
    this.loading.set(true);
    const filter: Partial<WorkItemFilter> = { ...this.currentFilter };

    if (this.stateFilter() === 'closed') {
      filter.state = 'Closed';
    }

    this.workItemService.search(filter).subscribe(items => {
      let filtered = items;
      if (this.stateFilter() === 'open') {
        filtered = items.filter(i => !['Closed', 'Resolved', 'Done', 'Removed'].includes(i.state));
      }
      this.items.set(filtered);
      this.loading.set(false);
    });
  }

  setStateFilter(f: 'open' | 'closed' | 'all') {
    this.stateFilter.set(f);
    this.loadItems();
  }

  onFilterChanged(filter: Partial<WorkItemFilter>) {
    this.currentFilter = filter;
    this.loadItems();
  }

  openDetail(item: WorkItem) {
    this.router.navigate(['/workitems', item.id]);
  }

  isOpen(item: WorkItem): boolean {
    return !['Closed', 'Resolved', 'Done', 'Removed'].includes(item.state);
  }

  shortType(type: string): string {
    const map: Record<string, string> = {
      'User Story': 'Story',
      'Product Backlog Item': 'PBI',
    };
    return map[type] || type;
  }

  shortIteration(path: string): string {
    const parts = path.split('\\');
    return parts[parts.length - 1];
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }
}
