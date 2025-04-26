import {
  TodoistApi,
  type Project,
  type Section,
} from "@doist/todoist-api-typescript";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { queryClient } from "../utils/client";
import useLocalStorageState from "use-local-storage-state";

type ProjectsData = {
  projects: Project[];
  sections: Record<string, Section[]>;
};

async function getProjectsData(apiKey?: string | null): Promise<ProjectsData> {
  console.log(apiKey);
  if (!apiKey) {
    return { projects: [], sections: {} };
  }

  const api = new TodoistApi(apiKey);
  const projects = await api.getProjects().then((projects) => projects.results);
  const projectSections = await Promise.all(
    projects.map(async (project) => ({
      id: project.id,
      sections: (await api.getSections({ projectId: project.id })).results,
    })),
  );

  const sectionsMap: Record<string, Section[]> = {};
  for (const { id, sections } of projectSections) {
    sectionsMap[id] = sections;
  }
  return { projects, sections: sectionsMap };
}

const serializer = {
  stringify: (value: unknown) => `${value}`,
  parse: (value: string) => value,
};

const projectsQueryOptions = (apiKey?: string | null) =>
  queryOptions({
    queryKey: ["projects", apiKey],
    queryFn: () => getProjectsData(apiKey),
  });

const Options: React.FC = () => {
  const [apiKey, setApiKey] = useLocalStorageState<string | undefined>(
    "options.apiKey",
    { defaultValue: undefined, serializer },
  );
  const [projectId, setProjectId] = useLocalStorageState<string | undefined>(
    "options.projectId",
    { defaultValue: undefined, serializer },
  );
  const [sectionId, setSectionId] = useLocalStorageState<string | undefined>(
    "options.sectionId",
    { defaultValue: undefined, serializer },
  );

  const [dueString, setDueString] = useLocalStorageState<string | undefined>(
    "options.dueString",
    { defaultValue: undefined, serializer },
  );

  const {
    data: { projects, sections },
  } = useSuspenseQuery(projectsQueryOptions(apiKey));

  return (
    <>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 py-16">
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <span className="text-[hsl(280,100%,70%)]">Options</span>
          </h1>
          <section className="w-full">
            <Link
              to="/"
              className="flex w-max flex-col rounded-md bg-white/10 p-4 px-8 text-white focus-within:border"
            >
              Back
            </Link>
          </section>
          <section className="flex w-full flex-col gap-4 rounded-xl bg-white/10 p-4 text-white focus-within:border">
            <h1 className="text-lg">Todoist Key</h1>
            <input
              aria-label="Todoist API Key"
              id="options.apiKey"
              className="rounded-lg bg-transparent font-mono text-xl outline-none"
              value={apiKey ?? ""}
              onChange={(e) => setApiKey(e.target.value)}
            ></input>
            <label
              htmlFor="options.apiKey"
              className="right-4 text-sm text-white/50"
            >
              Used to sync notes with Todoist. You can find your API Key in
              Settings → Integrations → Developer. Your key is stored locally on
              this device.
            </label>
          </section>
          <section className="flex w-full flex-col gap-4 rounded-xl bg-white/10 p-4 text-white focus-within:border">
            <h1 className="text-lg">Todoist Project</h1>
            <select
              aria-label="Todoist Project"
              id="options.project"
              className="w-min rounded-lg bg-transparent pr-4 font-mono text-xl outline-none"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((project) => (
                <option
                  value={project.id}
                  label={project.name}
                  key={project.id}
                />
              ))}
            </select>
            <label
              htmlFor="options.project"
              className="right-4 text-sm text-white/50"
            >
              When tasks are sent to Todoist, they will be added to this
              project.
            </label>
          </section>
          {projectId && (
            <section className="flex w-full flex-col gap-4 rounded-xl bg-white/10 p-4 text-white focus-within:border">
              <h1 className="text-lg">Todoist Section</h1>
              <select
                aria-label="Todoist Project"
                id="options.project"
                className="w-min rounded-lg bg-transparent pr-4 font-mono text-xl outline-none"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!projectId || !sections[projectId]}
              >
                {sections[projectId]?.map((project) => (
                  <option
                    value={project.id}
                    label={project.name}
                    key={project.id}
                  />
                ))}
              </select>
              <label
                htmlFor="options.project"
                className="right-4 text-sm text-white/50"
              >
                When tasks are sent to Todoist, they will be added to this
                project.
              </label>
            </section>
          )}
          <section className="flex w-full flex-col gap-4 rounded-xl bg-white/10 p-4 text-white focus-within:border">
            <h1 className="text-lg">Due Date</h1>
            <select
              aria-label="Due Date"
              className="w-min rounded-lg bg-transparent pr-4 font-mono text-xl outline-none"
              value={dueString}
              onChange={(e) => setDueString(e.target.value)}
            >
              <option value="">No Date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
            <label htmlFor="options.dueString">
              When tasks are sent to Todoist, they will be added with this due
              date
            </label>
          </section>
        </div>
      </main>
    </>
  );
};

export const Route = createFileRoute("/options")({
  component: Options,
  loader: () => {
    return queryClient.ensureQueryData(
      projectsQueryOptions(localStorage.getItem("options.apiKey")),
    );
  },
  head: () => ({
    title: "Options - Motes",
    meta: [{ name: "description", content: "Quickly take meeting notes" }],
  }),
});
