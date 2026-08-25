import type { SyncState } from "@/shared/constants/governance";

export interface SyncableRecord {
  id: string;
  syncState: SyncState;
  lastModifiedAt: string;
}

export interface SyncAdapter {
  push: (records: SyncableRecord[]) => Promise<{ synced: string[]; failed: string[] }>;
  pull: () => Promise<SyncableRecord[]>;
  isOnline: () => boolean;
}

/** Placeholder adapter — real server sync can replace this */
export const noopSyncAdapter: SyncAdapter = {
  push: async (records) => ({
    synced: [],
    failed: records.map((r) => r.id),
  }),
  pull: async () => [],
  isOnline: () => typeof navigator !== "undefined" ? navigator.onLine : true,
};

export function getSyncStateLabel(state: SyncState): string {
  switch (state) {
    case "offline":
      return "Offline";
    case "pending_sync":
      return "Pending Sync";
    case "synced":
      return "Synced";
  }
}

export function resolveSyncState(isOnline: boolean, pending: boolean): SyncState {
  if (!isOnline) return "offline";
  if (pending) return "pending_sync";
  return "synced";
}
