import { type ErrorInfo, type ReactNode, Component } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-900 px-6 text-center text-neutral-100">
          <p className="text-sm font-medium">Something went wrong loading the app.</p>
          <pre className="max-h-40 max-w-full overflow-auto rounded border border-neutral-600 bg-black/40 p-3 text-left text-xs text-red-300">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="border border-neutral-500 px-4 py-2 text-sm hover:bg-neutral-800"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
