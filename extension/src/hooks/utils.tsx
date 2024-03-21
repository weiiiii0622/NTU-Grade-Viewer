import { useEffect, useState } from "react";

export function useWindowSize(): [number, number] {
    const [size, setSize] = useState<[number, number]>([window.innerWidth, window.innerHeight]);

    useEffect(() => {
        const handler = () => setSize([window.innerWidth, window.innerHeight]);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return size;
}

export function useElementEventHandler<T extends HTMLElement, K extends keyof HTMLElementEventMap>(
    props: { ref: React.MutableRefObject<T>, name: K, handler(ev: HTMLElementEventMap[K]): void }
) {
    const { ref, name, handler } = props;
    useEffect(() => {
        if (!ref.current)
            return;
        ref.current.addEventListener(name, handler);
        return () => ref.current.removeEventListener(name, handler)
    }, [name, handler]);
}