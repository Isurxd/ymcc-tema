"use client";

import Image from "next/image";
import { useState } from "react";

export default function FadeInImage({ className = "", alt = "", ...props }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      className={`transition-opacity duration-700 ease-in-out ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      onLoad={(e) => {
        setLoaded(true);
        if (props.onLoad) props.onLoad(e);
      }}
    />
  );
}
