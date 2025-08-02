"use client";


import Lightbox, { LightboxExternalProps } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

  export default function ProductImagesGallery(props: Omit<LightboxExternalProps, "plugins">) {
    return (
      <Lightbox
        plugins={[Zoom, Counter, Thumbnails]}
        counter={{ container: { style: { top: 0 } } }}
        {...props}
      />
    );
  }
