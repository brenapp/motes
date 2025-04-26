import { useEffect } from "react";

type OptionsKey = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

type OptionsFunction = {
  key: (event: KeyboardEvent) => boolean;
};

type OptionsBoth = {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  callback: (event: KeyboardEvent) => void;
};

export type Options = (OptionsKey | OptionsFunction) & OptionsBoth;

function keyMatches(key: boolean, match?: boolean) {
  return match === undefined || match === key;
}

export function useKeyboardShortcut(options: Options) {
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (typeof options.key === "string") {
        if (event.key !== options.key) {
          return;
        }

        // @ts-expect-error - TS can't discriminate the type of options.key properly
        if (!keyMatches(event.metaKey, options.metaKey)) {
          return;
        }

        // @ts-expect-error - TS can't discriminate the type of options.key properly
        if (!keyMatches(event.ctrlKey, options.ctrlKey)) {
          return;
        }

        // @ts-expect-error - TS can't discriminate the type of options.key properly
        if (!keyMatches(event.altKey, options.altKey)) {
          return;
        }

        // @ts-expect-error - TS can't discriminate the type of options.key properly
        if (!keyMatches(event.shiftKey, options.shiftKey)) {
          return;
        }

        if (options.preventDefault) {
          event.preventDefault();
        }

        if (options.stopPropagation) {
          event.stopPropagation();
        }

        options.callback(event);
      } else if (typeof options.key === "function") {
        if (!options.key(event)) {
          return;
        }

        if (options.preventDefault) {
          event.preventDefault();
        }

        if (options.stopPropagation) {
          event.stopPropagation();
        }

        options.callback(event);
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [options.key, options.callback, options]);
}

export function onKeydown<T>(
  options: Options,
): (event: React.KeyboardEvent<T>) => void {
  return (event: React.KeyboardEvent<T>) => {
    if (typeof options.key === "string") {
      if (event.key !== options.key) {
        return;
      }

      // @ts-expect-error - TS can't discriminate the type of options.key properly
      if (!keyMatches(event.metaKey, options.metaKey)) {
        return;
      }

      // @ts-expect-error - TS can't discriminate the type of options.key properly
      if (!keyMatches(event.ctrlKey, options.ctrlKey)) {
        return;
      }

      // @ts-expect-error - TS can't discriminate the type of options.key properly
      if (!keyMatches(event.altKey, options.altKey)) {
        return;
      }

      // @ts-expect-error - TS can't discriminate the type of options.key properly
      if (!keyMatches(event.shiftKey, options.shiftKey)) {
        return;
      }

      if (options.preventDefault) {
        event.preventDefault();
      }

      if (options.stopPropagation) {
        event.stopPropagation();
      }

      options.callback(event.nativeEvent);
    } else if (typeof options.key === "function") {
      if (!options.key(event.nativeEvent)) {
        return;
      }

      if (options.preventDefault) {
        event.preventDefault();
      }

      if (options.stopPropagation) {
        event.stopPropagation();
      }

      options.callback(event.nativeEvent);
    }
  };
}

export function composeListeners(
  ...listeners: ((event: React.KeyboardEvent) => void)[]
) {
  return (event: React.KeyboardEvent) => {
    for (const listener of listeners) {
      listener(event);
    }
  };
}
