import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload the page
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
          {/* Animated background gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-destructive/5 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.15),transparent_50%)]" />
          
          {/* Animated grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8"
            >
              {/* Icon with animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 border-4 border-destructive/30 mb-8 relative"
              >
                <XCircle className="w-16 h-16 text-destructive drop-shadow-lg" />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-destructive/30 blur-xl"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
                <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                <span className="text-sm font-semibold text-destructive uppercase tracking-wide">
                  Application Error
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-destructive via-destructive/80 to-destructive bg-clip-text text-transparent">
                Something Went Wrong
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                The app encountered an unexpected error. Our AI agents are working on it, but in the meantime, 
                you can try refreshing or returning home.
              </p>

              {/* Error details (collapsible) */}
              {this.state.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.5 }}
                  className="mb-8 p-6 rounded-lg bg-card/60 backdrop-blur-md border border-border/50 max-w-2xl mx-auto text-left"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Bug className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-destructive mb-2">Error Details</h3>
                      <p className="text-sm text-muted-foreground font-mono break-all bg-muted/50 p-3 rounded border border-border/30">
                        {this.state.error.toString()}
                      </p>
                      {this.state.error.stack && (
                        <details className="mt-3">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                            View Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs text-muted-foreground font-mono overflow-auto max-h-48 bg-muted/30 p-3 rounded border border-border/30">
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  size="lg"
                  onClick={this.handleReset}
                  className="bg-destructive hover:bg-destructive/90 text-lg px-8 py-6 shadow-xl shadow-destructive/30 hover:shadow-destructive/50 transition-all duration-300 hover:scale-105 group"
                >
                  <RefreshCw className="mr-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Try Again
                </Button>
                
                <Link to="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 group backdrop-blur-sm"
                  >
                    <Home className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Go Home
                  </Button>
                </Link>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 pt-8 border-t border-border/50"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Quick actions:
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                      <Zap className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-destructive/20 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                }}
                animate={{
                  y: [
                    null,
                    Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                  ],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

export default ErrorBoundary;
