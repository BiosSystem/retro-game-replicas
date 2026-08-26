import type { ScoreClaim } from './ScoreGossip';

export const MAX_PERSISTED_SCORE_CLAIMS = 4096;

const DATABASE_NAME = 'retro_swarm_scores_v1';
const DATABASE_VERSION = 2;
const STORE_NAME = 'scores';
const CLOCK_INDEX = 'clock';

export class SwarmScoreStore {
  private database?: Promise<IDBDatabase>;

  put(claim: ScoreClaim) {
    return new Promise<void>((resolve, reject) => {
      void this.open().then(database => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        let failure: DOMException | null = null;

        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error ?? failure ?? new DOMException('Score transaction aborted'));
        transaction.onerror = () => {
          failure = transaction.error;
        };

        const put = store.put(claim);
        put.onerror = () => {
          failure = put.error;
        };
        put.onsuccess = () => {
          const count = store.count();
          count.onerror = () => {
            failure = count.error;
          };
          count.onsuccess = () => {
            let excess = count.result - MAX_PERSISTED_SCORE_CLAIMS;
            if (excess <= 0) return;
            const cursor = store.index(CLOCK_INDEX).openCursor();
            cursor.onerror = () => {
              failure = cursor.error;
            };
            cursor.onsuccess = () => {
              const entry = cursor.result;
              if (!entry || excess <= 0) return;
              entry.delete();
              excess--;
              entry.continue();
            };
          };
        };
      }, reject);
    });
  }

  all() {
    return new Promise<ScoreClaim[]>((resolve, reject) => {
      void this.open().then(database => {
        const transaction = database.transaction(STORE_NAME);
        const cursor = transaction.objectStore(STORE_NAME).index(CLOCK_INDEX).openCursor(null, 'prev');
        const claims: ScoreClaim[] = [];

        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = () => {
          const entry = cursor.result;
          if (!entry || claims.length >= MAX_PERSISTED_SCORE_CLAIMS) {
            resolve(claims);
            return;
          }
          claims.push(entry.value as ScoreClaim);
          entry.continue();
        };
      }, reject);
    });
  }

  private open() {
    return this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.objectStoreNames.contains(STORE_NAME)
          ? request.transaction!.objectStore(STORE_NAME)
          : database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        if (!store.indexNames.contains(CLOCK_INDEX)) store.createIndex(CLOCK_INDEX, 'clock');
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          this.database = undefined;
        };
        resolve(database);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
