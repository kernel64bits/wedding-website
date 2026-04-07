"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/lib/storage";
import { PhotoLightbox } from "./PhotoLightbox";

interface Props {
  photos: Photo[];
}

export function PhotoGrid({ photos }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <button
            key={photo.key}
            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => setSelectedIndex(i)}
          >
            <Image
              src={photo.thumbnailUrl}
              alt=""
              fill
              unoptimized
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <PhotoLightbox
          photos={photos}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onIndexChange={setSelectedIndex}
        />
      )}
    </>
  );
}
