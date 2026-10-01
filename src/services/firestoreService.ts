import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { Category, MonthlyBudget, Transaction, UserProfile } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';
import { storageService } from './storageService';
import { db } from './firebase';
import {
  diffRecords,
  getCollectionRecordId,
  mergeLocalData,
  mergeRemoteAndLocalData,
  sortTransactionsNewestFirst,
  toFirestoreDocumentId,
  type PartialTrackerData,
  type TrackerData,
  type UserDataCollection,
} from './firestoreDataModel';

export type SyncStatus = 'loading' | 'syncing' | 'saving' | 'saved' | 'offline' | 'error';

export interface UserSyncCallbacks {
  onData: (data: TrackerData) => void;
  onStatus: (status: SyncStatus, message?: string) => void;
  onReady: () => void;
}

interface RemoteUserData {
  data: PartialTrackerData;
  hasProfile: boolean;
}

interface BatchOperation {
  type: 'set' | 'delete';
  path: string[];
  data?: DocumentData;
}

const COLLECTIONS: UserDataCollection[] = [
  'transactions',
  'categories',
  'budgets',
  'savingsGoals',
  'creditDebitRecords',
  'loans',
];

function cleanFirestoreValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanFirestoreValue);
  if (!value || typeof value !== 'object') return value;
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cleanFirestoreValue(item)])
  );
}

function withoutServerMetadata(data: DocumentData): DocumentData {
  const { createdAtServer: _createdAtServer, updatedAtServer: _updatedAtServer, userId: _userId, ...record } = data;
  return record;
}

function documentsFromSnapshot<T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map((document) => {
    const data = withoutServerMetadata(document.data());
    return { ...data, id: typeof data.id === 'string' && data.id ? data.id : document.id } as T;
  });
}

function budgetsFromSnapshot(snapshot: QuerySnapshot<DocumentData>): Record<string, MonthlyBudget> {
  const budgets: Record<string, MonthlyBudget> = {};
  for (const budget of documentsFromSnapshot<MonthlyBudget & { month: string }>(snapshot)) {
    const month = budget.month || budget.id;
    if (month) budgets[month] = { ...budget, month };
  }
  return budgets;
}

function profileFromDocument(data: DocumentData): UserProfile {
  return withoutServerMetadata(data) as UserProfile;
}

async function readRemoteUserData(uid: string): Promise<RemoteUserData> {
  const profileRef = doc(db, 'users', uid);
  const collectionRefs = COLLECTIONS.map((name) => collection(db, 'users', uid, name));
  const [profileSnapshot, ...collectionSnapshots] = await Promise.all([
    getDoc(profileRef),
    ...collectionRefs.map((reference) => getDocs(reference)),
  ]);

  const [transactions, categories, budgetDocs, savingsGoals, creditDebitRecords, loans] = collectionSnapshots;
  return {
    hasProfile: profileSnapshot.exists(),
    data: {
      profile: profileSnapshot.exists() ? profileFromDocument(profileSnapshot.data()) : undefined,
      transactions: documentsFromSnapshot(transactions),
      categories: documentsFromSnapshot<Category & { id: string }>(categories),
      budgets: budgetsFromSnapshot(budgetDocs),
      savingsGoals: documentsFromSnapshot(savingsGoals),
      creditDebitRecords: documentsFromSnapshot(creditDebitRecords),
      loans: documentsFromSnapshot(loans),
    },
  };
}

function recordsForCollection(
  collectionName: UserDataCollection,
  data: PartialTrackerData
): Array<Record<string, unknown> & { id?: string; month?: string }> {
  if (collectionName === 'budgets') {
    return Object.entries(data.budgets || {}).map(([month, budget]) => ({ ...budget, month: budget.month || month }));
  }
  const records = data[collectionName];
  return Array.isArray(records)
    ? records as unknown as Array<Record<string, unknown> & { id?: string; month?: string }>
    : [];
}

function recordPath(uid: string, collectionName: UserDataCollection, id: string): string[] {
  return ['users', uid, collectionName, toFirestoreDocumentId(id)];
}

function userOwnedRecord(uid: string, record: Record<string, unknown>, id: string, isNew: boolean): DocumentData {
  const appRecordId = typeof record.id === 'string' && record.id ? record.id : id;
  const cleanRecord = cleanFirestoreValue({ ...record, id: appRecordId }) as DocumentData;
  return {
    ...cleanRecord,
    userId: uid,
    ...(isNew ? { createdAtServer: serverTimestamp() } : {}),
    updatedAtServer: serverTimestamp(),
  };
}

