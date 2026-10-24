import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard PageErrorBoundary caught:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-foreground">
              {tr("Something went wrong")}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              {tr("An error occurred while displaying this page. Try reloading or return to the dashboard.")}
            </p>
            {this.state.error?.message && (
              <p className="mb-6 rounded bg-muted p-2.5 font-mono text-xs text-destructive break-all text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" onClick={this.handleReset}>
                <RefreshCcw className="size-3.5" /> {tr("Try again")}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/">
                  <LayoutDashboard className="size-3.5" /> {tr("Dashboard")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
