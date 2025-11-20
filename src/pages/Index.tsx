import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, TrendingUp, Target, Zap, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Process live telemetry data to provide instant insights on car performance, tire wear, and race strategy."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Predictive Tire Models",
      description: "AI algorithms forecast tire degradation and recommend optimal pit stop windows with 95% accuracy."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Driver Performance",
      description: "Analyze driver inputs and provide actionable feedback to improve lap times and consistency."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Strategy Optimization",
      description: "Simulate race scenarios to determine the optimal strategy for qualifying and race conditions."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Track-Specific Models",
      description: "Custom AI models trained on data from all 7 GR Cup tracks for circuit-specific insights."
    },
    {
      icon: <Flag className="w-6 h-6" />,
      title: "Live Gap Analysis",
      description: "Monitor real-time gaps to competitors and calculate overtaking opportunities."
    }
  ];

  const tracks = [
    { name: "Circuit of the Americas", location: "Austin, Texas", length: "3.427 miles", turns: 20 },
    { name: "Road America", location: "Elkhart Lake, Wisconsin", length: "4.048 miles", turns: 14 },
    { name: "Sebring International", location: "Sebring, Florida", length: "3.74 miles", turns: 17 },
    { name: "Sonoma Raceway", location: "Sonoma, California", length: "2.52 miles", turns: 12 },
    { name: "Barber Motorsports Park", location: "Birmingham, Alabama", length: "2.38 miles", turns: 17 },
    { name: "Virginia International", location: "Alton, Virginia", length: "3.27 miles", turns: 17 },
    { name: "Mid-Ohio Sports Car Course", location: "Lexington, Ohio", length: "2.4 miles", turns: 15 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold">
              PitWall<span className="text-primary">AI</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#tracks" className="text-sm font-medium hover:text-primary transition-colors">Tracks</a>
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          </nav>
          <Link to="/dashboard">
            <Button className="bg-primary hover:bg-primary/90">View Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Real-Time Strategy for the <span className="text-primary">GR Cup</span> Pit Wall
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered analytics and predictive modeling to optimize race strategy, tire management, and driver performance in the Toyota GR Cup series.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                View Live Demo
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Download Datasets
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Racing Intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              PitWall AI combines telemetry data, predictive modeling, and real-time analytics to give your team the competitive edge.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur hover:bg-card/70 transition-all hover:scale-105 border-border">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-4 text-primary-foreground">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section id="tracks" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">GR Cup Track Analytics</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive data and models for all 7 tracks in the Toyota GR Cup North America series.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 border-border">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-primary" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{track.name}</h3>
                  <p className="text-muted-foreground mb-4">{track.location}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Length: {track.length}</span>
                    <span>Turns: {track.turns}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-6 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Interactive Dashboard Preview</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the power of PitWall AI with our real-time analytics dashboard.
            </p>
          </div>
          <Card className="overflow-hidden border-border">
            <div className="bg-card border-b border-border p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">PitWall AI - Live Race Analytics</h3>
                  <p className="text-muted-foreground">Circuit of the Americas - Lap 12/25</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live Data</span>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 text-primary">Tire Wear Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Front Left</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Front Right</span>
                      <span className="font-semibold">82%</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Rear Left</span>
                      <span className="font-semibold text-primary">71%</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Rear Right</span>
                      <span className="font-semibold">75%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 text-primary">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Current Lap</span>
                      <span className="font-semibold">2:04.56</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Best Lap</span>
                      <span className="font-semibold">2:03.12</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Gap to Leader</span>
                      <span className="font-semibold">+1.24s</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-sm">Predicted Finish</span>
                      <span className="font-semibold text-primary">P3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="p-6 border-t border-border text-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Open Full Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Race Strategy?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the Toyota GR Cup hackathon or request early access to PitWall AI for your racing team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Join Hackathon
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-xl font-bold">PitWall<span className="text-primary">AI</span></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time analytics and strategy platform for the Toyota GR Cup series.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-primary">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-primary">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GR Cup Data</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-primary">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 PitWall AI. Created for the Toyota GR Cup "Hack the Track" Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
