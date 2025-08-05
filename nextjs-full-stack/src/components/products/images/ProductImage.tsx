"use client";

import Image from "next/image";
import { ProductVariant } from "@/lib/validations/product";
import { useState } from "react";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import dynamic from "next/dynamic";
const ProductImagesGallery = dynamic(() => import("@/components/products/images/ProductImagesGallery"));

export default function ProductImage({name, variants}: {name: string, variants: ProductVariant[]}) {
  const [open, setOpen] = useState<boolean>();
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
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <span className="absolute top-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          Кликни, за да видиш галерията с изображения
        </span>
      </div>
      {open !== undefined && (
        <ProductImagesGallery
          open={open}
          close={() => setOpen(false)}
          slides={slides}
        />
      )}
    </div>
  );
}
