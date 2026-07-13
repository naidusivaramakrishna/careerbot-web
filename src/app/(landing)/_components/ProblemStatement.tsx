'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  Download,
  Frown,
  Layers,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ProblemCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageClassName: string;
  color: string;
  iconGradient: [string, string];
  tint: string;
  footerIcon: LucideIcon;
  footer: string;
};

const problems: ProblemCard[] = [
  {
    icon: Layers,
    title: 'Formatting breaks confidence',
    description:
      'Most resume tools make candidates fight spacing, sections, exports, and template consistency before the content is even ready.',
    image: '/images/landing/problem-formatting.png',
    imageAlt: 'Resume formatting issue preview with a warning badge',
    imageClassName: 'w-full max-w-[136px] xl:max-w-[152px] 2xl:max-w-[168px]',
    color: '#2557A7',
    iconGradient: ['#F6F9FF', '#EDF4FF'],
    tint: '#EEF4FC',
    footerIcon: Frown,
    footer: 'Wastes time and kills your confidence',
  },
  {
    icon: RefreshCw,
    title: 'Every role needs a different version',
    description:
      'A generic resume rarely matches the job description. Candidates need faster ways to tailor bullets, skills, and summaries.',
    image: '/images/landing/problem-versions.png',
    imageAlt: 'Role-specific resume version selector',
    imageClassName: 'w-full max-w-[134px] xl:max-w-[150px] 2xl:max-w-[166px]',
    color: '#10B981',
    iconGradient: ['#F3FDF9', '#E6FBF2'],
    tint: '#EAFAF3',
    footerIcon: Target,
    footer: 'Missed matches due to irrelevant resumes',
  },
  {
    icon: Send,
    title: 'Weak bullets hide real impact',
    description:
      'Responsibilities often sound flat without metrics, ownership, tools, and outcomes recruiters can scan quickly.',
    image: '/images/landing/problem-impact.png',
    imageAlt: 'Before and after bullet improvement preview',
    imageClassName: 'w-full max-w-[140px] xl:max-w-[158px] 2xl:max-w-[174px]',
    color: '#8B5CF6',
    iconGradient: ['#FAF7FF', '#F3EEFF'],
    tint: '#F5F0FF',
    footerIcon: Rocket,
    footer: 'Lower chances of getting noticed',
  },
  {
    icon: Download,
    title: 'Export anxiety slows applications',
    description:
      'Before applying, job seekers need a clean PDF or DOCX that looks professional and stays readable after download.',
    image: '/images/landing/problem-export.png',
    imageAlt: 'Resume export preview with PDF and DOCX badges',
    imageClassName: 'w-full max-w-[126px] xl:max-w-[140px] 2xl:max-w-[154px]',
    color: '#F97316',
    iconGradient: ['#FFF9F5', '#FFF0E4'],
    tint: '#FFF2E9',
    footerIcon: Clock3,
    footer: 'Delays applications and costs opportunities',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function ProblemStatement() {
  return (
    <section className="scroll-mt-24 relative overflow-hidden bg-[#FBFCFF] py-10 lg:py-14 xl:py-16 2xl:py-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 -top-[120px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#2557A7] opacity-[0.08] blur-[180px]" />
        <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-white opacity-20 blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <motion.div
          className="grid min-w-0 gap-5 md:grid-cols-2 lg:grid-cols-[240px_repeat(4,minmax(0,1fr))] xl:grid-cols-[300px_repeat(4,minmax(0,1fr))] 2xl:grid-cols-[360px_repeat(4,minmax(0,1fr))] 2xl:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div
            className="flex min-w-0 flex-col justify-center py-2 md:col-span-2 lg:col-span-1 lg:pr-3 2xl:pr-5"
            variants={cardVariants}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="w-fit rounded-full bg-[#edf5ff] px-4 py-2 text-[11px] font-bold uppercase leading-none tracking-wide text-[#2557A7]">
              The problem
            </span>
            <h2 className="mb-[26px] mt-7 max-w-[760px] text-[30px] font-bold leading-[1.22] tracking-tight text-[#081C45] sm:text-[36px] lg:max-w-none lg:mb-6 lg:text-[28px] xl:mb-8 xl:text-[34px] 2xl:mb-10 2xl:text-[42px]">
              A resume shouldn&apos;t feel like a design project before{' '}
              <span className="text-[#2557A7]">every application.</span>
            </h2>
            <p className="mb-6 max-w-[620px] text-[15px] font-normal leading-7 text-[#4F5D73] lg:mb-7 lg:max-w-[230px] lg:text-[13px] lg:leading-6 xl:mb-8 xl:max-w-[280px] xl:text-[15px] xl:leading-7 2xl:mb-[42px] 2xl:max-w-[320px] 2xl:text-[17px] 2xl:leading-[30px]">
              Most tools make you fight formatting, guess what to write, and repeat the same work. CareerBot fixes that - so you can focus
              on getting hired.
            </p>
            <div className="space-y-3 lg:space-y-3 2xl:space-y-[18px]">
              {['AI-powered suggestions', 'Role-specific optimization', 'Clean, recruiter-friendly exports'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[14px] font-semibold text-[#0b1746] lg:text-[12px] xl:text-[13px] 2xl:text-[14px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 fill-[#2557A7] text-white" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {problems.map((problem, index) => {
            const Icon = problem.icon;
            const FooterIcon = problem.footerIcon;

            return (
              <motion.article
                key={problem.title}
                className="group relative flex min-h-[340px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[rgba(37,87,167,0.08)] bg-white/[.98] px-5 pb-4 pt-5 backdrop-blur-[16px] transition-all duration-[350ms] ease-out hover:-translate-y-2 hover:scale-[1.015] lg:min-h-[368px] lg:px-6 lg:pb-5 lg:pt-6 xl:min-h-[400px] xl:rounded-[22px] xl:px-7 2xl:min-h-[430px] 2xl:rounded-[24px] 2xl:px-7 2xl:pb-5 2xl:pt-6"
                style={{
                  boxShadow:
                    '0 1px 2px rgba(16,24,40,.03), 0 8px 24px rgba(37,87,167,.05), 0 20px 60px rgba(37,87,167,.08), 0 40px 120px rgba(37,87,167,.06)',
                }}
                variants={cardVariants}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(37,87,167,.06), 0 16px 48px rgba(37,87,167,.10), 0 40px 100px rgba(37,87,167,.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 1px 2px rgba(16,24,40,.03), 0 8px 24px rgba(37,87,167,.05), 0 20px 60px rgba(37,87,167,.08), 0 40px 120px rgba(37,87,167,.06)';
                }}
              >
                {/* Top accent glow behind icon */}
                <div
                  className="pointer-events-none absolute left-5 top-5 h-[100px] w-[100px] rounded-full opacity-[0.18] blur-[60px] transition-opacity duration-300 ease-out group-hover:opacity-[0.28] 2xl:left-7 2xl:top-6"
                  style={{ backgroundColor: problem.color }}
                />

                <div className="relative flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] transition-transform duration-300 ease-out group-hover:rotate-3 2xl:h-[52px] 2xl:w-[52px] 2xl:rounded-[16px]"
                    style={{
                      background: `linear-gradient(180deg, ${problem.iconGradient[0]}, ${problem.iconGradient[1]})`,
                      color: problem.color,
                      boxShadow: '0 12px 30px rgba(37,87,167,.10)',
                    }}
                  >
                    <Icon className="h-5 w-5 2xl:h-6 2xl:w-6" strokeWidth={2.6} />
                  </div>
                  <span
                    className="text-[22px] font-bold leading-none 2xl:text-[30px]"
                    style={{ color: '#081C45', opacity: 0.28 }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="relative mt-4 text-[16px] font-bold leading-[1.3] text-[#081C45] xl:mt-5 xl:text-[18px] 2xl:mt-5 2xl:text-[19px]">
                  {problem.title}
                </h3>
                <p className="relative mt-2 text-[12px] font-normal leading-[1.5] text-[#55657C] xl:mt-3 xl:text-[13px] xl:leading-6 2xl:mt-3 2xl:text-[14px] 2xl:leading-[24px]">
                  {problem.description}
                </p>

                <div className="relative mt-auto flex h-[78px] items-center justify-center px-[15px] pt-3 lg:h-[86px] xl:h-[94px] 2xl:h-[100px] 2xl:px-[17px] 2xl:pt-3">
                  <Image
                    src={problem.image}
                    alt={problem.imageAlt}
                    width={1084}
                    height={932}
                    className={problem.imageClassName}
                    sizes="(max-width: 768px) 70vw, (max-width: 1279px) 190px, (max-width: 1536px) 220px, 250px"
                  />
                </div>

                {/* Gradient divider */}
                <div className="relative mt-3 h-px w-full bg-[linear-gradient(90deg,transparent,#DCE7F7,transparent)] 2xl:mt-3" />

                {/* Bottom pain box */}
                <div
                  className="relative mt-3 rounded-[14px] border border-[rgba(37,87,167,0.06)] bg-[#FCFDFF] p-[12px] 2xl:mt-3 2xl:p-[14px]"
                  style={{ boxShadow: '0 10px 30px rgba(37,87,167,.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg 2xl:h-8 2xl:w-8"
                      style={{ backgroundColor: problem.tint, color: problem.color }}
                    >
                      <FooterIcon className="h-4 w-4 2xl:h-[18px] 2xl:w-[18px]" strokeWidth={2.4} />
                    </div>
                    <p className="text-[11px] font-semibold leading-snug text-[#17234f] xl:text-[12px] 2xl:text-[14px]">
                      {problem.footer}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-10 flex items-center justify-center gap-3 rounded-[18px] border border-[rgba(37,87,167,0.06)] bg-[#FCFDFF] px-6 py-5 text-center text-[15px] font-semibold text-[#081C45] 2xl:mt-14 2xl:py-6 2xl:text-[17px]"
          style={{ boxShadow: '0 10px 30px rgba(37,87,167,.05)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-[#2557A7]" strokeWidth={2.4} />
          <span>CareerBot removes friction at every step - so your resume works for you, not against you.</span>
        </motion.div>
      </div>
    </section>
  );
}
