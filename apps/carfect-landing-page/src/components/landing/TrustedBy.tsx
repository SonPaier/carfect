import Image from "next/image";
import logoArmcar from "@/assets/logo-armcar-full.png";
import logoN2wash from "@/assets/logo-n2wash.webp";
import logoUltrafit from "@/assets/logo-ultrafit.png";
import logoBling from "@/assets/logo-bling.svg";

const logos = [
  { src: logoArmcar, alt: "ARM-CAR Detailing & Wrapping" },
  { src: logoN2wash, alt: "N2Wash" },
  { src: logoUltrafit, alt: "Ultrafit" },
  { src: logoBling, alt: "Bling" },
];

const TrustedBy = () => {
  return (
    <section className="py-10 md:py-14 bg-gray-100">
      <div className="container px-4">
        <p className="text-center text-sm text-muted-foreground/70 mb-8 tracking-widest uppercase font-medium">
          Pracują z nami najlepsi
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {logos.map((logo, i) => (
            <Image
              key={i}
              src={logo.src}
              alt={logo.alt}
              className="h-14 md:h-20 w-auto object-contain"
              width={200}
              height={80}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
