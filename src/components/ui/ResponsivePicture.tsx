import { type ImgHTMLAttributes } from "react";

/**
 * The shape `vite-imagetools` actually emits for `?responsive` (`as=picture`):
 * `sources` is an object keyed by format, not a list. Key order follows the
 * order the formats were requested in `vite.config.ts` (`format: "webp;jpg"` →
 * `webp`, then `jpeg`), and `<picture>` takes the first `<source>` the browser
 * supports — so the modern format must stay first.
 */
export type ResponsiveImage = {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
};

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  image: ResponsiveImage;
  sizes?: string;
};

export function ResponsivePicture({ image, sizes = "100vw", alt, ...rest }: Props) {
  return (
    <picture>
      {Object.entries(image.sources).map(([format, srcset]) => (
        <source key={format} type={`image/${format}`} srcSet={srcset} sizes={sizes} />
      ))}
      <img
        {...rest}
        src={image.img.src}
        width={image.img.w}
        height={image.img.h}
        alt={alt}
        loading={rest.loading ?? "lazy"}
        decoding={rest.decoding ?? "async"}
      />
    </picture>
  );
}
