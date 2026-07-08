"use client";

import { FaShareAlt } from "react-icons/fa";
import { toast } from "sonner";

export default function ShareButton({ title, text, url }) {
  const handleShare = async () => {
    const shareData = {
      title: title || "YMCC VII",
      text: text || "Check this out at YMCC VII!",
      url: url || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const shareUrl = url || window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link."));
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-1.5 border-2 border-black rounded-full hover:bg-[#c1ff00] hover:-translate-y-0.5 shadow-sm hover:shadow-[2px_2px_0_0_#000] transition-all font-bold text-xs uppercase shrink-0"
    >
      <FaShareAlt /> Share
    </button>
  );
}
