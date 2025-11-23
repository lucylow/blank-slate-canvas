import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Flag, ArrowLeft, FileText, ExternalLink, TrendingUp, Activity, Zap, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RaceAnalysis from "@/components/RaceAnalysis";

// Track configuration with PDF map references
// Maps track names to PDF filenames in public/track-maps/
const TRACK_PDF_MAP: Record<string, string> = {
  "Circuit of the Americas": "COTA_Circuit_Map.pdf",
  "Road America": "Road_America_Map.pdf",
  "Sebring International": "Sebring_Track_Sector_Map.pdf",
  "Sonoma Raceway": "Sonoma_Map.pdf",
  "Barber Motorsports Park": "Barber_Circuit_Map.pdf",
  "Virginia International": "VIR_mapk.pdf",
  "Indianapolis Motor Speedway": "Indy_Circuit_Map.pdf",
};

// Track SVG mapping
const TRACK_SVG_MAP: Record<string, string> = {
  "Circuit of the Americas": "cota.svg",
  "Road America": "road_america.svg",
  "Sebring International": "sebring.svg",
  "Sonoma Raceway": "sonoma.svg",
  "Barber Motorsports Park": "barber.svg",
  "Virginia International": "virginia.svg",
  "Indianapolis Motor Speedway": "indianapolis.svg",
};

