import { type ImgHTMLAttributes } from "react";

type PictureSource = { srcset: string; type: string };

export type ResponsiveImage = {
  sources: PictureSource[];
  img: { src: string; w: number; h: number };
};

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  image: ResponsiveImage;
  sizes?: string;
};

export function ResponsivePicture({ image, sizes = "100vw", alt, ...rest }: Props) {
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcset} sizes={sizes} />
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
