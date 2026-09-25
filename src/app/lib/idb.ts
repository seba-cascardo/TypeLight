// A tiny key-value store on IndexedDB: a folder handle can't go to localStorage, and it must not travel in the backup JSON.
const DB = 'typelight'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = op(tx.objectStore(STORE))
    tx.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error ?? req.error)
    }
  })
}

export const idbGet = <T>(key: string) => run<T | undefined>('readonly', (s) => s.get(key) as IDBRequest<T | undefined>)
export async function idbSet(key: string, value: unknown): Promise<void> {
  await run('readwrite', (s) => s.put(value, key))
}

export async function idbDel(key: string): Promise<void> {
  await run('readwrite', (s) => s.delete(key))
}
