import { CourseBase } from "../client";
import { ObjectToEntriesTuple } from "../utilTypes";

/* -------------------------------------------------------------------------- */
/*                                   Storage                                  */
/* -------------------------------------------------------------------------- */

export type History = {
    // courseId1: CourseBase["id1"];
    course: CourseBase;
    classCount: number;
    // todo
    // lecturers: string[];
    timeStamp: number; // generated by Date.now()
};

// todo: detect if storage type has changed
export type StorageMap = {
    token: string;
    ttl: { value: number; cache_time: number }; // in second
    semester: string;
    foo: number;
    histories: History[];
    hasShownNTUCoolTour: boolean;
};

/* ----------------------------- Implementation ----------------------------- */

export type StorageKey = keyof StorageMap;
type StorageKeyTuple<
    T extends StorageKey[] = [],
    L = ObjectToEntriesTuple<StorageMap>["length"]
> = (T["length"] extends L ? T : StorageKeyTuple<[...T, StorageKey]>) | T;

type StorageKeyTupleReturnType<T extends StorageKey[]> = T extends [
    infer F extends StorageKey,
    ...infer R extends StorageKey[]
]
    ? { [K in F]?: StorageMap[K] } & StorageKeyTupleReturnType<R>
    : {};

function getStorage<T extends StorageKey>(
    key: T
): Promise<StorageMap[T] | undefined>;
async function getStorage(key: StorageKey) {
    // console.log("get storage: ", key);
    return (await chrome.storage.sync.get(key))[key];
}

function getStorages<T extends StorageKeyTuple>(
    key: T
): Promise<StorageKeyTupleReturnType<T>>;
function getStorages<T extends Partial<StorageMap>>(
    key: T
): Promise<{
    [K in keyof T]: K extends keyof StorageMap ? StorageMap[K] : "never";
}>;
async function getStorages(
    keys: StorageKey[] | { [K in StorageKey]?: StorageMap[K] }
) {
    // console.log("get storages: ", keys);
    return await chrome.storage.sync.get(keys);
}

type StorageChangeHandler<K extends StorageKey> = (
    data: StorageMap[K] | undefined
) => void;

const onStoreChangeMap: { [K in StorageKey]: Set<StorageChangeHandler<K>> } = {
    foo: new Set(),
    token: new Set(),
    histories: new Set(),
    ttl: new Set(),
    semester: new Set(),
    hasShownNTUCoolTour: new Set(),
};

async function setStorage(items: Partial<StorageMap>) {
    //console.log("set storage:", items);
    await chrome.storage.sync.set(items);

    (Object.keys(items) as StorageKey[]).forEach((key) => {
        onStoreChangeMap[key].forEach((fn) => fn(items[key] as any));
    });
}

async function removeStorage<T extends StorageKey>(key: T) {
    //console.log(`remove storage: ${key}`);
    await chrome.storage.sync.remove(key);

    onStoreChangeMap[key].forEach((fn) => fn(undefined));
}

async function removeStorages<T extends StorageKeyTuple>(keys: T) {
    //console.log(`remove storages: ${keys}`);
    chrome.storage.sync.remove(keys);

    keys.forEach((key) => {
        onStoreChangeMap[key].forEach((fn) => fn(undefined));
    });
}

export function subscribeFactory<K extends StorageKey>(
    key: K
): (onStoreChange: StorageChangeHandler<K>) => () => void {
    const subscribe = (fn: StorageChangeHandler<K>) => {
        onStoreChangeMap[key].add(fn);
        return () => onStoreChangeMap[key].delete(fn);
    };
    return subscribe;
}

export { getStorage, getStorages, setStorage, removeStorage, removeStorages };

// todo
import conflictKeys from "../conflictKeys.json";
export function clearConflictStorages() {
    try {
        removeStorages(conflictKeys as any);
    } catch {}
}
