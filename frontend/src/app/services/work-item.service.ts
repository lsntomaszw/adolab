import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkItem, WorkItemComment, WorkItemFilter, WorkItemMetadata } from '../domain/work-item.model';

@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private http = inject(HttpClient);

  search(filter: WorkItemFilter): Observable<WorkItem[]> {
    let params = new HttpParams().set('syncConfigId', filter.syncConfigId);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.state) params = params.set('state', filter.state);
    if (filter.assignedTo) params = params.set('assignedTo', filter.assignedTo);
    if (filter.iterationPath) params = params.set('iterationPath', filter.iterationPath);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDir) params = params.set('sortDir', filter.sortDir);
    if (filter.limit) params = params.set('limit', filter.limit);
    if (filter.offset) params = params.set('offset', filter.offset);

    return this.http.get<WorkItem[]>('/api/workitems', { params });
  }

  getById(id: number, syncConfigId: number): Observable<WorkItem> {
    return this.http.get<WorkItem>(`/api/workitems/${id}`, {
      params: { syncConfigId }
    });
  }

  getChildren(parentId: number, syncConfigId: number): Observable<WorkItem[]> {
    return this.http.get<WorkItem[]>(`/api/workitems/${parentId}/children`, {
      params: { syncConfigId }
    });
  }

  getComments(workItemId: number, syncConfigId: number): Observable<WorkItemComment[]> {
    return this.http.get<WorkItemComment[]>(`/api/workitems/${workItemId}/comments`, {
      params: { syncConfigId }
    });
  }

  getMetadata(syncConfigId: number): Observable<WorkItemMetadata> {
    return this.http.get<WorkItemMetadata>('/api/workitems/metadata', {
      params: { syncConfigId }
    });
  }

  getStateCounts(syncConfigId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/workitems/counts', {
      params: { syncConfigId }
    });
  }
}
