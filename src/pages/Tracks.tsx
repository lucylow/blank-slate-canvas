import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Flag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Tracks = () => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const tracks = [
    { 
      name: "Circuit of the Americas", 
      location: "Austin, Texas", 
      length: "3.427 miles", 
      turns: 20,
      description: "A challenging circuit featuring elevation changes and a mix of technical and high-speed sections."
    },
    { 
      name: "Road America", 
      location: "Elkhart Lake, Wisconsin", 
      length: "4.048 miles", 
      turns: 14,
      description: "One of America's fastest permanent road courses with long straights and sweeping corners."
    },
    { 
      name: "Sebring International", 
      location: "Sebring, Florida", 
      length: "3.74 miles", 
      turns: 17,
      description: "Famous for its bumpy surface and demanding layout, testing both driver and machine."
    },
    { 
      name: "Sonoma Raceway", 
      location: "Sonoma, California", 
      length: "2.52 miles", 
      turns: 12,
      description: "Technical circuit set in wine country with elevation changes and tight corners."
    },
    { 
      name: "Barber Motorsports Park", 
      location: "Birmingham, Alabama", 
      length: "2.38 miles", 
      turns: 17,
      description: "A beautiful and flowing circuit known for its smooth surface and technical complexity."
    },
    { 
      name: "Virginia International", 
      location: "Alton, Virginia", 
      length: "3.27 miles", 
      turns: 17,
      description: "Historic track with a perfect blend of fast and technical sections."
    },
    { 
      name: "Mid-Ohio Sports Car Course", 
      location: "Lexington, Ohio", 
      length: "2.4 miles", 
      turns: 15,
      description: "Challenging circuit with blind corners and elevation changes."
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
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">GR Cup Tracks</h1>
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
              GR Cup Track Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Comprehensive data and AI models for all 7 tracks in the Toyota GR Cup North America series.
            </p>
          </motion.div>

          {/* Tracks Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 bg-card/60 backdrop-blur-sm cursor-pointer"
                  onClick={() => setSelectedTrack(selectedTrack === track.name ? null : track.name)}
                >
                  <div className="h-48 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <MapPin className="w-20 h-20 text-primary relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">{track.name}</h3>
                      <Flag className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      {track.location}
                    </p>
                    {selectedTrack === track.name && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-muted-foreground mb-4"
                      >
                        {track.description}
                      </motion.p>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Length</span>
                        <span className="text-sm font-semibold">{track.length}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Turns</span>
                        <span className="text-sm font-semibold">{track.turns}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Track Data Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">Track Data Summary</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Telemetry Points</p>
                    <p className="text-2xl font-bold">41.9M+</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unique Vehicles</p>
                    <p className="text-2xl font-bold">397</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Race Duration</p>
                    <p className="text-2xl font-bold">45.8 min</p>
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

export default Tracks;

