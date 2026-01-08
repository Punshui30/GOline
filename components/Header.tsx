'use client';

/**
 * Persistent Header Component
 * 
 * Renders on all states:
 * - Before age gate
 * - During age gate
 * - Input state
 * - Processing state
 * - Resolved state
 * 
 * Fixed/sticky at top, always visible, never conditionally hidden
 * Branding: GO logo (PNG) always visible, top-left
 * Context bar: GLEAF data source clarification
 */

export default function Header() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] bg-[#0a0b0e]/95 backdrop-blur-sm border-b border-zinc-900/50">
        <div className="px-6 lg:px-12 xl:px-24 py-4 flex items-center gap-4 min-h-[64px]">
          {/* GO Logo - Always visible, PNG-based, no conditional rendering */}
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO Line"
            width={144}
            height={80}
            className="h-10 lg:h-12 max-h-[40px] lg:max-h-[48px] w-auto object-contain"
            style={{
              display: "block",
              objectFit: "contain"
            }}
          />
          {/* Version text - Secondary to logo */}
          <span className="text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-widest">GO // 2.1</span>
        </div>
      </header>
      
      {/* Context Bar - GLEAF data source clarification */}
      <div className="fixed top-[64px] left-0 right-0 z-[59] bg-[#0a0b0e]/90 backdrop-blur-sm border-b border-zinc-900/30">
        <div className="px-6 lg:px-12 xl:px-24 py-2">
          <p className="text-[10px] lg:text-xs font-sans text-zinc-500 leading-relaxed">
            Blends are calculated from the live menu and lab reports of{' '}
            <span className="text-gleaf-muted font-medium">GLEAF</span>.
            <span className="hidden sm:inline text-zinc-600 ml-2">
              Inventory and terpene data update automatically as the menu changes.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

