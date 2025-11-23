import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, ArrowLeft, ArrowRight, Sparkles, Target, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const About = () => {
  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "AI-Powered Predictions",
      description: "Machine learning models trained on millions of telemetry data points for accurate tire wear and strategy predictions."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Process live race data to provide instant insights and recommendations during the race."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Built for Teams",
      description: "Designed specifically for racing teams competing in the Toyota GR Cup North America series."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <Flag className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">About PitWall AI</h1>
            </div>
          </div>
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
              View Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Race Intelligence</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              PitWall AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Real-time race strategy & tire intelligence for the Toyota GR Cup. Predict tire loss, recommend pit windows, and get explainable radio-ready guidance — live.
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01]">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Target className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Our Mission</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  PitWall AI was created to revolutionize race strategy decision-making for the Toyota GR Cup series. 
                  By combining advanced machine learning algorithms with real-time telemetry data, we provide racing 
                  teams with actionable insights that can make the difference between winning and losing.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform processes millions of data points across 7 tracks, analyzing tire wear patterns, 
                  driver performance, and race conditions to deliver predictions with 95% accuracy. Whether you're 
                  deciding when to pit, adjusting tire pressure, or optimizing fuel strategy, PitWall AI gives you 
                  the confidence to make split-second decisions.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="group bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 h-full overflow-hidden relative">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardContent className="p-6 relative z-10">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h4>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Hackathon Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/30 border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01] relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[size:30px_30px] opacity-0 hover:opacity-100 transition-opacity duration-700" />
              
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Flag className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Built for "Hack the Track"</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  PitWall AI was developed as part of the Toyota GR Cup "Hack the Track" Hackathon. 
                  Our team combined expertise in data science, machine learning, and racing to create 
                  a comprehensive platform that demonstrates the power of AI in motorsports.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The platform integrates data from multiple GR Cup tracks, including Circuit of the 
                  Americas, Road America, Sebring, Sonoma, Barber Motorsports Park, Virginia International, 
                  and Mid-Ohio, providing track-specific insights and predictions.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Powered by Data</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { value: "41.9M+", label: "Telemetry Data Points" },
                    { value: "7", label: "Track Models" },
                    { value: "95%", label: "Prediction Accuracy" }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center p-6 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 hover:border-primary/30 transition-all duration-300"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-12 text-center"
          >
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 group"
              >
                Try PitWall AI Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default About;


