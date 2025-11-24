import React, { useRef, useState, useEffect } from 'react';

interface VideoPreviewProps {
  src: string;
  poster?: string | null;
  className?: string;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  ariaLabel?: string;
}

export default function VideoPreview({
  src,
  poster = null,
  className = '',
  loop = true,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  ariaLabel = 'Video preview'
}: VideoPreviewProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isHoverPlaying, setHoverPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  // Hover handlers (desktop)
  const handleMouseEnter = async () => {
    const v = ref.current;
    if (!v) return;
    try {
      // mute + play for autoplay policy
      v.muted = muted;
      v.playsInline = playsInline;
      v.loop = loop;
      await v.play();
      setHoverPlaying(true);
    } catch (e) {
      // ignore autoplay error
    }
  };

  const handleMouseLeave = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    setHoverPlaying(false);
  };

  // Click toggles play/pause (mobile friendly)
  const handleClick = async (e: React.MouseEvent) => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      try {
        await v.play();
      } catch(e) {
        // ignore play error
      }
    } else {
      v.pause();
    }
  };

  // Double click to fullscreen
  const handleDoubleClick = () => {
    const v = ref.current;
    if (!v) return;
    if (v.requestFullscreen) {
      v.requestFullscreen();
    } else if ((v as any).webkitEnterFullscreen) {
      // iOS Safari
      (v as any).webkitEnterFullscreen();
    } else if ((v as any).webkitRequestFullscreen) {
      // Older WebKit
      (v as any).webkitRequestFullscreen();
    } else if ((v as any).mozRequestFullScreen) {
      // Firefox
      (v as any).mozRequestFullScreen();
    } else if ((v as any).msRequestFullscreen) {
      // IE/Edge
      (v as any).msRequestFullscreen();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      handleDoubleClick();
    }
  };

  return (
    <div
      className={`video-preview relative overflow-hidden rounded-lg ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ minHeight: 220, backgroundColor: '#000' }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster || undefined}
        preload={preload}
        muted={muted}
        playsInline={playsInline}
        loop={loop}
        className="w-full h-full object-cover"
      />
      {/* Play overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transition: 'opacity 160ms' }}
      >
        {!isPlaying && (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              background: 'rgba(15,23,36,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <path d="M5 3v18l15-9L5 3z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

