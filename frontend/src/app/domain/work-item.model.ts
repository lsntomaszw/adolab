export interface WorkItem {
  id: number;
  syncConfigId: number;
  rev: number;
  title: string;
  workItemType: string;
  state: string;
  assignedTo: string | null;
  description: string | null;
  priority: number | null;
  tags: string | null;
  areaPath: string | null;
  iterationPath: string | null;
  parentId: number | null;
  watermark: number | null;
  createdDate: string | null;
  changedDate: string | null;
  createdBy: string | null;
  changedBy: string | null;
  syncedAt: string | null;
  lastActivityDate: string | null;
}

export interface WorkItemComment {
  id: number;
  workItemId: number;
  syncConfigId: number;
  text: string;
  createdBy: string | null;
  createdDate: string | null;
  modifiedBy: string | null;
  modifiedDate: string | null;
  version: number;
  syncedAt: string | null;
}

export interface SyncConfig {
  id: number;
  name: string;
  areaPath: string;
  lastSynced: string | null;
  createdAt: string;
}

export interface SyncResult {
  syncConfigId: number;
  status: string;
  itemsSynced: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsDeleted: number;
  commentsSynced: number;
  duration: string;
}

export interface WorkItemMetadata {
  types: string[];
  states: string[];
  assignees: string[];
  iterations: string[];
}

export interface WorkItemFilter {
  syncConfigId: number;
  type?: string;
  state?: string;
  assignedTo?: string;
  iterationPath?: string;
  q?: string;
  sortBy?: string;
  sortDir?: string;
  limit?: number;
  offset?: number;
}

export interface SmartSearchResult {
  responseType: 'list' | 'narrative';
  items: WorkItem[];
  narrative: string | null;
  explanation: string;
}