async function commitOperations(operations: BatchOperation[]): Promise<void> {
  const batchSize = 450;
  for (let index = 0; index < operations.length; index += batchSize) {
    const batch = writeBatch(db);
    for (const operation of operations.slice(index, index + batchSize)) {
      const reference = doc(db, operation.path.join('/'));
      if (operation.type === 'delete') batch.delete(reference);
      else batch.set(reference, operation.data || {}, { merge: true });
    }
    await batch.commit();
  }
}

function buildMigrationOperations(uid: string, remote: RemoteUserData, local: TrackerData): BatchOperation[] {
  const operations: BatchOperation[] = [];
  if (!remote.hasProfile) {
    const profileData = cleanFirestoreValue(local.profile) as DocumentData;
    operations.push({
      type: 'set',
      path: ['users', uid],
      data: {
        ...profileData,
        userId: uid,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp(),
      },
    });
  }

  for (const collectionName of COLLECTIONS) {
    const localRecords = recordsForCollection(collectionName, local);
    const remoteRecords = recordsForCollection(collectionName, remote.data);
    const remoteIds = new Set<string>();
    for (const record of remoteRecords) {
      try {
        remoteIds.add(getCollectionRecordId(collectionName, record));
      } catch {
        // Ignore malformed remote records; they remain untouched in Firestore.
      }
    }

    for (const record of localRecords) {
      try {
        const id = getCollectionRecordId(collectionName, record);
        if (remoteIds.has(id)) continue;
        operations.push({
          type: 'set',
          path: recordPath(uid, collectionName, id),
          data: userOwnedRecord(uid, record, id, true),
        });
      } catch {
        // Malformed legacy records are preserved locally and are not uploaded.
      }
    }
  }
  return operations;
}

export function getFriendlySyncError(error: unknown): string {
  const candidate = error as { code?: string; message?: string };
  if (candidate?.code?.includes('permission-denied')) {
    return 'Firestore denied access. Publish the UID-only Firestore rules in Firebase Console.';
  }
  if (candidate?.code?.includes('unavailable') || candidate?.code?.includes('network')) {
    return 'Cloud storage is temporarily unavailable. Your browser-local copy is retained; Firestore has not confirmed the sync.';
  }
  return `Cloud sync failed${candidate?.code ? ` (${candidate.code})` : ''}. Your browser-local copy is retained; Firestore has not confirmed the sync.`;
}

function applyAndPublish(data: TrackerData, callbacks: UserSyncCallbacks): void {
  storageService.applyCloudSnapshot(data);
  callbacks.onData(data);
}

function attachRealtimeListeners(
  uid: string,
  initial: TrackerData,
  callbacks: UserSyncCallbacks,
  isActive: () => boolean
): Array<() => void> {
  let current = initial;
  const userRef = doc(db, 'users', uid);
  const stops: Array<() => void> = [];
  const publishPatch = (patch: PartialTrackerData) => {
    if (!isActive()) return;
    current = { ...current, ...patch };
    applyAndPublish(current, callbacks);
  };
  const onListenerError = (error: unknown) => {
    if (isActive()) callbacks.onStatus('error', getFriendlySyncError(error));
  };

  stops.push(onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) return;
    publishPatch({ profile: profileFromDocument(snapshot.data()) });
  }, onListenerError));

  for (const collectionName of COLLECTIONS) {
    const collectionRef = collection(db, 'users', uid, collectionName);
    stops.push(onSnapshot(collectionRef, (snapshot) => {
      if (!isActive()) return;
      if (collectionName === 'budgets') {
        publishPatch({ budgets: budgetsFromSnapshot(snapshot) });
      } else if (collectionName === 'categories') {
        const categories = documentsFromSnapshot<Category & { id: string }>(snapshot);
        publishPatch({ categories: categories.length ? categories : [...DEFAULT_CATEGORIES] });
      } else if (collectionName === 'transactions') {
        publishPatch({ transactions: sortTransactionsNewestFirst(documentsFromSnapshot<Transaction>(snapshot)) });
      } else {
        publishPatch({ [collectionName]: documentsFromSnapshot(snapshot) } as PartialTrackerData);
      }
    }, onListenerError));
  }
  return stops;
}

