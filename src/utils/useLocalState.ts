import { Dispatch, SetStateAction, useEffect, useState } from "react";


export function useLocalStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(() => {

        if (typeof window === 'undefined') {
            return initial;
        }

        const value = localStorage.getItem(identifier);
        if (value) {
            return JSON.parse(value);
        }
        return initial;
    });

    useEffect(() => {
        localStorage.setItem(identifier, JSON.stringify(state));
    }, [state])

    return [state, setState];
}

export function useSessionStorage<T>(identifier: string, initial: T): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initial);

    useEffect(() => {
        const value = sessionStorage.getItem(identifier);
        if (value) {
            setState(JSON.parse(value));
        }
    }, [])

    useEffect(() => {
        sessionStorage.setItem(identifier, JSON.stringify(state));
    }, [state])

    return [state, setState];
}
