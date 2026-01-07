'use client';

/**
 * Persistent Header Component
 * 
 * Renders on all states:
 * - Before age gate
 * - After age gate
 * - Input state
 * - Processing
 * - Resolved state
 * 
 * Branding: GO logo (PNG) always visible, top-left
 */

export default function Header() {
  return (
    <header className="pt-16 px-6 lg:px-12 xl:px-24 flex justify-between items-baseline">
      <div className="flex items-center gap-4">
        {/* GO Logo - Always visible, PNG-based */}
        <img
          src="/brand/go-mark.png"
          srcSet="/brand/go-mark@2x.png 2x"
          alt="GO Line"
          width={144}
          height={80}
          className="h-6 lg:h-8 max-h-[24px] lg:max-h-[32px] w-auto object-contain"
          style={{
            display: "block",
            objectFit: "contain"
          }}
        />
        {/* Version text - Secondary to logo */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-widest">GO // 2.1</span>
        </div>
      </div>
    </header>
  );
}

