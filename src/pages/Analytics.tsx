import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Activity, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Analytics = () => {
  const analyticsData = [
    {
      title: "Lap Time Analysis",
      value: "2:03.12",
      change: "-0.8s",
      trend: "improving",
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-500"
    },
    {
      title: "Tire Performance",
      value: "78%",
      change: "+2.3%",
      trend: "stable",
      icon: <PieChart className="w-5 h-5" />,
      color: "text-blue-500"
    },
    {
      title: "Fuel Efficiency",
      value: "4.2 L/lap",
      change: "-0.3 L",
      trend: "improving",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-green-500"
    },
    {
      title: "Consistency Score",
      value: "99.76%",
      change: "+0.12%",
      trend: "improving",
      icon: <Target className="w-5 h-5" />,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Analytics</h1>
            </div>
          </div>
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90">
              View Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Performance Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Deep dive into race performance metrics, trends, and insights to optimize your strategy.
            </p>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {analyticsData.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-primary/10 ${metric.color}`}>
                        {metric.icon}
                      </div>
                      <span className={`text-sm font-semibold ${metric.color}`}>
                        {metric.change}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {metric.title}
                    </h3>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Lap Time Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <p>Lap time chart visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Tire Wear Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <p>Tire wear chart visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Driver Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Driver Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                    <span className="font-medium">Sector 1 Best Time</span>
                    <span className="font-mono font-bold">26.961s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                    <span className="font-medium">Sector 2 Best Time</span>
                    <span className="font-mono font-bold">43.148s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                    <span className="font-medium">Sector 3 Best Time</span>
                    <span className="font-mono font-bold">29.145s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="font-medium">Overall Best Lap</span>
                    <span className="font-mono font-bold text-primary">99.284s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;

