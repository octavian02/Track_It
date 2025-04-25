// src/components/ImageWithFallback.tsx
import React, { useState } from "react";

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  ...rest
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      {...rest}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
};

export default ImageWithFallback;
