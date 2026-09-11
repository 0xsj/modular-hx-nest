import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";
import { ErrorSurface } from "~/components/feedback";
import { TooltipProvider } from "~/components/overlays";
import { asFailure } from "~/lib/kernel";
import "~/styles/index.css";
export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>flover-solid</Title>
          <TooltipProvider>
            <ErrorBoundary
              fallback={(error, reset) => {
                if (import.meta.env.DEV) console.error(error);
                return (
                  <ErrorSurface failure={asFailure(error)} onRetry={reset} />
                );
              }}
            >
              <Suspense>{props.children}</Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
