import { Dispatch, SetStateAction, useEffect, useState } from "react";


export function useLocalStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const value = localStorage.getItem(identifier);
        if (value) {
            setState(JSON.parse(value));
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(identifier, JSON.stringify(state));
        }
    }, [state, hydrated])

    return [state, setState];
}

export function useSessionStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const value = sessionStorage.getItem(identifier);
        if (value) {
            setState(JSON.parse(value));
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) {
            sessionStorage.setItem(identifier, JSON.stringify(state));
        }
    }, [state, hydrated])

    return [state, setState];
}
