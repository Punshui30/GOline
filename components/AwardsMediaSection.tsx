import Image from "next/image";
import SectionWrapper from "./SectionWrapper";

type MediaFeature = 
  | {
      image: string;
      title: string;
      type: "image";
    }
  | {
      spotifyUrl: string;
      title: string;
      type: "podcast";
    }
  | {
      youtubeUrl: string;
      title: string;
      type: "youtube";
    };

const mediaFeatures: MediaFeature[] = [
  {
    image: "/images/media/jose-garces.jpg",
    title: "Cover Feature - Maryland Leaf (Insider Issue)",
    type: "image",
  },
  {
    image: "/images/media/maryland-leaf-cover.jpg",
    title: "Collaboration with Celebrity Chef Jose Garces",
    type: "image",
  },
  {
    image: "/images/media/weed-wars-poster.jpg",
    title: "Featured in Documentary - Weed Wars: Maryland's Monopoly & The Fight for Free Markets",
    type: "image",
  },
  {
    spotifyUrl: "https://open.spotify.com/episode/19ZR1MCRHZ3wxIfBBA1JnL",
    title: "Podcast Interview - Spotify",
    type: "podcast",
  },
  {
    youtubeUrl: "https://youtu.be/rqYKPdfVsFU",
    title: "YouTube Video",
    type: "youtube",
  },
];

function extractYouTubeVideoId(url: string): string {
  // Handle youtu.be format: https://youtu.be/VIDEO_ID
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  // Handle youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('v=')) {
    return url.split('v=')[1]?.split('&')[0] || '';
  }
  return '';
}

export default function AwardsMediaSection() {
  return (
    <SectionWrapper id="awards" bgAlt={true} showDivider={true}>
      <h2 className="section-title">Awards & Media</h2>
      
      {/* Awards */}
      <div className="mb-16">
        <h3 className="text-xl md:text-2xl font-semibold text-charcoal mb-8">Awards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="relative w-full max-w-md mx-auto aspect-[3/2] rounded-xl overflow-hidden shadow-sm bg-lightgray">
              <Image
                src="/images/awards/belt-best-hemp-flower.jpg"
                alt="National Cannabis Championship - Best Hemp Flower award belt"
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 448px"
                quality={90}
              />
            </div>
            <p className="text-base md:text-lg text-charcoal/80 text-center leading-relaxed">
              Winner - Best Hemp Flower, National Cannabis Championship.
            </p>
          </div>
          <div className="space-y-4">
            <div className="relative w-full max-w-md mx-auto aspect-[3/2] rounded-xl overflow-hidden shadow-sm bg-lightgray">
              <Image
                src="/images/awards/belt-best-hemp-topical.jpg"
                alt="National Cannabis Championship - Best Hemp Topical award belt"
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 448px"
                quality={90}
              />
            </div>
            <p className="text-base md:text-lg text-charcoal/80 text-center leading-relaxed">
              Winner - Best Hemp Topical, National Cannabis Championship.
            </p>
          </div>
        </div>
      </div>

      {/* Media Features */}
      <div>
        <h3 className="text-xl md:text-2xl font-semibold text-charcoal mb-8">Media</h3>
        <div className="grid md:grid-cols-2 gap-8 md:gap-10">
          {mediaFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="bg-offwhite rounded-lg shadow-soft border border-lightgray overflow-hidden hover:shadow-image transition-shadow duration-300"
            >
              {feature.type === "podcast" ? (
                <>
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={`https://open.spotify.com/embed/episode/${feature.spotifyUrl.split('/').pop()}`}
                      width="100%"
                      height="352"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      className="border-0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={feature.title}
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <h4 className="text-lg md:text-xl font-semibold text-charcoal leading-relaxed">
                      {feature.title}
                    </h4>
                  </div>
                </>
              ) : feature.type === "youtube" ? (
                <>
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeVideoId(feature.youtubeUrl)}`}
                      width="100%"
                      height="100%"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      className="border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      title={feature.title}
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <h4 className="text-lg md:text-xl font-semibold text-charcoal leading-relaxed">
                      {feature.title}
                    </h4>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative w-full aspect-[4/3] bg-lightgray rounded-t-xl overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={90}
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <h4 className="text-lg md:text-xl font-semibold text-charcoal leading-relaxed">
                      {feature.title}
                    </h4>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
