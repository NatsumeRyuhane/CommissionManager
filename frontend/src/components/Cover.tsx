import { useEffect, useState } from "react";

import type { Cover as CoverType, ImagePreset } from "../api/types";
import { DerivedImg, presetSrcSet, presetUrl } from "./DerivedImg";

/** Renders a cover/image with focal-point-aware cropping, or a hatched placeholder. */
export function Cover({
  cover,
  ratio,
  rounded = true,
  size = "small",
  sizes,
}: {
  cover: CoverType | null;
  ratio?: number; // width / height; defaults to the cover's intrinsic ratio or 4:5
  rounded?: boolean;
  size?: ImagePreset; // derivative preset for this surface; originals never load here
  sizes?: string; // when set, expose the derivative srcset and let the browser pick
}) {
  // label the placeholder until the derivative actually paints, so a slow
  // network reads as "loading" rather than an empty hatched box
  const [loaded, setLoaded] = useState(false);
  const src = cover ? presetUrl(cover.image_urls, size, cover.url) : undefined;
  const srcSet =
    cover && sizes ? presetSrcSet(cover.image_urls, cover.width, cover.height) : undefined;
  // re-arm the label whenever the resolved source changes: a new cover, preset
  // or freshly generated derivative all swap the underlying <img src/srcset>
  useEffect(() => setLoaded(false), [src, srcSet]);

  const ar =
    ratio ??
    (cover?.width && cover?.height ? cover.width / cover.height : 4 / 5);
  const style: React.CSSProperties = {
    aspectRatio: String(ar),
    borderRadius: rounded ? "var(--r)" : 0,
  };
  if (!cover) {
    return (
      <div className="imgph" style={style}>
        no image
      </div>
    );
  }
  const objectPosition =
    cover.focal_x != null && cover.focal_y != null
      ? `${cover.focal_x * 100}% ${cover.focal_y * 100}%`
      : "center";
  // scale ≥ 1 with the origin pinned to the focal point zooms the crop
  // toward the subject without ever exposing a gap at the edges
  const zoom = cover.focal_zoom != null && cover.focal_zoom > 1 ? cover.focal_zoom : null;
  const imgStyle: React.CSSProperties = { objectPosition };
  if (zoom) {
    imgStyle.transformOrigin = objectPosition;
    (imgStyle as Record<string, string | number>)["--focal-zoom"] = zoom;
  }
  return (
    <div className={`imgph${loaded ? "" : " is-loading"}`} style={style}>
      <DerivedImg
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        fallbackSrc={cover.url}
        alt=""
        style={imgStyle}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
