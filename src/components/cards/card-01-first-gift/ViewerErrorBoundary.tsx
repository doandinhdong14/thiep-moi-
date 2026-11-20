"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ViewerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Card01FirstGift] ViewerErrorBoundary caught:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#060b18",
            color: "#f8fafc",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={28} color="#f59e0b" />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Không thể khởi tạo hiệu ứng 3D trên thiết bị này
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ViewerErrorBoundary;
