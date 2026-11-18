import { useState } from 'react';
import { Wind } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel = 'Atmospheric Clean-Air Visual',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EDF2F0] via-[#E2EBE8] to-[#D8E2DF] text-[#4A5C58] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Wind className="w-8 h-8 text-[#175946] mb-2" strokeWidth={1.75} />
        <span className="text-xs font-medium text-[#13221F]">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
