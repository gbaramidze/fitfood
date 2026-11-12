'use client';

import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

/** A dish photo from the database. No photo (or one that fails to load) shows a neutral plate — never a stand-in picture of another dish. */
export function DishImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="ord-noimg" role="img" aria-label={alt}>
        <UtensilsCrossed size={26} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
