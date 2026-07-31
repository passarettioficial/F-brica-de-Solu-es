import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Erro não tratado na árvore de componentes:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-semibold text-foreground">Algo deu errado nesta tela</h1>
          <p className="text-sm text-muted-foreground">
            Encontramos um erro inesperado ao carregar esta parte da página. Seus dados estão salvos — recarregue para tentar novamente.
          </p>
          <Button onClick={this.handleReload} data-testid="button-error-boundary-reload">
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }
}
