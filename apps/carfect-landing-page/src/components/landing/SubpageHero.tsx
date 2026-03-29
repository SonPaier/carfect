interface SubpageHeroProps {
  children: React.ReactNode;
}

const SubpageHero = ({ children }: SubpageHeroProps) => {
  return (
    <section className="bg-gradient-to-br from-primary via-primary/90 to-amber-950 text-white py-16 md:py-24 relative overflow-hidden">
      {/* Repeating CARFECT watermark — diagonal, embossed feel */}
      <div
        className="absolute inset-0 select-none pointer-events-none"
        aria-hidden="true"
        style={{
          transform: "rotate(-15deg) scale(1.5)",
          transformOrigin: "center center",
        }}
      >
        <div className="flex flex-col gap-12 -mt-20">
          {Array.from({ length: 8 }).map((_, row) => (
            <div
              key={row}
              className="flex gap-16 whitespace-nowrap"
              style={{ marginLeft: row % 2 === 0 ? "0px" : "-120px" }}
            >
              {Array.from({ length: 6 }).map((_, col) => (
                <span
                  key={col}
                  className="text-6xl md:text-7xl font-black tracking-[0.2em] text-white/[0.04]"
                >
                  CARFECT
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        {children}
      </div>
    </section>
  );
};

export default SubpageHero;
