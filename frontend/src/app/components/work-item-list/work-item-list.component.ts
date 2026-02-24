import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { WorkItemService } from '../../services/work-item.service';
import { WorkItem, WorkItemFilter, WorkItemMetadata } from '../../domain/work-item.model';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';

@Component({
  selector: 'app-work-item-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatButtonToggleModule,
    FilterBarComponent,
  ],
  template: `
    <div class="header">
      <button mat-button routerLink="/sync">
        <mat-icon>arrow_back</mat-icon> Back to Syncs
      </button>
    </div>

    <!-- Filter Bar -->
    <app-filter-bar
      [metadata]="metadata()"
      [syncConfigId]="syncConfigId"
      (filterChanged)="onFilterChanged($event)">
    </app-filter-bar>

    <!-- State tabs (GitHub-style) -->
    <div class="state-tabs">
      <button class="state-tab" [class.active]="stateFilter() === 'open'"
              (click)="setStateFilter('open')">
        <mat-icon class="state-icon open">radio_button_checked</mat-icon>
        {{ openCount() }} Open
      </button>
      <button class="state-tab" [class.active]="stateFilter() === 'closed'"
              (click)="setStateFilter('closed')">
        <mat-icon class="state-icon closed">check_circle</mat-icon>
        {{ closedCount() }} Closed
      </button>
      <button class="state-tab" [class.active]="stateFilter() === 'all'"
              (click)="setStateFilter('all')">
        All {{ totalCount() }}
      </button>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    }

    <!-- Work Items List (GitHub Issues style) -->
    @if (!loading()) {
      <div class="issue-list">
        @for (item of items(); track item.id) {
          <div class="issue-row" (click)="openDetail(item)">
            <div class="issue-icon">
              @if (isOpen(item)) {
                <mat-icon class="state-icon open">radio_button_checked</mat-icon>
              } @else {
                <mat-icon class="state-icon closed">check_circle</mat-icon>
              }
            </div>
            <div class="issue-content">
              <div class="issue-title-row">
                <span class="issue-title">{{ item.title }}</span>
                <span class="label type-label" [attr.data-type]="item.workItemType">
                  {{ item.workItemType }}
                </span>
                @if (item.priority && item.priority <= 2) {
                  <span class="label priority-label">P{{ item.priority }}</span>
                }
                @if (item.tags) {
                  @for (tag of splitTags(item.tags); track tag) {
                    <span class="label tag-label">{{ tag }}</span>
                  }
                }
              </div>
              <div class="issue-meta">
                #{{ item.id }}
                @if (item.createdDate) {
                  opened {{ timeAgo(item.createdDate) }}
                }
                @if (item.createdBy) {
                  by {{ item.createdBy }}
                }
                @if (item.iterationPath) {
                  &middot; {{ item.iterationPath }}
                }
              </div>
            </div>
            <div class="issue-right">
              @if (item.assignedTo) {
                <span class="assignee" [title]="item.assignedTo">
                  {{ initials(item.assignedTo) }}
                </span>
              }
            </div>
          </div>
        }

        @if (items().length === 0) {
          <div class="empty">No work items found matching your filters.</div>
        }
      </div>
    }
  `,
  styles: [`
    .header { margin-bottom: 8px; }

    .state-tabs {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      border: 1px solid #d0d7de;
      border-radius: 6px 6px 0 0;
      background: #f6f8fa;
    }
    .state-tab {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #57606a;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .state-tab:hover { color: #24292f; }
    .state-tab.active { font-weight: 600; color: #24292f; }

    .state-icon { font-size: 18px; width: 18px; height: 18px; }
    .state-icon.open { color: #1a7f37; }
    .state-icon.closed { color: #8250df; }

    .loading { display: flex; justify-content: center; padding: 40px; }

    .issue-list {
      border: 1px solid #d0d7de;
      border-top: none;
      border-radius: 0 0 6px 6px;
    }
    .issue-row {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #d0d7de;
      cursor: pointer;
      gap: 12px;
    }
    .issue-row:last-child { border-bottom: none; }
    .issue-row:hover { background: #f6f8fa; }

    .issue-icon { padding-top: 2px; flex-shrink: 0; }

    .issue-content { flex: 1; min-width: 0; }
    .issue-title-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .issue-title {
      font-weight: 600;
      font-size: 15px;
      color: #24292f;
    }
    .issue-title:hover { color: #0969da; }

    .label {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      line-height: 16px;
      white-space: nowrap;
    }
    .type-label {
      background: #ddf4ff;
      color: #0969da;
    }
    .type-label[data-type="Bug"] { background: #ffebe9; color: #cf222e; }
    .type-label[data-type="Task"] { background: #dafbe1; color: #1a7f37; }
    .type-label[data-type="User Story"] { background: #fff8c5; color: #9a6700; }
    .type-label[data-type="Feature"] { background: #fbefff; color: #8250df; }
    .type-label[data-type="Epic"] { background: #ffeff7; color: #bf3989; }

    .priority-label { background: #ffebe9; color: #cf222e; }
    .tag-label { background: #e8e8e8; color: #555; }

    .issue-meta {
      font-size: 12px;
      color: #57606a;
      margin-top: 4px;
    }

    .issue-right { flex-shrink: 0; }
    .assignee {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ddf4ff;
      color: #0969da;
      font-size: 11px;
      font-weight: 600;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #57606a;
    }
  `]
})
export class WorkItemListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workItemService = inject(WorkItemService);

  syncConfigId = 0;
  items = signal<WorkItem[]>([]);
  metadata = signal<WorkItemMetadata | null>(null);
  loading = signal(true);
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
    this.syncConfigId = Number(this.route.snapshot.paramMap.get('syncId'));
    this.loadMetadata();
    this.loadStateCounts();
    this.loadItems();
  }

  loadMetadata() {
    this.workItemService.getMetadata(this.syncConfigId).subscribe(m => this.metadata.set(m));
  }

  loadStateCounts() {
    this.workItemService.getStateCounts(this.syncConfigId).subscribe(c => this.stateCounts.set(c));
  }

  loadItems() {
    this.loading.set(true);
    const filter: WorkItemFilter = {
      syncConfigId: this.syncConfigId,
      ...this.currentFilter,
    };

    // Map state filter to actual Azure DevOps states
    if (this.stateFilter() === 'open') {
      // Exclude closed-type states — we leave state undefined and filter client-side
    } else if (this.stateFilter() === 'closed') {
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
    this.router.navigate(['/sync', this.syncConfigId, 'workitems', item.id]);
  }

  isOpen(item: WorkItem): boolean {
    return !['Closed', 'Resolved', 'Done', 'Removed'].includes(item.state);
  }

  splitTags(tags: string): string[] {
    return tags.split(';').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
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
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}
