// src/components/GeminiMultimodalInput.tsx
// Enhanced multimodal input component with improved media handling, drag-and-drop, and better visualizations

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  Video,
  Image as ImageIcon,
  Music,
  FileText,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Brain,
  Globe,
  Zap,
  FileVideo,
  FileAudio,
  ImagePlus,
  ExternalLink,
  Maximize2,
  Minimize2,
  File,
  Gauge,
  Clock,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface MediaFile {
  file: File;
  type: 'image' | 'video' | 'audio';
  preview?: string;
  id: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    size: number;
  };
  uploading?: boolean;
  uploadProgress?: number;
}

export interface URLContext {
  url: string;
  id: string;
  title?: string;
  loading?: boolean;
  preview?: string;
}

export interface GeminiMultimodalResponse {
  text: string;
  citations?: Array<{ uri: string; title: string }>;
  mediaAnalysis?: {
    image?: Array<{ id: string; analysis: string }>;
    video?: Array<{ id: string; analysis: string }>;
    audio?: Array<{ id: string; analysis: string }>;
  };
  tokensUsed?: number;
}

interface GeminiMultimodalInputProps {
  onAnalyze?: (data: {
    text: string;
    images: MediaFile[];
    videos: MediaFile[];
    audio: MediaFile[];
    urls: URLContext[];
    options: {
      enableGrounding: boolean;
      model: 'flash' | 'flashStable' | 'pro' | 'proLatest';
      temperature: number;
      maxTokens: number;
    };
  }) => Promise<GeminiMultimodalResponse>;
  defaultText?: string;
  showAdvancedOptions?: boolean;
}

