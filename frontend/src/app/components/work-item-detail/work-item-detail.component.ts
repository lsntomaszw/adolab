import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkItemService } from '../../services/work-item.service';
import { WorkItem, WorkItemComment } from '../../domain/work-item.model';

@Component({
  selector: 'app-work-item-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (item()) {
      <!-- Header -->
      <div class="detail-header">
        <button mat-button [routerLink]="['/sync', syncConfigId, 'workitems']">
          <mat-icon>arrow_back</mat-icon> Back
        </button>
      </div>

      <div class="detail-layout">
        <!-- Main column -->
        <div class="main-col">
          <h1 class="detail-title">
            {{ item()!.title }}
            <span class="detail-id">#{{ item()!.id }}</span>
          </h1>

          <div class="state-badge" [class.open]="isOpen()" [class.closed]="!isOpen()">
            <mat-icon>{{ isOpen() ? 'radio_button_checked' : 'check_circle' }}</mat-icon>
            {{ item()!.state }}
          </div>

          @if (item()!.createdBy) {
            <div class="opened-by">
              {{ item()!.createdBy }} opened this {{ timeAgo(item()!.createdDate!) }}
              &middot; {{ comments().length }} comment{{ comments().length !== 1 ? 's' : '' }}
            </div>
          }

          <mat-divider></mat-divider>

          <!-- Description -->
          @if (item()!.description) {
            <div class="description" [innerHTML]="item()!.description"></div>
            <mat-divider></mat-divider>
          }

          <!-- Child items -->
          @if (children().length > 0) {
            <div class="children-section">
              <h3>Child Items ({{ children().length }})</h3>
              @for (child of children(); track child.id) {
                <div class="child-row" [routerLink]="['/sync', syncConfigId, 'workitems', child.id]">
                  <mat-icon class="child-icon" [class.open]="isItemOpen(child)" [class.closed]="!isItemOpen(child)">
                    {{ isItemOpen(child) ? 'radio_button_checked' : 'check_circle' }}
                  </mat-icon>
                  <span class="child-type label" [attr.data-type]="child.workItemType">{{ child.workItemType }}</span>
                  <span class="child-title">{{ child.title }}</span>
                  <span class="child-id">#{{ child.id }}</span>
                  <span class="child-state">{{ child.state }}</span>
                </div>
              }
            </div>
            <mat-divider></mat-divider>
          }

          <!-- Comments timeline -->
          <div class="comments-section">
            <h3>Comments</h3>
            @for (comment of comments(); track comment.id) {
              <div class="comment">
                <div class="comment-avatar">
                  {{ initials(comment.createdBy || 'U') }}
                </div>
                <div class="comment-body">
                  <div class="comment-header">
                    <strong>{{ comment.createdBy || 'Unknown' }}</strong>
                    commented {{ timeAgo(comment.createdDate!) }}
                    @if (comment.version > 1) {
                      <span class="edited">(edited)</span>
                    }
                  </div>
                  <div class="comment-text" [innerHTML]="comment.text"></div>
                </div>
              </div>
            }
            @if (comments().length === 0) {
              <p class="no-comments">No comments yet.</p>
            }
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-section">
            <div class="sidebar-label">Assignee</div>
            <div class="sidebar-value">
              @if (item()!.assignedTo) {
                <span class="assignee-avatar">{{ initials(item()!.assignedTo!) }}</span>
                {{ item()!.assignedTo }}
              } @else {
                <span class="none">No one assigned</span>
              }
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Type</div>
            <div class="sidebar-value">
              <span class="label type-label" [attr.data-type]="item()!.workItemType">{{ item()!.workItemType }}</span>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Priority</div>
            <div class="sidebar-value">
              @if (item()!.priority) {
                P{{ item()!.priority }}
              } @else {
                <span class="none">Not set</span>
              }
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Iteration</div>
            <div class="sidebar-value">{{ item()!.iterationPath || 'Not set' }}</div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Area</div>
            <div class="sidebar-value">{{ item()!.areaPath || 'Not set' }}</div>
          </div>

          @if (item()!.tags) {
            <div class="sidebar-section">
              <div class="sidebar-label">Tags</div>
              <div class="sidebar-value tags">
                @for (tag of splitTags(item()!.tags!); track tag) {
                  <span class="label tag-label">{{ tag }}</span>
                }
              </div>
            </div>
          }

          @if (item()!.parentId) {
            <div class="sidebar-section">
              <div class="sidebar-label">Parent</div>
              <div class="sidebar-value">
                <a [routerLink]="['/sync', syncConfigId, 'workitems', item()!.parentId]">
                  #{{ item()!.parentId }}
                </a>
              </div>
            </div>
          }

          <mat-divider></mat-divider>

          <div class="sidebar-section">
            <a mat-stroked-button class="azure-link" [href]="azureUrl()" target="_blank">
              <mat-icon>open_in_new</mat-icon> View in Azure DevOps
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 40px; }
    .detail-header { margin-bottom: 12px; }

    .detail-layout { display: flex; gap: 24px; }
    .main-col { flex: 1; min-width: 0; }
    .sidebar { width: 280px; flex-shrink: 0; }

    .detail-title { font-size: 24px; margin: 0 0 8px 0; }
    .detail-id { color: #57606a; font-weight: 400; }

    .state-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .state-badge.open { background: #dafbe1; color: #1a7f37; }
    .state-badge.closed { background: #fbefff; color: #8250df; }
    .state-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .opened-by { color: #57606a; font-size: 13px; margin-bottom: 16px; }

    .description { padding: 16px 0; line-height: 1.6; }

    /* Children */
    .children-section { padding: 16px 0; }
    .child-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .child-row:hover { background: #f6f8fa; }
    .child-icon { font-size: 16px; width: 16px; height: 16px; }
    .child-icon.open { color: #1a7f37; }
    .child-icon.closed { color: #8250df; }
    .child-title { flex: 1; font-weight: 500; }
    .child-id { color: #57606a; font-size: 12px; }
    .child-state { color: #57606a; font-size: 12px; }

    /* Comments */
    .comments-section { padding: 16px 0; }
    .comment {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ddf4ff;
      color: #0969da;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .comment-body {
      flex: 1;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      overflow: hidden;
    }
    .comment-header {
      background: #f6f8fa;
      padding: 8px 12px;
      font-size: 13px;
      color: #57606a;
      border-bottom: 1px solid #d0d7de;
    }
    .edited { color: #8b949e; font-style: italic; }
    .comment-text { padding: 12px; line-height: 1.5; font-size: 14px; }
    .no-comments { color: #57606a; font-style: italic; }

    /* Sidebar */
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-label { font-size: 12px; font-weight: 600; color: #57606a; margin-bottom: 4px; }
    .sidebar-value { font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .none { color: #8b949e; font-style: italic; }
    .assignee-avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: #ddf4ff; color: #0969da;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 600;
    }
    .tags { gap: 4px; }
    .azure-link { width: 100%; }

    /* Labels (shared with list) */
    .label {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 600; line-height: 16px; white-space: nowrap;
    }
    .type-label { background: #ddf4ff; color: #0969da; }
    .type-label[data-type="Bug"] { background: #ffebe9; color: #cf222e; }
    .type-label[data-type="Task"] { background: #dafbe1; color: #1a7f37; }
    .type-label[data-type="User Story"] { background: #fff8c5; color: #9a6700; }
    .type-label[data-type="Feature"] { background: #fbefff; color: #8250df; }
    .type-label[data-type="Epic"] { background: #ffeff7; color: #bf3989; }
    .tag-label { background: #e8e8e8; color: #555; }

    @media (max-width: 768px) {
      .detail-layout { flex-direction: column; }
      .sidebar { width: 100%; }
    }
  `]
})
export class WorkItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private workItemService = inject(WorkItemService);

  syncConfigId = 0;
  itemId = 0;
  item = signal<WorkItem | null>(null);
  comments = signal<WorkItemComment[]>([]);
  children = signal<WorkItem[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.syncConfigId = Number(this.route.snapshot.paramMap.get('syncId'));
    this.itemId = Number(this.route.snapshot.paramMap.get('itemId'));
    this.loadItem();
  }

  loadItem() {
    this.workItemService.getById(this.itemId, this.syncConfigId).subscribe(item => {
      this.item.set(item);
      this.loading.set(false);
      this.loadComments();
      this.loadChildren();
    });
  }

  loadComments() {
    this.workItemService.getComments(this.itemId, this.syncConfigId)
      .subscribe(c => this.comments.set(c));
  }

  loadChildren() {
    this.workItemService.getChildren(this.itemId, this.syncConfigId)
      .subscribe(c => this.children.set(c));
  }

  isOpen(): boolean {
    return this.item() ? !['Closed', 'Resolved', 'Done', 'Removed'].includes(this.item()!.state) : true;
  }

  isItemOpen(item: WorkItem): boolean {
    return !['Closed', 'Resolved', 'Done', 'Removed'].includes(item.state);
  }

  splitTags(tags: string): string[] {
    return tags.split(';').map(t => t.trim()).filter(t => t.length > 0);
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

  azureUrl(): string {
    const item = this.item();
    if (!item) return '#';
    // Construct Azure DevOps URL — uses area path to derive org/project
    return `https://dev.azure.com/_workitems/edit/${item.id}`;
  }
}