const Tracks = () => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [viewingMap, setViewingMap] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  const tracks = [
    { 
      name: "Circuit of the Americas", 
      location: "Austin, Texas", 
      length: "3.427 miles", 
      turns: 20,
      id: "cota",
      description: "A challenging circuit featuring elevation changes and a mix of technical and high-speed sections."
    },
    { 
      name: "Road America", 
      location: "Elkhart Lake, Wisconsin", 
      length: "4.048 miles", 
      turns: 14,
      id: "road-america",
      description: "One of America's fastest permanent road courses with long straights and sweeping corners."
    },
    { 
      name: "Sebring International", 
      location: "Sebring, Florida", 
      length: "3.74 miles", 
      turns: 17,
      id: "sebring",
      description: "Famous for its bumpy surface and demanding layout, testing both driver and machine."
    },
    { 
      name: "Sonoma Raceway", 
      location: "Sonoma, California", 
      length: "2.52 miles", 
      turns: 12,
      id: "sonoma",
      description: "Technical circuit set in wine country with elevation changes and tight corners."
    },
    { 
      name: "Barber Motorsports Park", 
      location: "Birmingham, Alabama", 
      length: "2.38 miles", 
      turns: 17,
      id: "barber",
      description: "A beautiful and flowing circuit known for its smooth surface and technical complexity."
    },
    { 
      name: "Virginia International", 
      location: "Alton, Virginia", 
      length: "3.27 miles", 
      turns: 17,
      id: "vir",
      description: "Historic track with a perfect blend of fast and technical sections."
    },
    { 
      name: "Indianapolis Motor Speedway", 
      location: "Indianapolis, Indiana", 
      length: "2.439 miles", 
      turns: 14,
      id: "indianapolis",
      description: "The legendary Brickyard, home of the Indianapolis 500, featuring a challenging road course layout."
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
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">GR Cup Tracks</h1>
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
        <div className="container mx-auto max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Track Analytics</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              GR Cup Track Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Comprehensive data and AI models for all 7 tracks in the Toyota GR Cup North America series.
            </p>
          </motion.div>

          {/* Tracks Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, index) => {
              const trackSvg = TRACK_SVG_MAP[track.name];
              const isHovered = hoveredTrack === track.name;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ perspective: '1000px' }}
                  onMouseEnter={() => setHoveredTrack(track.name)}
                  onMouseLeave={() => setHoveredTrack(null)}
                >
                  <motion.div
                    whileHover={{ scale: 1.03, rotateY: 2, rotateX: 2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="h-full"
                  >
                    <Card 
                      className="group overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 border-border/50 hover:border-primary/50 bg-card/80 backdrop-blur-md cursor-pointer h-full flex flex-col relative"
                      onClick={() => setSelectedTrack(selectedTrack === track.name ? null : track.name)}
                    >
                      {/* Track Image Section with Enhanced Visuals */}
                      <div className="h-64 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/60 flex items-center justify-center relative overflow-hidden">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.08)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.08)_75%,rgba(255,255,255,0.08))] bg-[size:30px_30px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        {/* Animated gradient overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/20"
                          animate={isHovered ? {
                            opacity: [0.3, 0.6, 0.3],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {/* Track SVG Image */}
                        {trackSvg ? (
                          <motion.img
                            src={`/tracks/${trackSvg}`}
                            alt={`${track.name} track layout`}
                            className="w-full h-full object-contain p-6 relative z-10 filter drop-shadow-2xl"
                            initial={{ scale: 1, opacity: 0.9 }}
                            animate={isHovered ? {
                              scale: 1.1,
                              opacity: 1,
                            } : {
                              scale: 1,
                              opacity: 0.9,
                            }}
                            transition={{ duration: 0.5 }}
                            style={{
                              filter: isHovered 
                                ? 'brightness(1.2) contrast(1.1) drop-shadow(0 0 20px rgba(220, 38, 38, 0.5))'
                                : 'brightness(0.95) contrast(1.05)'
                            }}
                          />
                        ) : (
                          <MapPin className="w-20 h-20 text-primary relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                        )}
                        
                        {/* Hover overlay with stats */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent z-20 flex items-end justify-center pb-4"
                            >
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="flex gap-4 text-center"
                              >
                                <div className="px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-lg border border-primary/30">
                                  <div className="text-xs text-muted-foreground mb-1">LENGTH</div>
                                  <div className="text-sm font-bold text-primary">{track.length}</div>
                                </div>
                                <div className="px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-lg border border-primary/30">
                                  <div className="text-xs text-muted-foreground mb-1">TURNS</div>
                                  <div className="text-sm font-bold text-primary">{track.turns}</div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
                            {track.name}
                          </h3>
                          <motion.div
                            animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Flag className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </motion.div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          {track.location}
                        </p>
                        
                        <AnimatePresence>
                          {selectedTrack === track.name && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 space-y-3 overflow-hidden"
                            >
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {track.description}
                              </p>
                              <div className="flex gap-2">
                                {TRACK_PDF_MAP[track.name] && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingMap(track.name);
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Map
                                  </Button>
                                )}
                                <Link to={`/pitwall`} className="flex-1">
                                  <Button
                                    size="sm"
                                    className="w-full bg-primary hover:bg-primary/90"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Activity className="w-4 h-4 mr-2" />
                                    Analytics
                                  </Button>
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-auto">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Length</span>
                            <span className="text-sm font-semibold">{track.length}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Turns</span>
                            <span className="text-sm font-semibold">{track.turns}</span>
                          </div>
                        </div>
                        
                        {!selectedTrack && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-border/50"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs group/btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrack(track.name);
                              }}
                            >
                              <Zap className="w-3 h-3 mr-2 group-hover/btn:rotate-12 transition-transform" />
                              View Details
                              <ArrowRight className="w-3 h-3 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Race Analysis for Road America, Virginia International, and Barber Motorsports Park */}
          {(selectedTrack === "Road America" || selectedTrack === "Virginia International" || selectedTrack === "Barber Motorsports Park") && (
            <RaceAnalysis trackName={selectedTrack} />
          )}

          {/* Track Data Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.01]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Track Data Summary</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: "Total Telemetry Points", value: "41.9M+" },
                    { label: "Unique Vehicles", value: "397" },
                    { label: "Average Race Duration", value: "45.8 min" }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 hover:border-primary/30 transition-all duration-300"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Track Map PDF Viewer Dialog */}
      <Dialog open={!!viewingMap} onOpenChange={(open) => !open && setViewingMap(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {viewingMap} - Track Map
            </DialogTitle>
            <DialogDescription>
              Official track map and sector layout
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 h-[70vh] w-full">
            {viewingMap && TRACK_PDF_MAP[viewingMap] && (
              <iframe
                src={`/track-maps/${TRACK_PDF_MAP[viewingMap]}`}
                className="w-full h-full border border-border rounded-lg"
                title={`${viewingMap} Track Map`}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (viewingMap && TRACK_PDF_MAP[viewingMap]) {
                  window.open(`/track-maps/${TRACK_PDF_MAP[viewingMap]}`, '_blank');
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={() => setViewingMap(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tracks;

