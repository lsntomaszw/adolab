import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WorkItemFilter, WorkItemMetadata } from '../../domain/work-item.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule, MatButtonModule,
  ],
  template: `
    <div class="filter-bar">
      <mat-form-field appearance="outline" class="filter-field search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Search by title or ID..." [(ngModel)]="searchQuery"
               (keyup.enter)="applyFilter()">
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="selectedType" (selectionChange)="applyFilter()">
          <mat-option [value]="''">All</mat-option>
          @for (type of metadata?.types || []; track type) {
            <mat-option [value]="type">{{ type }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Assignee</mat-label>
        <mat-select [(ngModel)]="selectedAssignee" (selectionChange)="applyFilter()">
          <mat-option [value]="''">All</mat-option>
          @for (assignee of metadata?.assignees || []; track assignee) {
            <mat-option [value]="assignee">{{ assignee }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Iteration</mat-label>
        <mat-select [(ngModel)]="selectedIteration" (selectionChange)="applyFilter()">
          <mat-option [value]="''">All</mat-option>
          @for (iter of metadata?.iterations || []; track iter) {
            <mat-option [value]="iter">{{ iter }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-icon-button (click)="clearFilters()" title="Clear filters">
        <mat-icon>clear</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      padding: 8px 0;
    }
    .filter-field { font-size: 14px; }
    .search-field { flex: 1; min-width: 200px; }
    .filter-field:not(.search-field) { width: 160px; }
  `]
})
export class FilterBarComponent {
  @Input() metadata: WorkItemMetadata | null = null;
  @Input() syncConfigId = 0;
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
}
