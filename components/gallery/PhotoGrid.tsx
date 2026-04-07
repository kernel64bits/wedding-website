"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/lib/storage";

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

      {/* Lightbox placeholder — T4.5.c will add prev/next, keyboard nav, download */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setSelectedIndex(null)}
        >
          <Image
            src={photos[selectedIndex].thumbnailUrl}
            alt=""
            width={900}
            height={600}
            unoptimized
            className="max-h-[85vh] w-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
