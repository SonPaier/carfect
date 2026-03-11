import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import appDesktop from "@/assets/app-desktop.png";
import appMobile from "@/assets/crm-kalendarz-mobile.png";

const AppPreview = () => {
  const { t } = useTranslation();
  const preview = t("appPreview");

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {preview.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {preview.subtitle}
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
          {/* MacBook mockup */}
          <div className="relative z-10 w-full max-w-4xl">
            <div className="relative bg-[#1a1a1a] rounded-t-xl shadow-2xl overflow-hidden border-t-[12px] border-x-[12px] border-[#1a1a1a]">
              {/* MacBook camera */}
              <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#2a2a2a] z-10" />
              
              {/* Screen content */}
              <div className="aspect-[16/10] bg-white overflow-hidden">
                <Image
                  src={appDesktop}
                  alt="Carfect Desktop App"
                  className="w-full h-full object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            </div>
            
            {/* MacBook bottom bezel */}
            <div className="h-4 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] rounded-b-lg" />
            
            {/* MacBook base/hinge */}
            <div className="relative mx-auto">
              <div className="h-3 bg-gradient-to-b from-[#c4c4c4] to-[#a0a0a0] rounded-b-sm mx-16" />
              <div className="h-1 bg-gradient-to-b from-[#d4d4d4] to-[#b0b0b0] rounded-b-xl mx-8" />
            </div>
          </div>

          {/* iPhone 16 mockup */}
          <div className="lg:absolute lg:right-0 lg:bottom-8 lg:translate-x-1/4 z-20">
            <div className="relative w-52 md:w-64">
              {/* iPhone frame */}
              <div className="relative bg-[#1a1a1a] rounded-[3rem] p-[10px] shadow-2xl">
                {/* Dynamic Island */}
                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20" />
                
                {/* Screen */}
                <div className="relative rounded-[2.3rem] overflow-hidden bg-white">
                  <Image
                    src={appMobile}
                    alt="Carfect Mobile App"
                    className="w-full aspect-[9/19.5] object-cover object-top"
                    sizes="(max-width: 768px) 208px, 256px"
                  />
                </div>
              </div>
              
              {/* Side buttons - right */}
              <div className="absolute right-[-2px] top-28 w-[3px] h-12 bg-[#2a2a2a] rounded-r-sm" />
              
              {/* Side buttons - left */}
              <div className="absolute left-[-2px] top-24 w-[3px] h-6 bg-[#2a2a2a] rounded-l-sm" />
              <div className="absolute left-[-2px] top-36 w-[3px] h-10 bg-[#2a2a2a] rounded-l-sm" />
              <div className="absolute left-[-2px] top-48 w-[3px] h-10 bg-[#2a2a2a] rounded-l-sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;
