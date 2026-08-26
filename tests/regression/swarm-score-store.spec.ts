import { expect, test } from '@playwright/test';

test('retain only the newest connected score claims on disk', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { arcadeSwarm?: unknown }).arcadeSwarm))).toBe(true);
  const result = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('retro_swarm_scores_v1', 2);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('scores', { keyPath: 'id' });
        store.createIndex('clock', 'clock');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('scores', 'readwrite');
      const store = transaction.objectStore('scores');
      for (let clock = 1; clock <= 4097; clock++) store.put({ id: `seed-${clock}`, clock });
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });

    const keys = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
    const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
    const base = { clock: 5000, game: 'LabyrinthScene', id: 'retention-trigger', player: 'AAA', publicKey: base64(raw), replayHash: 'a'.repeat(64), score: 5000, version: 1 as const };
    const signature = base64(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, keys.privateKey, new TextEncoder().encode(JSON.stringify(base)))));
    const api = (window as typeof window & { arcadeSwarm: { merge(value: unknown): Promise<unknown> } }).arcadeSwarm;
    await api.merge({ type: 'SCORE_GOSSIP', claims: [{ ...base, signature }] });

    return new Promise<{ count: number; oldest: number; newest: number }>((resolve, reject) => {
      const transaction = database.transaction('scores');
      const store = transaction.objectStore('scores');
      const count = store.count();
      const oldest = store.index('clock').openCursor();
      const newest = store.index('clock').openCursor(null, 'prev');
      transaction.oncomplete = () => resolve({ count: count.result, oldest: Number(oldest.result?.key), newest: Number(newest.result?.key) });
      transaction.onabort = () => reject(transaction.error);
    });
  });

  expect(result).toEqual({ count: 4096, oldest: 3, newest: 5000 });
});
