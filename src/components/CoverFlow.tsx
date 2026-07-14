import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Disc3 } from 'lucide-react';

export interface AlbumCover {
  album: string;
  artist: string;
  coverArt?: string;
  trackCount: number;
}

interface CoverFlowProps {
  albums: AlbumCover[];
  onSelectAlbum: (albumName: string) => void;
  accentColor?: string;
  accentRgb?: string;
}

export const CoverFlow: React.FC<CoverFlowProps> = ({
  albums,
  onSelectAlbum,
  accentColor = '#00f2fe',
  accentRgb = '0, 242, 254',
}) => {
  const [activeIndex, setActiveIndex] = useState(Math.floor(albums.length / 2));
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= albums.length) return;
      setActiveIndex(index);
    },
    [albums.length]
  );

  const goLeft = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goRight = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goLeft();
      if (e.key === 'ArrowRight') goRight();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goLeft, goRight]);

  // Wheel navigation
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isScrolling.current) return;
      isScrolling.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) goRight();
      else goLeft();
      setTimeout(() => {
        isScrolling.current = false;
      }, 250);
    },
    [goLeft, goRight]
  );

  if (albums.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-3">
        <Disc3 className="w-12 h-12 animate-spin" style={{ animationDuration: '8s', color: accentColor }} />
        <p className="text-sm font-semibold">No album covers to display</p>
        <p className="text-xs">Import music files with embedded cover art</p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative select-none overflow-hidden"
      onWheel={handleWheel}
      ref={containerRef}
    >
      {/* 3D Cover Flow container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 40%',
          width: '100%',
          height: '240px',
        }}
      >
        {albums.map((album, index) => {
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);

          // Only render visible covers (±5)
          if (absOffset > 5) return null;

          const isCenter = offset === 0;
          const translateX = isCenter ? 0 : offset * 120 + (offset > 0 ? 60 : -60);
          const translateZ = isCenter ? 100 : -50 * absOffset;
          const rotateY = isCenter ? 0 : offset > 0 ? -55 : 55;
          const scale = isCenter ? 1.0 : Math.max(0.6, 1 - absOffset * 0.12);
          const opacity = isCenter ? 1 : Math.max(0.3, 1 - absOffset * 0.2);
          const zIndex = 100 - absOffset;

          return (
            <div
              key={`${album.album}-${index}`}
              onClick={() => {
                if (isCenter) {
                  onSelectAlbum(album.album);
                } else {
                  goTo(index);
                }
              }}
              className="absolute cursor-pointer"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Album cover */}
              <div
                className="relative rounded-xl overflow-hidden"
                style={{
                  width: '180px',
                  height: '180px',
                  boxShadow: isCenter
                    ? `0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(${accentRgb}, 0.3)`
                    : '0 4px 20px rgba(0,0,0,0.5)',
                  border: isCenter
                    ? `2px solid rgba(${accentRgb}, 0.5)`
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {album.coverArt ? (
                  <img
                    src={album.coverArt}
                    alt={album.album}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, rgba(${accentRgb}, 0.2), rgba(${accentRgb}, 0.05))`,
                    }}
                  >
                    <Disc3
                      className="w-14 h-14"
                      style={{ color: `rgba(${accentRgb}, 0.6)` }}
                    />
                    <span
                      className="text-[10px] font-bold text-center px-2 truncate w-full"
                      style={{ color: `rgba(${accentRgb}, 0.8)` }}
                    >
                      {album.album}
                    </span>
                  </div>
                )}
              </div>

              {/* Reflection */}
              <div
                className="rounded-xl overflow-hidden mt-1"
                style={{
                  width: '180px',
                  height: '60px',
                  transform: 'scaleY(-1)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)',
                  maskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              >
                {album.coverArt ? (
                  <img
                    src={album.coverArt}
                    alt=""
                    className="w-full h-full object-cover object-bottom"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, rgba(${accentRgb}, 0.15), rgba(${accentRgb}, 0.03))`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Album info (center) */}
      {albums[activeIndex] && (
        <div className="text-center mt-2 z-10">
          <div className="text-sm font-bold text-white truncate max-w-xs">
            {albums[activeIndex].album}
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {albums[activeIndex].artist} · {albums[activeIndex].trackCount}{' '}
            {albums[activeIndex].trackCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {activeIndex > 0 && (
        <button
          onClick={goLeft}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-xl transition-all z-20 hover:scale-110"
          style={{
            background: `rgba(${accentRgb}, 0.15)`,
            border: `1px solid rgba(${accentRgb}, 0.3)`,
            color: accentColor,
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {activeIndex < albums.length - 1 && (
        <button
          onClick={goRight}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-xl transition-all z-20 hover:scale-110"
          style={{
            background: `rgba(${accentRgb}, 0.15)`,
            border: `1px solid rgba(${accentRgb}, 0.3)`,
            color: accentColor,
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
