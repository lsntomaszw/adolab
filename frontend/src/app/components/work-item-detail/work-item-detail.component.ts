import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkItemService } from '../../services/work-item.service';
import { WorkItem, WorkItemComment } from '../../domain/work-item.model';

@Component({
  selector: 'app-work-item-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>
    } @else if (item()) {
      <div class="detail-page">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/workitems" class="breadcrumb-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Issues
          </a>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">#{{ item()!.id }}</span>
        </div>

        <div class="detail-layout">
          <!-- Main column -->
          <div class="main-col">
            <h1 class="detail-title">{{ item()!.title }}</h1>

            <!-- Description -->
            @if (item()!.description) {
              <div class="description" [innerHTML]="item()!.description"></div>
            }

            <!-- Child items -->
            @if (children().length > 0) {
              <div class="section">
                <h3 class="section-title">Sub-issues
                  <span class="section-count">{{ children().length }}</span>
                </h3>
                <div class="children-list">
                  @for (child of children(); track child.id) {
                    <a class="child-row" [routerLink]="['/workitems', child.id]">
                      <div class="child-status">
                        @if (isItemOpen(child)) {
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
                      <span class="child-id">#{{ child.id }}</span>
                      <span class="child-title">{{ child.title }}</span>
                      <span class="child-type" [attr.data-type]="child.workItemType">{{ child.workItemType }}</span>
                    </a>
                  }
                </div>
              </div>
            }

            <!-- Comments -->
            <div class="section">
              <h3 class="section-title">Activity
                <span class="section-count">{{ comments().length }}</span>
              </h3>
              @for (comment of comments(); track comment.id) {
                <div class="comment">
                  <div class="comment-avatar">
                    {{ initials(comment.createdBy || 'U') }}
                  </div>
                  <div class="comment-content">
                    <div class="comment-meta">
                      <span class="comment-author">{{ comment.createdBy || 'Unknown' }}</span>
                      <span class="comment-time">{{ timeAgo(comment.createdDate!) }}</span>
                      @if (comment.version > 1) {
                        <span class="comment-edited">edited</span>
                      }
                    </div>
                    <div class="comment-text" [innerHTML]="comment.text"></div>
                  </div>
                </div>
              }
              @if (comments().length === 0) {
                <p class="no-activity">No activity yet.</p>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">
            <div class="prop">
              <div class="prop-label">Status</div>
              <div class="prop-value">
                <span class="status-chip" [class.open]="isOpen()" [class.closed]="!isOpen()">
                  @if (isOpen()) {
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="8" cy="8" r="2" fill="currentColor"/>
                    </svg>
                  } @else {
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                  {{ item()!.state }}
                </span>
              </div>
            </div>

            <div class="prop">
              <div class="prop-label">Assignee</div>
              <div class="prop-value">
                @if (item()!.assignedTo) {
                  <span class="avatar-sm">{{ initials(item()!.assignedTo!) }}</span>
                  <span>{{ item()!.assignedTo }}</span>
                } @else {
                  <span class="empty-val">Unassigned</span>
                }
              </div>
            </div>

            <div class="prop">
              <div class="prop-label">Type</div>
              <div class="prop-value">
                <span class="type-badge" [attr.data-type]="item()!.workItemType">{{ item()!.workItemType }}</span>
              </div>
            </div>

            <div class="prop">
              <div class="prop-label">Priority</div>
              <div class="prop-value">
                @if (item()!.priority) {
                  <span class="priority-val" [class.high]="item()!.priority! <= 2">
                    P{{ item()!.priority }}
                  </span>
                } @else {
                  <span class="empty-val">None</span>
                }
              </div>
            </div>

            <div class="prop">
              <div class="prop-label">Iteration</div>
              <div class="prop-value">
                <span>{{ shortIteration(item()!.iterationPath) || 'None' }}</span>
              </div>
            </div>

            <div class="prop">
              <div class="prop-label">Area</div>
              <div class="prop-value">
                <span>{{ shortArea(item()!.areaPath) || 'None' }}</span>
              </div>
            </div>

            @if (item()!.tags) {
              <div class="prop">
                <div class="prop-label">Tags</div>
                <div class="prop-value tags-list">
                  @for (tag of splitTags(item()!.tags!); track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              </div>
            }

            @if (item()!.parentId) {
              <div class="prop">
                <div class="prop-label">Parent</div>
                <div class="prop-value">
                  <a [routerLink]="['/workitems', item()!.parentId]" class="parent-link">
                    #{{ item()!.parentId }}
                  </a>
                </div>
              </div>
            }

            <div class="prop">
              <div class="prop-label">Created</div>
              <div class="prop-value">
                <span class="meta-text">{{ item()!.createdBy }}</span>
                <span class="meta-date">{{ timeAgo(item()!.createdDate!) }}</span>
              </div>
            </div>

            <div class="sidebar-divider"></div>

            <a class="azure-link" [href]="azureUrl()" target="_blank">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View in Azure DevOps
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading {
      display: flex;
      justify-content: center;
      padding: 80px;
    }
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border-light);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .detail-page {
      max-width: 1150px;
      margin: 0 auto;
      padding: 20px 24px 48px;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 20px;
      font-size: var(--font-sm);
    }
    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      text-decoration: none;
      &:hover { color: var(--text-primary); }
    }
    .breadcrumb-sep { color: var(--text-tertiary); }
    .breadcrumb-current { color: var(--text-tertiary); }

    /* Layout */
    .detail-layout {
      display: flex;
      gap: 40px;
    }
    .main-col {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .sidebar {
      width: 240px;
      flex-shrink: 0;
    }

    /* Title */
    .detail-title {
      font-size: var(--font-2xl);
      font-weight: 600;
      margin: 0 0 20px 0;
      letter-spacing: -0.03em;
      line-height: 1.3;
    }

    /* Description */
    .description {
      padding: 0 0 24px 0;
      line-height: 1.7;
      font-size: var(--font-md);
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
      overflow-x: auto;

      :host ::ng-deep {
        img { max-width: 100%; border-radius: var(--radius-md); }
        a { color: var(--accent); }
        code {
          background: var(--bg-elevated);
          padding: 2px 5px;
          border-radius: var(--radius-sm);
          font-size: 0.9em;
        }
        pre {
          background: var(--bg-elevated);
          padding: 12px;
          border-radius: var(--radius-md);
          overflow-x: auto;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          td, th {
            border: 1px solid var(--border);
            padding: 6px 10px;
            text-align: left;
          }
          th { background: var(--bg-elevated); }
        }
      }
    }

    /* Sections */
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: var(--font-sm);
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-count {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      font-weight: 400;
    }

    /* Children */
    .children-list {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .child-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      font-size: var(--font-sm);
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-hover); }
    }
    .child-status { flex-shrink: 0; display: flex; align-items: center; }
    .status-icon { display: block; }
    .status-open { color: var(--blue); }
    .status-done { color: var(--green); }
    .child-id {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      flex-shrink: 0;
      min-width: 44px;
    }
    .child-title {
      flex: 1;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .child-type {
      font-size: var(--font-xs);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      background: var(--bg-active);
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .child-type[data-type="Bug"] { background: var(--red-muted); color: var(--red); }
    .child-type[data-type="Task"] { background: var(--blue-muted); color: var(--blue); }
    .child-type[data-type="User Story"] { background: var(--purple-muted); color: var(--purple); }

    /* Comments */
    .comment {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .comment-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-muted);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .comment-content {
      flex: 1;
      min-width: 0;
    }
    .comment-meta {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }
    .comment-author {
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-primary);
    }
    .comment-time {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
    }
    .comment-edited {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      font-style: italic;
    }
    .comment-text {
      font-size: var(--font-base);
      line-height: 1.6;
      color: var(--text-secondary);

      :host ::ng-deep {
        img { max-width: 100%; border-radius: var(--radius-sm); }
        a { color: var(--accent); }
        code {
          background: var(--bg-elevated);
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 0.9em;
        }
      }
    }
    .no-activity {
      color: var(--text-tertiary);
      font-size: var(--font-sm);
      font-style: italic;
    }

    /* Sidebar */
    .prop {
      margin-bottom: 14px;
    }
    .prop-label {
      font-size: var(--font-xs);
      font-weight: 500;
      color: var(--text-tertiary);
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .prop-value {
      font-size: var(--font-sm);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .empty-val {
      color: var(--text-tertiary);
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      font-weight: 500;
    }
    .status-chip.open { background: var(--blue-muted); color: var(--blue); }
    .status-chip.closed { background: var(--green-muted); color: var(--green); }

    .avatar-sm {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent-muted);
      color: var(--accent);
      font-size: 9px;
      font-weight: 600;
    }

    .type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      font-weight: 500;
      background: var(--bg-active);
      color: var(--text-secondary);
    }
    .type-badge[data-type="Bug"] { background: var(--red-muted); color: var(--red); }
    .type-badge[data-type="Task"] { background: var(--blue-muted); color: var(--blue); }
    .type-badge[data-type="User Story"] { background: var(--purple-muted); color: var(--purple); }
    .type-badge[data-type="Feature"] { background: var(--green-muted); color: var(--green); }
    .type-badge[data-type="Epic"] { background: var(--pink-muted); color: var(--pink); }

    .priority-val { font-size: var(--font-sm); }
    .priority-val.high { color: var(--orange); font-weight: 500; }

    .meta-text { color: var(--text-secondary); }
    .meta-date { color: var(--text-tertiary); font-size: var(--font-xs); }

    .tags-list { gap: 4px; }
    .tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-size: var(--font-xs);
      background: var(--bg-active);
      color: var(--text-secondary);
    }

    .parent-link {
      color: var(--accent);
      text-decoration: none;
      font-size: var(--font-sm);
      &:hover { text-decoration: underline; }
    }

    .sidebar-divider {
      height: 1px;
      background: var(--border);
      margin: 16px 0;
    }

    .azure-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: var(--font-sm);
      text-decoration: none;
      &:hover { color: var(--text-primary); }
    }

    @media (max-width: 768px) {
      .detail-layout { flex-direction: column; }
      .sidebar { width: 100%; }
    }
  `]
})
export class WorkItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private workItemService = inject(WorkItemService);

  itemId = 0;
  item = signal<WorkItem | null>(null);
  comments = signal<WorkItemComment[]>([]);
  children = signal<WorkItem[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.itemId = Number(this.route.snapshot.paramMap.get('itemId'));
    this.loadItem();
  }

  loadItem() {
    this.workItemService.getById(this.itemId).subscribe(item => {
      this.item.set(item);
      this.loading.set(false);
      this.loadComments();
      this.loadChildren();
    });
  }

  loadComments() {
    this.workItemService.getComments(this.itemId)
      .subscribe(c => this.comments.set(c));
  }

  loadChildren() {
    this.workItemService.getChildren(this.itemId)
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

  shortIteration(path: string | null): string {
    if (!path) return '';
    const parts = path.split('\\');
    return parts[parts.length - 1];
  }

  shortArea(path: string | null): string {
    if (!path) return '';
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

  azureUrl(): string {
    const item = this.item();
    if (!item) return '#';
    return `https://dev.azure.com/_workitems/edit/${item.id}`;
  }
}
