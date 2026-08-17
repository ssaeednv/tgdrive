/**
 * src/lib/persistence.ts
 * ------------------------------------------------------------------
 * Requests "persistent" storage from the browser so that IndexedDB
 * (where Dexie stores our Telegram session in db.credentials) is NOT
 * silently evicted by the browser under storage pressure or, in
 * Safari's case, after 7 days without a visit.
 *
 * This does not touch telegram.ts, db.ts, or any auth logic — it is a
 * pure addition. Call `ensurePersistentStorage()` once, as early as
 * possible in the app's lifecycle (e.g. in main.tsx or at the top of
 * App.tsx's initial effect), before `getClient()` is called.
 *
 * Docs: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
 */

export async function ensurePersistentStorage(): Promise<boolean> {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) {
    // Older Safari / some private-browsing contexts don't expose this API.
    console.warn("[persistence] navigator.storage.persist() not supported in this browser.");
    return false;
  }

  try {
    const alreadyPersisted = await navigator.storage.persisted();
    if (alreadyPersisted) return true;

    const granted = await navigator.storage.persist();
    if (granted) {
      console.info("[persistence] Storage marked as persistent — session will not be auto-evicted.");
    } else {
      console.warn(
        "[persistence] Browser denied persistence request. " +
        "The saved Telegram session may still be cleared under low-storage conditions " +
        "or (on Safari) after 7 days of no visits."
      );
    }
    return granted;
  } catch (err) {
    console.warn("[persistence] Error requesting persistent storage:", err);
    return false;
  }
}

/**
 * Optional diagnostic helper — call from the browser console
 * (window.__tgdriveStorageEstimate()) to see current usage/quota.
 */
export async function getStorageEstimate(): Promise<{ usage?: number; quota?: number } | null> {
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return { usage: estimate.usage, quota: estimate.quota };
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__tgdriveStorageEstimate = getStorageEstimate;
}
