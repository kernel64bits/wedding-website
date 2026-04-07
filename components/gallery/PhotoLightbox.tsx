"use client";

import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/lib/storage";

interface Props {
  photos: Photo[];
  selectedIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function PhotoLightbox({
  photos,
  selectedIndex,
  onClose,
  onIndexChange,
}: Props) {
  const touchStartX = useRef(0);
  const len = photos.length;
  const photo = photos[selectedIndex];

  const prev = useCallback(
    () => onIndexChange(((selectedIndex - 1) % len + len) % len),
    [selectedIndex, len, onIndexChange],
  );
  const next = useCallback(
    () => onIndexChange(((selectedIndex + 1) % len + len) % len),
    [selectedIndex, len, onIndexChange],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prev, next]);

  return (
    <Dialog.Root open onOpenChange={() => onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const delta = touchStartX.current - e.changedTouches[0].clientX;
            if (delta > 50) next();
            else if (delta < -50) prev();
          }}
        >
          <Dialog.Title className="sr-only">Photo viewer</Dialog.Title>
          <Dialog.Description className="sr-only">
            Photo {selectedIndex + 1} of {len}
          </Dialog.Description>

          {/* Download — top left */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-white hover:bg-white/20"
            asChild
          >
            <a
              href={`/api/photos/download?key=${encodeURIComponent(photo.originalKey)}`}
            >
              <Download className="size-5" />
              <span className="sr-only">Download</span>
            </a>
          </Button>

          {/* Close — top right */}
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </Dialog.Close>

          {/* Prev */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={prev}
          >
            <ChevronLeft className="size-6" />
            <span className="sr-only">Previous</span>
          </Button>

          {/* Next */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={next}
          >
            <ChevronRight className="size-6" />
            <span className="sr-only">Next</span>
          </Button>

          {/* Photo */}
          <Image
            src={photo.thumbnailUrl}
            alt=""
            width={1200}
            height={800}
            unoptimized
            className="max-h-[85vh] max-w-[90vw] w-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
