import { useEffect, useState, useSyncExternalStore } from "react";
import { StorageKey, StorageMap, getStorage, subscribeFactory } from "../api";

export function useStorage<K extends StorageKey>(key: K): [boolean, StorageMap[K] | undefined] {

    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<StorageMap[K] | undefined>();
    const getSnapshot = () => snapshot;

    const subscribeStorage = subscribeFactory(key);
    const subscribe = (callback: () => void) => {
        const unsubscribe = subscribeStorage((newData) => {
            // console.log(`${key} update to ${newData}`)
            setSnapshot(newData);
            callback();  // trigger re-render by useSyncExternalStore
        });
        return unsubscribe;
    };

    // Initial data
    useEffect(() => {
        let cancel = false;
        setLoading(true);
        getStorage(key).then((data) => {

            if (!cancel) {
                setLoading(false);
                setSnapshot(data);
            }
        })
        return () => { cancel = true; setLoading(false); }
    }, [key]);

    // console.log('re-render: ', snapshot);



    // const data = useSyncExternalStore(subscribe, getSnapshot);
    useSyncExternalStore(subscribe, getSnapshot);
    return [loading, snapshot];
}