import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Root from "./Root";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

// apply the saved theme before the first paint
try {
  const ui = JSON.parse(localStorage.getItem("bs-admin-ui") ?? "{}") as { state?: { dark?: boolean } };
  document.documentElement.classList.toggle("dark", !!ui.state?.dark);
} catch {
  /* default theme */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>,
);
