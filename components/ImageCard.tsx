import Image from "next/image";

interface ImageCardProps {
  src: string;
  alt: string;
  aspect?: "square" | "landscape";
  className?: string;
  objectFit?: "cover" | "contain";
}

export default function ImageCard({
  src,
  alt,
  aspect = "landscape",
  className = "",
  objectFit = "cover",
}: ImageCardProps) {
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[4/3]";
  const objectFitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden shadow-sm bg-lightgray ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={`${objectFitClass} transition-transform duration-300 hover:scale-[1.02]`}
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={90}
      />
    </div>
  );
}

