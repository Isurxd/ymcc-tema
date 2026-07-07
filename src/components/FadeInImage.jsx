"use client";

import Image from "next/image";
import { useState } from "react";

export default function FadeInImage({ className = "", alt = "", fill, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Extract base classes like rounded corners to apply to the skeleton
  const baseClasses = className.split(" ").filter(c => c.startsWith("rounded") || c.startsWith("object-")).join(" ");

  return (
    <>
      {!loaded && !error && (
        <div 
          className={`bg-gray-200 animate-pulse ${fill ? "absolute inset-0" : ""} ${baseClasses}`}
          style={!fill ? { width: props.width, height: props.height } : {}}
        >
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      )}
      <Image
        {...props}
        alt={alt}
        fill={fill}
        unoptimized={props.src && typeof props.src === 'string' && props.src.startsWith('http')}
        quality={100}
        className={`transition-all duration-700 ease-in-out ${loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
        onError={(e) => {
          setLoaded(true);
          setError(true);
          if (props.onError) props.onError(e);
        }}
      />
    </>
  );
}
