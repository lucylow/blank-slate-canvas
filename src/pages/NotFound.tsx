import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Home, ArrowLeft, Zap, Flag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          {/* Icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-4 border-primary/30 mb-8 relative"
          >
            <AlertTriangle className="w-16 h-16 text-primary drop-shadow-lg" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-8xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            404
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Page Not Found
            </h2>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Oops! The page you're looking for seems to have taken a wrong turn at the track. 
            It might be in the pits or racing somewhere else.
          </p>

          {/* Error details (collapsible) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 max-w-md mx-auto"
          >
            <p className="text-sm text-muted-foreground font-mono break-all">
              <span className="text-primary font-semibold">Path:</span> {location.pathname}
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
              >
                <Home className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                Return to Home
              </Button>
            </Link>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="text-lg px-8 py-6 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 group backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </motion.div>

          {/* Additional help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 pt-8 border-t border-border/50"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Need help navigating? Try these pages:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Zap className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/tracks">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Flag className="w-4 h-4 mr-2" />
                  Tracks
                </Button>
              </Link>
              <Link to="/agents">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Agents
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                opacity: [0.2, 0.5, 0.2],
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
    </div>
  );
};

export default NotFound;
