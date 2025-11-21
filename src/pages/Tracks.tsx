import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Flag, ArrowLeft, FileText, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const Tracks = () => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [viewingMap, setViewingMap] = useState<string | null>(null);

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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 space-y-3"
                      >
                        <p className="text-sm text-muted-foreground">
                          {track.description}
                        </p>
                        {TRACK_PDF_MAP[track.name] && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingMap(track.name);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Track Map
                          </Button>
                        )}
                      </motion.div>
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
                    {TRACK_PDF_MAP[track.name] && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingMap(track.name);
                          }}
                        >
                          <MapPin className="w-3 h-3 mr-2" />
                          View Map PDF
                        </Button>
                      </div>
                    )}
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

