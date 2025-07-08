import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { queryClient } from "../utils/client";

import "../styles/globals.css";

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center bg-zinc-100 dark:bg-zinc-800">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </QueryClientProvider>
  ),
});
