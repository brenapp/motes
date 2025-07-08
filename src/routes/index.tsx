import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  composeListeners,
  useKeyboardShortcut,
  onKeydown,
} from "../utils/useKeyboardShortcut";
import useLocalStorageState from "use-local-storage-state";

const serializer = {
  stringify: (value: unknown) => `${value}`,
  parse: (value: string) => value,
};

type Note = {
  id: string;
  contents: string;
  createdAt: number;
  sentToTodoist: boolean;
};

const Index: React.FC = () => {
  const input = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState<string>("");
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate({ from: "/" });

  const [notes, setNotes] = useLocalStorageState<Note[]>("notes", {
    defaultValue: [],
  });

  const [apiKey] = useLocalStorageState<string | undefined>(
    "options.motes.apiKey",
    {
      defaultValue: undefined,
      serializer,
    },
  );
  const [projectId] = useLocalStorageState<string | undefined>(
    "options.motes.projectId",
    { defaultValue: undefined, serializer },
  );
  const [sectionId] = useLocalStorageState<string | undefined>(
    "options.motes.sectionId",
    { defaultValue: undefined, serializer },
  );

  const api = useMemo(() => {
    if (!apiKey) return null;
    return new TodoistApi(apiKey);
  }, [apiKey]);

  // Keyboard shortcuts
  useKeyboardShortcut({
    key: (ev) =>
      ["n", "ArrowUp"].includes(ev.key) &&
      document.activeElement !== input.current,
    preventDefault: true,
    callback: () => input.current?.focus(),
  });

  useKeyboardShortcut({
    key: ",",
    ctrlKey: true,
    preventDefault: true,
    callback: () => navigate({ to: "/options" }),
  });

  useKeyboardShortcut({
    key: "ArrowDown",
    preventDefault: true,
    stopPropagation: true,
    callback: () => {
      const note = notes[0];
      if (!note) return;
      noteRefs.current[note.id]?.focus();
    },
  });

  useEffect(() => {
    input.current!.style.height = "0px";
    const scrollHeight = input.current!.scrollHeight;
    input.current!.style.height = scrollHeight + "px";
  }, [note]);

  // Input Keyboard Shortcuts
  const onInputKeydownEnter = onKeydown({
    key: (event) => event.key === "Enter" && event.ctrlKey && note.length > 0,
    preventDefault: true,
    stopPropagation: true,
    callback: () => {
      onNoteAdd(note);
      setNote("");
    },
  });

  const onInputKeydownArrowDown = onKeydown({
    key: (event) => event.key === "ArrowDown" && notes.length > 0,
    stopPropagation: true,
    preventDefault: true,
    callback: () => {
      const note = notes[0];
      if (!note) return;
      noteRefs.current[note.id]?.focus();
    },
  });

  const onInputKeydownArrowUp = onKeydown({
    key: (event) => event.key === "ArrowUp" && notes.length > 0,
    stopPropagation: true,
    preventDefault: true,
    callback: () => {
      const note = notes[notes.length - 1]!;
      noteRefs.current[note.id]?.focus();
    },
  });

  const onInputKeydown = composeListeners(
    onInputKeydownEnter,
    onInputKeydownArrowUp,
    onInputKeydownArrowDown,
  );

  function onNoteAdd(contents: string) {
    setNotes((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        contents,
        createdAt: Date.now(),
        sentToTodoist: false,
      },
    ]);
  }

  function onNoteDelete(index: number) {
    return () => {
      setNotes((prev) => prev.filter((_, i) => i !== index));
    };
  }
  function onNoteEdit(index: number) {
    return () => {
      const contents = notes[index]?.contents;
      setNote(contents ?? "");

      input.current?.focus();
      onNoteDelete(index)();
    };
  }

  function onNoteSend(index: number) {
    return () => {
      const dueString =
        localStorage.getItem("options.motes.dueString") ?? undefined;
      const content = notes[index]?.contents;
      if (content) {
        const [title, ...rest] = content.split("\n");
        api?.addTask({
          content: title ?? "Meeting Note",
          description: rest.join("\n"),
          projectId,
          sectionId,
          dueString,
        });

        setNotes((prev) => {
          prev[index]!.sentToTodoist = true;
          return [...prev];
        });
      }
    };
  }

  const onNoteKeydown = (index: number) => {
    const onNoteKeydownD = onKeydown({
      key: (ev) => ["d", "ArrowLeft"].includes(ev.key),
      stopPropagation: true,
      callback: () => {
        const next = notes[index + 1];
        const previous = notes[index - 1];
        onNoteDelete(index)();

        // Using set timeout here to wait for the note to be removed from the dom and for react to
        // be rerendered.
        setTimeout(() => {
          if (next) {
            noteRefs.current[next.id]?.focus();
          } else if (previous) {
            noteRefs.current[previous.id]?.focus();
          } else {
            input.current?.focus();
          }
        }, 0);
      },
    });

    const onNoteKeydownE = onKeydown({
      key: "e",
      stopPropagation: true,
      preventDefault: true,
      callback: () => {
        onNoteEdit(index)();
      },
    });

    const onNoteKeydownT = onKeydown({
      key: (ev) => ["t", "ArrowRight"].includes(ev.key),
      stopPropagation: true,
      callback: () => {
        onNoteSend(index)();
      },
    });

    const onNoteKeydownArrowDown = onKeydown({
      key: "ArrowDown",
      stopPropagation: true,
      callback: () => {
        const next = notes[index + 1];
        if (next) {
          const ref = noteRefs.current[next.id];
          ref?.focus();
        } else {
          input.current?.focus();
        }
      },
    });

    const onNoteKeydownArrowUp = onKeydown({
      key: "ArrowUp",
      stopPropagation: true,
      callback: () => {
        const prev = notes[index - 1];
        if (prev) {
          const ref = noteRefs.current[prev.id];
          ref?.focus();
        } else {
          input.current?.focus();
        }
      },
    });

    return composeListeners(
      onNoteKeydownD,
      onNoteKeydownE,
      onNoteKeydownT,
      onNoteKeydownArrowDown,
      onNoteKeydownArrowUp,
    );
  };

  return (
    <>
      <nav className="fixed top-4 right-4 dark:text-white/50">
        <Link to="/options" className="group outline-none hover:border">
          <div className="flex gap-2 rounded-md p-4 group-focus-within:border hover:bg-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <p>
              Options{" "}
              <span className="hidden group-focus-within:inline">
                <span className="rounded-md bg-white/10 p-1 font-mono text-xs">
                  Ctrl
                </span>{" "}
                <span className="rounded-md bg-white/10 p-1 px-2 font-mono text-xs">
                  ,
                </span>
              </span>
            </p>
          </div>
        </Link>
      </nav>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 pt-24">
        <main className="flex w-full flex-col gap-4 rounded-xl bg-zinc-900/10 p-4 focus-within:border dark:bg-white/10 dark:text-white">
          <h1 className="text-lg">Create Note</h1>
          <textarea
            ref={input}
            id="note"
            onKeyDown={onInputKeydown}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Create Note. Press Ctrl-Enter to submit note. When outside this textarea, press n to focus."
            className="rounded-lg bg-transparent font-mono text-2xl outline-none"
            autoFocus
          ></textarea>
          <nav className="flex items-center justify-between">
            <p className="right-4 text-sm dark:text-white/50">
              Press <code className="rounded-md px-2">n</code> to focus. Press
              Ctrl-Enter to create note.
            </p>
            <button
              className="flex rounded-md px-4 py-2 hover:bg-white/10 dark:bg-white/5 dark:text-white/50 hover:dark:text-white"
              tabIndex={-1}
              onClick={() => {
                onNoteAdd(note);
                setNote("");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span className="ml-2">Create</span>
            </button>
          </nav>
        </main>
        <section className="container flex flex-col gap-4" role="list">
          {notes.map((note, i) => (
            <div
              key={note.id}
              ref={(el) => {
                noteRefs.current[note.id] = el;
              }}
              className={
                "group flex flex-col rounded-lg p-4 outline-none hover:shadow-lg md:flex-row md:items-center md:gap-4 dark:bg-white/10 " +
                (note.sentToTodoist
                  ? "border border-green-600 focus:border-green-400 focus:bg-green-500/20 dark:bg-green-500/10"
                  : "focus:border dark:focus:border-white/50")
              }
              tabIndex={0}
              aria-label={`Note: ${note.contents} ${new Date(
                note.createdAt,
              ).toLocaleTimeString()} Press d to delete, and press t to send to todoist. Use arrow keys or tab to navigate.`}
              role="listitem"
              onKeyDown={onNoteKeydown(i)}
            >
              <p className="text-opacity-75 w-max font-mono text-sm dark:text-white">
                {new Date(note.createdAt).toLocaleTimeString()}
              </p>
              <pre className="flex-1 overflow-x-hidden font-mono text-xl outline-none group-focus-within:overflow-x-auto dark:text-white">
                {note.contents}
              </pre>
              <nav className="mt-2 ml-auto flex transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
                <button
                  className="mx-2 rounded-md border px-4 dark:border-white/50 dark:text-white dark:hover:bg-white/50"
                  onClick={onNoteEdit(i)}
                >
                  <code className="rounded-md pr-2">e</code>
                  Edit
                </button>
                <button
                  className="mx-2 rounded-md border px-4 dark:border-white/50 dark:text-white dark:hover:bg-white/50"
                  onClick={onNoteDelete(i)}
                >
                  <code className="rounded-md pr-2">d</code>
                  Delete
                </button>
                <button
                  className="mx-2 rounded-md border px-4 dark:border-white/50 dark:text-white dark:hover:bg-white/50"
                  onClick={onNoteSend(i)}
                >
                  <code className="rounded-md pr-2">t</code>
                  Todoist
                </button>
              </nav>
            </div>
          ))}
        </section>
      </div>
    </>
  );
};
export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    title: "Motes - Quick Meeting Notes",
    meta: [{ name: "description", content: "Quickly take meeting notes" }],
  }),
});
