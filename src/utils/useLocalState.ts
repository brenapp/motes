import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export function useLocalStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const value = localStorage.getItem(identifier);
        if (value) {
            try {
                setState(JSON.parse(value));
            } catch (e) {
                console.error(`Failed to parse local storage value for ${identifier}`);
            }
        }
        setHydrated(true);
    }, [identifier]);

    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(identifier, JSON.stringify(state));
        }
    }, [state, hydrated, identifier])

    return [state, setState];
}

export function useSessionStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const value = sessionStorage.getItem(identifier);
        if (value) {
            try {
                setState(JSON.parse(value));
            } catch (e) {
                console.error(`Failed to parse session storage value for ${identifier}`);
            }
        }
        setHydrated(true);
    }, [identifier]);

    useEffect(() => {
        if (!hydrated) {
            sessionStorage.setItem(identifier, JSON.stringify(state));
        }
    }, [state, hydrated, identifier])

    return [state, setState];
}
