import { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; message?: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary fångade fel:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card-surface p-6 max-w-md text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Något gick fel</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.message ?? "Ett oväntat fel uppstod."}
            </p>
            <button
              onClick={() => location.reload()}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              Ladda om sidan
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
