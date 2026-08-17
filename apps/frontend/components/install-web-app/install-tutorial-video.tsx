"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const VIDEO_ID = "8UvxDz0O1X8";
const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`;
const THUMBNAIL_SRC = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;

export function InstallTutorialVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative mx-auto w-59 sm:w-65">
      <div
        className="pointer-events-none absolute inset-8 rounded-full bg-primary/40 blur-3xl motion-reduce:blur-md"
        aria-hidden
      />
      <div className="relative rounded-[2.6rem] border-8 border-foreground bg-foreground p-1 shadow-2xl">
        <div className="relative aspect-9/19 overflow-hidden rounded-4xl bg-black">
          {isPlaying ? (
            <iframe
              title="ADDINVOICES install tutorial"
              src={EMBED_SRC}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${THUMBNAIL_SRC})` }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/25" />
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex cursor-pointer items-center justify-center"
                aria-label="Play install tutorial"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-colors duration-200 hover:bg-primary/90">
                  <Play className="ml-0.5 size-7 fill-current" aria-hidden />
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
