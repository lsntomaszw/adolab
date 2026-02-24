import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkItemFilter, WorkItemMetadata } from '../../domain/work-item.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-bar">
      <div class="search-wrapper">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input class="search-input" type="text" placeholder="Search issues..."
               [(ngModel)]="searchQuery" (keyup.enter)="applyFilter()">
      </div>

      <div class="filter-group">
        <select class="filter-select" [(ngModel)]="selectedType" (change)="applyFilter()">
          <option value="">Type</option>
          @for (type of metadata?.types || []; track type) {
            <option [value]="type">{{ type }}</option>
          }
        </select>

        <select class="filter-select" [(ngModel)]="selectedAssignee" (change)="applyFilter()">
          <option value="">Assignee</option>
          @for (assignee of metadata?.assignees || []; track assignee) {
            <option [value]="assignee">{{ shortName(assignee) }}</option>
          }
        </select>

        <select class="filter-select" [(ngModel)]="selectedIteration" (change)="applyFilter()">
          <option value="">Iteration</option>
          @for (iter of metadata?.iterations || []; track iter) {
            <option [value]="iter">{{ shortIteration(iter) }}</option>
          }
        </select>

        @if (hasActiveFilters()) {
          <button class="clear-btn" (click)="clearFilters()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
            Clear
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 0 12px 0;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 180px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 32px;
      padding: 0 10px 0 32px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: inherit;
      font-size: var(--font-sm);
      outline: none;
      transition: border-color 0.15s;

      &::placeholder { color: var(--text-tertiary); }
      &:focus { border-color: var(--accent); }
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-select {
      height: 32px;
      padding: 0 24px 0 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-family: inherit;
      font-size: var(--font-sm);
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235c5c6e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      transition: border-color 0.15s;

      &:focus { border-color: var(--accent); }
      &:hover { border-color: var(--border-light); }

      option {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }
    }

    .clear-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 32px;
      padding: 0 10px;
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-family: inherit;
      font-size: var(--font-sm);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
    }
  `]
})
export class FilterBarComponent {
  @Input() metadata: WorkItemMetadata | null = null;
  @Output() filterChanged = new EventEmitter<Partial<WorkItemFilter>>();

  searchQuery = '';
  selectedType = '';
  selectedAssignee = '';
  selectedIteration = '';

  applyFilter() {
    this.filterChanged.emit({
      q: this.searchQuery || undefined,
      type: this.selectedType || undefined,
      assignedTo: this.selectedAssignee || undefined,
      iterationPath: this.selectedIteration || undefined,
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedAssignee = '';
    this.selectedIteration = '';
    this.applyFilter();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedType || this.selectedAssignee || this.selectedIteration);
  }

  shortName(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) return parts[0] + ' ' + parts[1][0] + '.';
    return name;
  }

  shortIteration(path: string): string {
    const parts = path.split('\\');
    return parts[parts.length - 1];
  }
}
