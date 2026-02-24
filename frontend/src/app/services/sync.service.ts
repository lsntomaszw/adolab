import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyncConfig, SyncResult } from '../domain/work-item.model';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private http = inject(HttpClient);

  getConfig(): Observable<SyncConfig> {
    return this.http.get<SyncConfig>('/api/sync/config');
  }

  execute(): Observable<SyncResult> {
    return this.http.post<SyncResult>('/api/sync/execute', {});
  }
}