/**
 * Load, idempotently migrate, and then listen to only the authenticated user's
 * profile and data collections. Legacy unscoped values are UID-claimed before
 * any asynchronous read and are never removed by this service.
 */
export function startUserDataSync(uid: string, callbacks: UserSyncCallbacks): () => void {
  let disposed = false;
  let generation = 0;
  let readyNotified = false;
  let listenerStops: Array<() => void> = [];

  const stopListeners = () => {
    for (const stop of listenerStops) stop();
    listenerStops = [];
  };
  const isActive = () => !disposed;
  const notifyReady = () => {
    if (!readyNotified) {
      readyNotified = true;
      callbacks.onReady();
    }
  };

  const initialize = async () => {
    const currentGeneration = ++generation;
    stopListeners();
    callbacks.onStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'syncing');
    let localFallback: TrackerData | undefined;

    try {
      const includeLegacy = storageService.claimLegacyDataForUser(uid);
      const sources = storageService.getMigrationSources(uid, includeLegacy);
      const local = mergeLocalData(
        sources.user,
        sources.legacy,
        storageService.getProfile(),
        DEFAULT_CATEGORIES
      );
      localFallback = local;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        applyAndPublish(mergeRemoteAndLocalData({}, local, DEFAULT_CATEGORIES), callbacks);
        notifyReady();
        callbacks.onStatus('offline');
        return;
      }
      const remote = await readRemoteUserData(uid);
      if (disposed || currentGeneration !== generation) return;

      const operations = buildMigrationOperations(uid, remote, local);
      if (operations.length) await commitOperations(operations);
      if (disposed || currentGeneration !== generation) return;

      const initial = mergeRemoteAndLocalData(remote.data, local, DEFAULT_CATEGORIES);
      applyAndPublish(initial, callbacks);
      listenerStops = attachRealtimeListeners(
        uid,
        initial,
        callbacks,
        () => !disposed && currentGeneration === generation
      );
      notifyReady();
      callbacks.onStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'saved');
    } catch (error) {
      if (disposed || currentGeneration !== generation) return;
      applyAndPublish(localFallback || storageService.getCurrentSnapshot(), callbacks);
      notifyReady();
      callbacks.onStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error', getFriendlySyncError(error));
    }
  };

  const handleOnline = () => {
    if (disposed) return;
    callbacks.onStatus('syncing');
    void initialize();
  };
  const handleOffline = () => {
    if (!disposed) callbacks.onStatus('offline');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }
  void initialize();

  return () => {
    disposed = true;
    generation += 1;
    stopListeners();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

/** Persist document-level creates, updates, and deletes after local-first writes. */
export async function persistUserDataChanges(
  uid: string,
  family: keyof TrackerData,
  previous: unknown,
  next: unknown
): Promise<void> {
  if (family === 'profile') {
    const before = previous as UserProfile;
    const after = next as UserProfile;
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const reference = doc(db, 'users', uid);
    const data = cleanFirestoreValue(after) as DocumentData;
    await setDoc(reference, {
      ...data,
      userId: uid,
      updatedAtServer: serverTimestamp(),
    }, { merge: true });
    return;
  }

  const collectionName = family as UserDataCollection;
  const toArray = (value: unknown): Array<Record<string, unknown> & { id?: string; month?: string }> => {
    if (collectionName === 'budgets') {
      return Object.entries((value || {}) as Record<string, MonthlyBudget>).map(([month, budget]) => ({
        ...budget,
        month: budget.month || month,
      }));
    }
    return Array.isArray(value) ? value : [];
  };

  const changes = diffRecords(collectionName, toArray(previous), toArray(next));
  const operations: BatchOperation[] = [];
  for (const record of changes.upserts) {
    const id = getCollectionRecordId(collectionName, record);
    operations.push({
      type: 'set',
      path: recordPath(uid, collectionName, id),
      data: userOwnedRecord(uid, record, id, !toArray(previous).some((old) => {
        try {
          return getCollectionRecordId(collectionName, old) === id;
        } catch {
          return false;
        }
      })),
    });
  }
  for (const id of changes.deletes) {
    operations.push({ type: 'delete', path: recordPath(uid, collectionName, id) });
  }
  if (operations.length) await commitOperations(operations);
}
