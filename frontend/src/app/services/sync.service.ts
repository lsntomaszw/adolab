import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyncConfig, SyncResult } from '../domain/work-item.model';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private http = inject(HttpClient);

  list(): Observable<SyncConfig[]> {
    return this.http.get<SyncConfig[]>('/api/sync');
  }

  getById(id: number): Observable<SyncConfig> {
    return this.http.get<SyncConfig>(`/api/sync/${id}`);
  }

  create(config: { name: string; epicId: number; orgName: string; project: string }): Observable<any> {
    return this.http.post('/api/sync', config);
  }

  execute(id: number): Observable<SyncResult> {
    return this.http.post<SyncResult>(`/api/sync/${id}/execute`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/sync/${id}`);
  }
}