export function GeminiMultimodalInput({
  onAnalyze,
  defaultText = '',
  showAdvancedOptions = true,
}: GeminiMultimodalInputProps) {
  const [textInput, setTextInput] = useState(defaultText);
  const [images, setImages] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [audio, setAudio] = useState<MediaFile[]>([]);
  const [urls, setUrls] = useState<URLContext[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState<GeminiMultimodalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  // Options
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'flash' | 'flashStable' | 'pro' | 'proLatest'>('flashStable');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Extract media metadata
  const extractMediaMetadata = async (file: File, type: 'image' | 'video' | 'audio'): Promise<MediaFile['metadata']> => {
    const metadata: MediaFile['metadata'] = {
      size: file.size,
    };

    return new Promise((resolve) => {
      if (type === 'image') {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          metadata.width = img.width;
          metadata.height = img.height;
          URL.revokeObjectURL(url);
          resolve(metadata);
        };
        img.onerror = () => resolve(metadata);
        img.src = url;
      } else if (type === 'video') {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          metadata.width = video.videoWidth;
          metadata.height = video.videoHeight;
          metadata.duration = video.duration;
          URL.revokeObjectURL(url);
          resolve(metadata);
        };
        video.onerror = () => resolve(metadata);
        video.src = url;
      } else if (type === 'audio') {
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          metadata.duration = audio.duration;
          URL.revokeObjectURL(url);
          resolve(metadata);
        };
        audio.onerror = () => resolve(metadata);
        audio.src = url;
      } else {
        resolve(metadata);
      }
    });
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Process files
  const processFiles = async (files: File[], type: 'image' | 'video' | 'audio') => {
    const MAX_SIZE = type === 'image' ? 20 * 1024 * 1024 : 40 * 1024 * 1024;
    
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setError(`${file.name} exceeds ${MAX_SIZE / 1024 / 1024}MB limit`);
        continue;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const metadata = await extractMediaMetadata(file, type);
      
      const mediaFile: MediaFile = {
        file,
        type,
        id,
        metadata,
      };

      // Create preview
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = () => {
          setImages(prev => prev.map(img => 
            img.id === id ? { ...img, preview: reader.result as string } : img
          ));
        };
        reader.readAsDataURL(file);
      } else if (type === 'video') {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          video.currentTime = 0.1; // Get first frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const thumbnail = canvas.toDataURL();
            setVideos(prev => prev.map(vid => 
              vid.id === id ? { ...vid, preview: thumbnail } : vid
            ));
          }
          URL.revokeObjectURL(url);
        };
        video.src = url;
      } else if (type === 'audio') {
        // Audio preview handled separately
      }

      if (type === 'image') {
        setImages(prev => [...prev, mediaFile]);
      } else if (type === 'video') {
        setVideos(prev => [...prev, mediaFile]);
      } else {
        setAudio(prev => [...prev, mediaFile]);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files), 'image');
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files), 'video');
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files), 'audio');
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!e.dataTransfer.files) return;

    const files = Array.from(e.dataTransfer.files);
    const images: File[] = [];
    const videos: File[] = [];
    const audios: File[] = [];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        images.push(file);
      } else if (file.type.startsWith('video/')) {
        videos.push(file);
      } else if (file.type.startsWith('audio/')) {
        audios.push(file);
      }
    });

    if (images.length > 0) processFiles(images, 'image');
    if (videos.length > 0) processFiles(videos, 'video');
    if (audios.length > 0) processFiles(audios, 'audio');
  }, []);

  // Audio player controls
  const toggleAudio = (id: string, url: string) => {
    if (!audioRefs.current[id]) {
      const audio = new Audio(url);
      audioRefs.current[id] = audio;
      audio.onended = () => setPlayingAudio(null);
    }

    if (playingAudio === id) {
      audioRefs.current[id].pause();
      setPlayingAudio(null);
    } else {
      // Pause all other audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      if (playingAudio) {
        setPlayingAudio(null);
      }
      audioRefs.current[id].play();
      setPlayingAudio(id);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(a => {
        a.pause();
        a.src = '';
      });
    };
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(vid => vid.id !== id));
  };

  const removeAudio = (id: string) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      delete audioRefs.current[id];
    }
    if (playingAudio === id) {
      setPlayingAudio(null);
    }
    setAudio(prev => prev.filter(aud => aud.id !== id));
  };

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    
    const urlId = `${Date.now()}-${Math.random()}`;
    const newUrl: URLContext = {
      url: urlInput.trim(),
      id: urlId,
      loading: true,
    };
    
    setUrls(prev => [...prev, newUrl]);
    setUrlInput('');
    
    // Fetch page preview and title
    try {
      const response = await fetch(newUrl.url, { mode: 'no-cors' }).catch(() => null);
      // Try to get Open Graph image
      const previewUrl = `https://api.urlmeta.org/?url=${encodeURIComponent(newUrl.url)}`;
      
      const metaResponse = await fetch(previewUrl).catch(() => null);
      if (metaResponse?.ok) {
        const meta = await metaResponse.json().catch(() => null);
        setUrls(prev => prev.map(u => 
          u.id === urlId ? { 
            ...u, 
            title: meta?.meta?.title || newUrl.url,
            preview: meta?.meta?.image,
            loading: false 
          } : u
        ));
      } else {
        // Fallback to simple title extraction
        const html = await fetch(newUrl.url).then(r => r.text()).catch(() => '');
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        setUrls(prev => prev.map(u => 
          u.id === urlId ? { 
            ...u, 
            title: titleMatch ? titleMatch[1] : newUrl.url,
            loading: false 
          } : u
        ));
      }
    } catch {
      setUrls(prev => prev.map(u => 
        u.id === urlId ? { ...u, title: newUrl.url, loading: false } : u
      ));
    }
  };

  const removeUrl = (id: string) => {
    setUrls(prev => prev.filter(url => url.id !== id));
  };

  const handleAnalyze = async () => {
    if (!textInput.trim() && images.length === 0 && videos.length === 0 && audio.length === 0 && urls.length === 0) {
      setError('Please provide text, media files, or URLs to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResponse(null);

    try {
      if (onAnalyze) {
        const result = await onAnalyze({
          text: textInput,
          images,
          videos,
          audio,
          urls,
          options: {
            enableGrounding,
            model: selectedModel,
            temperature,
            maxTokens,
          },
        });
        if (result) {
          setResponse(result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalMediaFiles = images.length + videos.length + audio.length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Gemini Multimodal AI</CardTitle>
                <CardDescription>
                  Unified input for text, images, videos, audio, and URLs - Enhanced with drag-and-drop
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!textInput.trim() && totalMediaFiles === 0 && urls.length === 0)}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Model Selection */}
          <div className="flex items-center gap-4 mb-4">
            <Label className="text-sm font-medium">Gemini Model:</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'flashStable' as const, label: 'Flash 2.0', badge: 'Video/Audio' },
                { key: 'flash' as const, label: 'Flash 2.0 Exp', badge: 'Latest' },
                { key: 'pro' as const, label: 'Pro 1.5', badge: '1M+ tokens' },
                { key: 'proLatest' as const, label: 'Pro Latest', badge: '1M+ tokens' },
              ]).map(({ key, label, badge }) => (
                <Button
                  key={key}
                  variant={selectedModel === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel(key)}
                  className="relative"
                >
                  {label}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {badge}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Grounding Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Google Search Grounding</Label>
                <Badge variant="outline" className="text-xs">Gemini Only</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Enable real-time web search for enhanced context and citations
              </p>
            </div>
            <Switch
              checked={enableGrounding}
              onCheckedChange={setEnableGrounding}
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Text Input
          </CardTitle>
          <CardDescription>
            Enter your question, prompt, or analysis request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask Gemini anything... Analyze race data, get insights, compare strategies..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Drag and Drop Zone */}
      <Card
        ref={dropZoneRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`transition-all ${
          dragActive ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
      >
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or click the buttons below to select files
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="w-4 h-4 mr-2" />
                Videos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => audioInputRef.current?.click()}
              >
                <Music className="w-4 h-4 mr-2" />
                Audio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Context Retrieval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            URL Context Retrieval
            <Badge variant="outline" className="ml-2">Gemini Only</Badge>
          </CardTitle>
          <CardDescription>
            Add URLs for Gemini to retrieve and analyze context from web pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/page"
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <Button onClick={addUrl} variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </div>

            {/* URL List with Previews */}
            {urls.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {urls.map((url) => (
                  <motion.div
                    key={url.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-accent/30 group"
                  >
                    {url.preview && (
                      <img
                        src={url.preview}
                        alt={url.title}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {url.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <div className="font-medium text-sm truncate">
                                {url.title || url.url}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {url.url}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUrl(url.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Files Section - Enhanced */}
      {(images.length > 0 || videos.length > 0 || audio.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Media Files
                  <Badge variant="outline" className="ml-2">Video/Audio Support</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {images.length} image(s), {videos.length} video(s), {audio.length} audio file(s)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImages([]);
                  setVideos([]);
                  setAudio([]);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hidden file inputs */}
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />
            <Input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleAudioUpload}
              className="hidden"
            />

            {/* Images Gallery */}
            {images.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Images ({images.length})
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={img.preview || URL.createObjectURL(img.file)}
                          alt={img.file.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setExpandedMedia(expandedMedia === img.id ? null : img.id)}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                          onClick={() => removeImage(img.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                          onClick={() => setExpandedMedia(expandedMedia === img.id ? null : img.id)}
                        >
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {img.file.name}
                      </div>
                      {img.metadata?.width && (
                        <div className="text-xs text-muted-foreground">
                          {img.metadata.width}×{img.metadata.height}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileVideo className="w-4 h-4" />
                  Videos ({videos.length})
                  <Badge variant="secondary" className="text-xs ml-2">Gemini Only</Badge>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {videos.map((vid) => (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div className="relative rounded-lg overflow-hidden border bg-black">
                        {vid.preview ? (
                          <div className="relative">
                            <img
                              src={vid.preview}
                              alt={vid.file.name}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-12 h-12 text-white/80" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center">
                            <Video className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeVideo(vid.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        {vid.metadata?.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(vid.metadata.duration)}
                          </div>
                        )}
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-medium truncate">{vid.file.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Gauge className="w-3 h-3" />
                          {formatFileSize(vid.file.size)}
                          {vid.metadata?.width && (
                            <>
                              <span>•</span>
                              <span>{vid.metadata.width}×{vid.metadata.height}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Files with Player */}
            {audio.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileAudio className="w-4 h-4" />
                  Audio ({audio.length})
                  <Badge variant="secondary" className="text-xs ml-2">Gemini Only</Badge>
                </Label>
                <div className="space-y-2">
                  {audio.map((aud) => {
                    const audioUrl = URL.createObjectURL(aud.file);
                    const isPlaying = playingAudio === aud.id;

                    return (
                      <motion.div
                        key={aud.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-accent/30 group"
                      >
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAudio(aud.id, audioUrl)}
                            className="flex-shrink-0"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {aud.file.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                              <Gauge className="w-3 h-3" />
                              {formatFileSize(aud.file.size)}
                              {aud.metadata?.duration && (
                                <>
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(aud.metadata.duration)}
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAudio(aud.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expanded Media Modal */}
      <AnimatePresence>
        {expandedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpandedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const media = [...images, ...videos].find(m => m.id === expandedMedia);
                if (!media) return null;

                if (media.type === 'image') {
                  return (
                    <img
                      src={media.preview || URL.createObjectURL(media.file)}
                      alt={media.file.name}
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                  );
                } else {
                  return (
                    <video
                      src={URL.createObjectURL(media.file)}
                      controls
                      className="max-w-full max-h-[90vh] rounded-lg"
                    />
                  );
                }
              })()}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setExpandedMedia(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Temperature: {temperature.toFixed(1)}</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div>
              <Label>Max Tokens: {maxTokens.toLocaleString()}</Label>
              <Input
                type="number"
                min="1"
                max={selectedModel === 'pro' || selectedModel === 'proLatest' ? 1000000 : 8192}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                className="mt-2"
              />
              {(selectedModel === 'pro' || selectedModel === 'proLatest') && (
                <p className="text-xs text-muted-foreground mt-1">
                  Gemini Pro supports up to 1M+ tokens for massive context windows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Response Display */}
      {response && !isAnalyzing && (
        <Card className="bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Analysis Results
              {response.tokensUsed && (
                <Badge variant="outline" className="ml-auto">
                  {response.tokensUsed.toLocaleString()} tokens
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">{response.text}</p>
            </div>

            {/* Media Analysis Sections */}
            {response.mediaAnalysis && (
              <div className="space-y-4 pt-4 border-t">
                {response.mediaAnalysis.image && response.mediaAnalysis.image.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image Analysis
                    </h4>
                    <div className="space-y-2">
                      {response.mediaAnalysis.image.map((analysis, idx) => {
                        const img = images.find((_, i) => i === idx);
                        return (
                          <div key={idx} className="p-3 rounded-lg bg-accent/30 border">
                            {img && (
                              <img
                                src={img.preview || URL.createObjectURL(img.file)}
                                alt={img.file.name}
                                className="w-32 h-32 object-cover rounded mb-2"
                              />
                            )}
                            <p className="text-xs text-muted-foreground">{analysis.analysis}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {response.mediaAnalysis.video && response.mediaAnalysis.video.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video Analysis
                    </h4>
                    <div className="space-y-2">
                      {response.mediaAnalysis.video.map((analysis, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-accent/30 border">
                          <p className="text-xs text-muted-foreground">{analysis.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.mediaAnalysis.audio && response.mediaAnalysis.audio.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Audio Analysis
                    </h4>
                    <div className="space-y-2">
                      {response.mediaAnalysis.audio.map((analysis, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-accent/30 border">
                          <p className="text-xs text-muted-foreground">{analysis.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Citations */}
            {response.citations && response.citations.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Sources & Citations
                </h4>
                <div className="space-y-2">
                  {response.citations.map((citation, index) => (
                    <a
                      key={index}
                      href={citation.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs text-primary hover:underline p-2 rounded bg-accent/50"
                    >
                      <Globe className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{citation.title}</div>
                        <div className="text-muted-foreground truncate">{citation.uri}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
