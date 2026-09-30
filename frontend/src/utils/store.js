import { getWsUrl, BACKEND_URL } from '../api';
import * as Y from 'yjs';

// ─────────────────────────────────────────────────────────────────────────────
// §3.2  CRDT Sync Engine — Edge / Client Side
// ─────────────────────────────────────────────────────────────────────────────
//
// How it works:
//
// 1. A single Y.Doc lives in the browser tab. All inventory UI components
//    read from / write to shared types on this doc (inventoryMap, etc.).
//    Because Yjs operations are pure CRDT ops, they are *always* safe to
//    apply locally — no server round-trip needed.
//
// 2. Every local mutation is captured by a doc.on('update') listener and
//    stored in two places:
//      a) Sent immediately over WebSocket if connected.
//      b) Appended to an IndexedDB "pending" queue if offline.
//
// 3. On WebSocket (re)connect the client:
//      • Sends its local state vector so the server can reply with only the
//        diff the client is missing.
//      • Flushes every pending update from IndexedDB into the server, then
//        clears the queue.
//    Because Yjs updates are commutative + idempotent, duplicates are harmless
//    and ordering doesn't matter — the merge always converges to a consistent
//    state on both sides.
//
// 4. The full local doc state is also periodically snapshot-persisted to
//    IndexedDB so a page refresh doesn't lose data.
// ─────────────────────────────────────────────────────────────────────────────

// ── IndexedDB helpers ───────────────────────────────────────────────────────

const DB_NAME = 'icenet-crdt';
const DB_VERSION = 1;
const PENDING_STORE = 'pending_updates';  // offline update queue
const SNAPSHOT_STORE = 'doc_snapshots';    // full doc snapshots

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function appendPendingUpdate(update) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).add(Array.from(update));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllPendingUpdates() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readonly');
    const req = tx.objectStore(PENDING_STORE).getAll();
    req.onsuccess = () => resolve(req.result);  // Array of number[]
    req.onerror = () => reject(req.error);
  });
}

async function clearPendingUpdates() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function saveSnapshot(update) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put(Array.from(update), 'latest');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSnapshot() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const req = tx.objectStore(SNAPSHOT_STORE).get('latest');
    req.onsuccess = () => resolve(req.result);  // number[] or undefined
    req.onerror = () => reject(req.error);
  });
}

// ── Yjs document & shared types ─────────────────────────────────────────────

export const doc = new Y.Doc();
export const inventoryMap = doc.getMap('inventory');
export const syncStatus = doc.getMap('syncStatus');

// Restore from IndexedDB snapshot on module load
(async () => {
  try {
    const snap = await loadSnapshot();
    if (snap) {
      Y.applyUpdate(doc, new Uint8Array(snap));
    }
  } catch (e) {
    console.warn('[CRDT] Could not restore snapshot:', e);
  }
})();

// Persist snapshot on every change (debounced 3s)
let snapshotTimer = null;
doc.on('update', () => {
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    const state = Y.encodeStateAsUpdate(doc);
    saveSnapshot(state).catch(() => {});
  }, 3000);
});

// ── Sync manager ────────────────────────────────────────────────────────────

/**
 * Call once from the root component. Returns a teardown function.
 *
 * @param {string} wsUrl  e.g. getWsUrl('/crdt')
 */
export function setupSync(wsUrl) {
  let ws = null;
  let reconnectTimer = null;
  let isConnected = false;

  // We track whether a local update originated from a remote message so we
  // don't echo it back.
  let applyingRemote = false;

  // ── WebSocket lifecycle ─────────────────────────────────────────────────

  function connect() {
    try {
      ws = new WebSocket(wsUrl);
    } catch (_) {
      scheduleReconnect();
      return;
    }

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      isConnected = true;
      syncStatus.set('connected', true);
      window.dispatchEvent(new CustomEvent('syncStatusChange', { detail: { connected: true } }));

      // Send our state vector so the server can reply with just the diff
      const sv = Y.encodeStateVector(doc);
      ws.send(JSON.stringify({ type: 'sv', sv: Array.from(sv) }));

      // Flush any updates accumulated while offline
      flushPendingUpdates();
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'sv') {
            // Server sent its state vector — reply with what it's missing
            const serverSV = new Uint8Array(msg.sv);
            const diff = Y.encodeStateAsUpdate(doc, serverSV);
            if (diff.byteLength > 0) {
              ws.send(JSON.stringify({ type: 'update', update: Array.from(diff) }));
            }
            return;
          }

          if (msg.type === 'update') {
            applyingRemote = true;
            Y.applyUpdate(doc, new Uint8Array(msg.update));
            applyingRemote = false;
            return;
          }

          // Telemetry pass-through (legacy support)
          if (msg.type === 'telemetry') {
            window.dispatchEvent(new CustomEvent('telemetryUpdate', { detail: msg.data }));
            return;
          }
        } catch (_) {}
      } else {
        // Raw binary update (legacy path)
        applyingRemote = true;
        Y.applyUpdate(doc, new Uint8Array(event.data));
        applyingRemote = false;
      }
    };

    ws.onclose = () => {
      isConnected = false;
      syncStatus.set('connected', false);
      window.dispatchEvent(new CustomEvent('syncStatusChange', { detail: { connected: false } }));
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire right after
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 3000);
  }

  // ── Local update handler ──────────────────────────────────────────────────

  function onLocalUpdate(update, origin) {
    if (applyingRemote) return;  // don't echo server messages back

    if (isConnected && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', update: Array.from(update) }));
    } else {
      // OFFLINE — queue to IndexedDB for later flush
      appendPendingUpdate(update).catch(e => console.warn('[CRDT] failed to queue update:', e));
    }
  }

  doc.on('update', onLocalUpdate);

  // ── Flush offline queue ───────────────────────────────────────────────────

  async function flushPendingUpdates() {
    try {
      const pending = await getAllPendingUpdates();
      if (pending.length === 0) return;
      for (const arr of pending) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'update', update: arr }));
        } else {
          // WS dropped mid-flush; fall back to HTTP
          await fetch(`${BACKEND_URL}/api/v1/sync/crdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              update: arr,
              stateVector: Array.from(Y.encodeStateVector(doc)),
            }),
          }).then(async r => {
            const body = await r.json();
            // Apply the server diff we may have missed
            if (body.serverDiff) {
              applyingRemote = true;
              Y.applyUpdate(doc, new Uint8Array(body.serverDiff));
              applyingRemote = false;
            }
          }).catch(() => {});
        }
      }
      await clearPendingUpdates();
    } catch (e) {
      console.warn('[CRDT] Flush error:', e);
    }
  }

  // ── Also try flushing when browser comes back online ──────────────────────

  function onOnline() {
    if (!isConnected) connect();
  }
  window.addEventListener('online', onOnline);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  connect();

  // ── Teardown ──────────────────────────────────────────────────────────────

  return {
    disconnect: () => {
      doc.off('update', onLocalUpdate);
      window.removeEventListener('online', onOnline);
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },
  };
}
