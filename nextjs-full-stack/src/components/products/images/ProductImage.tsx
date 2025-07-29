"use client";

import Image from "next/image";
import { ProductVariant } from "@/types/product";
import { useState } from "react";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function ProductImage({name, variants}: {name: string, variants: ProductVariant[]}) {
  const [open, setOpen] = useState(false);
  const imageUrls = variants?.map((v) => v.image_url) ?? []
  const slides = imageUrls.map((url) => ({ src: url }));
  const heroImageUrl = imageUrls[0]

  return (
    <div
      className="
        bg-slate-100 dark:bg-slate-800 p-4 rounded-3xl shadow-lg shadow-slate-200 dark:shadow-black/20 flex sm:items-center justify-center mb-4 lg:mb-0  w-full aspect-square sm:aspect-video lg:aspect-auto
      ">
      <div
        className="w-full h-full relative cursor-pointer"
        onClick={() => setOpen(true)}>
        <Image
          src={heroImageUrl}
          alt={name}
          fill
          className="object-contain"
          priority
        />
        <span className="absolute top-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          Кликни, за да видиш галерията с изображения
        </span>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        plugins={[Zoom, Counter, Thumbnails]}
        counter={{ container: { style: { top: 0 } } }}
      />
    </div>
  );
}
