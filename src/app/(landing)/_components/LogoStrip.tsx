import Image from 'next/image';

const logos = [
  { src: '/assets/company_logos/infosys.svg', alt: 'Infosys', width: 100, height: 36 },
  { src: '/assets/company_logos/wipro-1.svg', alt: 'Wipro', width: 88, height: 36 },
  { src: '/assets/company_logos/Tata_Consultancy_Services.svg', alt: 'TCS', width: 110, height: 36 },
  { src: '/assets/company_logos/cognizant.svg', alt: 'Cognizant', width: 120, height: 36 },
  { src: '/assets/company_logos/capgemini.png', alt: 'Capgemini', width: 110, height: 36 },
  { src: '/assets/company_logos/Accenture-Logo.wine.svg', alt: 'Accenture', width: 110, height: 36 },
];

/* Duplicate for seamless infinite loop */
const marqueeLogos = [...logos, ...logos];

export default function LogoStrip() {
  return (
    <div className="bg-white border-y border-slate-100 py-8 overflow-hidden">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <p className="text-center text-xs font-medium text-[#9CA3AF] uppercase tracking-widest mb-6">
        CareerBot users apply to roles at companies like
      </p>

      <div className="relative">
        <div className="marquee-track flex items-center gap-12 w-max">
          {marqueeLogos.map((logo, i) => (
            <div
              key={`${logo.alt}-${i}`}
              className="flex-shrink-0 opacity-50 grayscale hover:opacity-90 hover:grayscale-0 transition-all duration-300"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                style={{ objectFit: 'contain', height: '30px', width: 'auto' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
