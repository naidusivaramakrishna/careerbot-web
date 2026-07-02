'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Frown,
  Layers,
  RefreshCw,
  Rocket,
  Send,
  Target,
  Zap,
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
  iconBg: string;
  footerIcon: LucideIcon;
  footer: string;
  footerBg: string;
};

const problems: ProblemCard[] = [
  {
    icon: Layers,
    title: 'Formatting breaks confidence',
    description:
      'Most resume tools make candidates fight spacing, sections, exports, and template consistency before the content is even ready.',
    image: '/images/landing/problem-formatting.png',
    imageAlt: 'Resume formatting issue preview with a warning badge',
    imageClassName: 'w-full max-w-[168px] xl:max-w-[190px] 2xl:max-w-[222px]',
    color: '#1167e8',
    iconBg: '#eef5ff',
    footerIcon: Frown,
    footer: 'Wastes time and kills your confidence',
    footerBg: '#eef5ff',
  },
  {
    icon: RefreshCw,
    title: 'Every role needs a different version',
    description:
      'A generic resume rarely matches the job description. Candidates need faster ways to tailor bullets, skills, and summaries.',
    image: '/images/landing/problem-versions.png',
    imageAlt: 'Role-specific resume version selector',
    imageClassName: 'w-full max-w-[166px] xl:max-w-[188px] 2xl:max-w-[220px]',
    color: '#16a56f',
    iconBg: '#eafaf2',
    footerIcon: Target,
    footer: 'Missed matches due to irrelevant resumes',
    footerBg: '#eafaf2',
  },
  {
    icon: Send,
    title: 'Weak bullets hide real impact',
    description:
      'Responsibilities often sound flat without metrics, ownership, tools, and outcomes recruiters can scan quickly.',
    image: '/images/landing/problem-impact.png',
    imageAlt: 'Before and after bullet improvement preview',
    imageClassName: 'w-full max-w-[174px] xl:max-w-[198px] 2xl:max-w-[232px]',
    color: '#7c3cff',
    iconBg: '#f4efff',
    footerIcon: Rocket,
    footer: 'Lower chances of getting noticed',
    footerBg: '#f4efff',
  },
  {
    icon: Download,
    title: 'Export anxiety slows applications',
    description:
      'Before applying, job seekers need a clean PDF or DOCX that looks professional and stays readable after download.',
    image: '/images/landing/problem-export.png',
    imageAlt: 'Resume export preview with PDF and DOCX badges',
    imageClassName: 'w-full max-w-[156px] xl:max-w-[178px] 2xl:max-w-[205px]',
    color: '#f97316',
    iconBg: '#fff1e8',
    footerIcon: Clock3,
    footer: 'Delays applications and costs opportunities',
    footerBg: '#fff1e8',
  },
];

const highlights = [
  { icon: FileText, value: '12,400+', label: 'Resumes improved', color: '#1167e8', bg: '#eef5ff' },
  { icon: CheckCircle2, value: '95%', label: 'ATS pass rate', color: '#16a56f', bg: '#eafaf2' },
  { icon: Zap, value: '50,000+', label: 'Jobs matched', color: '#7c3cff', bg: '#f4efff' },
  { icon: Download, value: '1M+', label: 'Exports generated', color: '#f97316', bg: '#fff1e8' },
];

export default function ProblemStatement() {
  return (
    <section className="scroll-mt-24 overflow-hidden bg-white py-10 lg:py-12 2xl:py-16">
      <div className="mx-auto w-full max-w-[1464px] px-4 sm:px-6 lg:px-6 2xl:px-0">
        <motion.div
          className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-[220px_repeat(4,minmax(0,1fr))] xl:grid-cols-[250px_repeat(4,minmax(0,1fr))] 2xl:grid-cols-[285px_repeat(4,minmax(0,1fr))] 2xl:gap-5"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="flex min-w-0 flex-col justify-center py-2 md:col-span-2 lg:col-span-1 lg:pr-3 2xl:pr-5">
            <span className="w-fit rounded-full bg-[#edf5ff] px-4 py-2 text-[11px] font-black uppercase leading-none text-[#0969e8]">
              The problem
            </span>
            <h2 className="mt-7 max-w-[760px] text-[34px] font-black leading-[1.18] tracking-normal text-[#08143f] sm:text-[42px] lg:max-w-none lg:text-[32px] xl:text-[36px] 2xl:mt-8 2xl:text-[39px]">
              A resume shouldn&apos;t feel like a design project before{' '}
              <span className="text-[#0b67e8]">every application.</span>
            </h2>
            <p className="mt-6 max-w-[620px] text-[16px] font-semibold leading-7 text-[#435373] lg:max-w-[220px] lg:text-[13px] lg:leading-6 xl:max-w-[250px] xl:text-[14px] 2xl:mt-8 2xl:max-w-[285px] 2xl:text-[16px] 2xl:leading-7">
              Most tools make you fight formatting, guess what to write, and repeat the same work. CareerBot fixes that - so you can focus
              on getting hired.
            </p>
            <div className="mt-7 space-y-4">
              {['AI-powered suggestions', 'Role-specific optimization', 'Clean, recruiter-friendly exports'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[14px] font-black text-[#0b1746] lg:text-[12px] xl:text-[13px] 2xl:text-[14px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 fill-[#2278f3] text-white" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {problems.map((problem, index) => {
            const Icon = problem.icon;
            const FooterIcon = problem.footerIcon;

            return (
              <motion.article
                key={problem.title}
                className="flex min-h-[430px] min-w-0 flex-col rounded-xl border border-[#d8e6fb] bg-white p-4 shadow-[0_18px_46px_rgba(15,67,142,0.07)] transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,67,142,0.12)] lg:min-h-[500px] lg:p-5 xl:min-h-[560px] xl:p-6 2xl:min-h-[620px] 2xl:p-7"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.04 }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl 2xl:h-14 2xl:w-14"
                    style={{ backgroundColor: problem.iconBg, color: problem.color }}
                  >
                    <Icon className="h-6 w-6 2xl:h-[29px] 2xl:w-[29px]" strokeWidth={2.8} />
                  </div>
                  <span className="text-[22px] font-black leading-none text-[#9cbcff] 2xl:text-[24px]">{String(index + 1).padStart(2, '0')}</span>
                </div>

                <h3 className="mt-7 text-[17px] font-black leading-[1.22] text-[#08143f] xl:text-[19px] 2xl:mt-8 2xl:text-[22px]">{problem.title}</h3>
                <p className="mt-4 text-[12px] font-semibold leading-6 text-[#4b5d7d] xl:text-[13px] 2xl:mt-5 2xl:text-[15px] 2xl:leading-7">{problem.description}</p>

                <div className="mt-auto flex h-[130px] items-center justify-center pt-5 lg:h-[150px] lg:pt-6 xl:h-[175px] 2xl:h-[205px] 2xl:pt-8">
                  <Image
                    src={problem.image}
                    alt={problem.imageAlt}
                    width={1084}
                    height={932}
                    className={problem.imageClassName}
                    sizes="(max-width: 768px) 70vw, (max-width: 1279px) 170px, (max-width: 1536px) 200px, 250px"
                  />
                </div>

                <div className="mt-5 border-t border-[#dfe9f7] pt-4 2xl:mt-7 2xl:pt-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg 2xl:h-9 2xl:w-9"
                      style={{ backgroundColor: problem.footerBg, color: problem.color }}
                    >
                      <FooterIcon className="h-5 w-5 2xl:h-[22px] 2xl:w-[22px]" strokeWidth={2.6} />
                    </div>
                    <p className="text-[12px] font-black leading-snug text-[#17234f] xl:text-[13px] 2xl:text-[15px]">{problem.footer}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-10 rounded-xl border border-[#d8e6fb] bg-white px-5 py-6 shadow-[0_18px_46px_rgba(15,67,142,0.07)] lg:px-6 2xl:mt-16 2xl:px-9 2xl:py-7"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="grid min-w-0 gap-6 md:grid-cols-2 lg:grid-cols-[1.25fr_0.02fr_repeat(4,1fr)] lg:items-center 2xl:gap-8">
            <div className="flex items-center gap-6">
              <Image
                src="/images/landing/problem-bot-icon.png"
                alt="CareerBot assistant icon"
                width={72}
                height={72}
                className="h-[64px] w-[64px] rounded-xl shadow-[0_12px_28px_rgba(13,37,120,0.14)]"
              />
              <div>
                <h3 className="text-[18px] font-black text-[#08143f]">CareerBot changes the experience.</h3>
                <p className="mt-2 max-w-[430px] text-[15px] font-semibold leading-6 text-[#435373]">
                  Smart content suggestions, role-based optimization, and one-click clean exports - built to help you get hired faster.
                </p>
              </div>
            </div>
            <div className="hidden h-20 w-px bg-[#cddbf0] lg:block" />
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: item.bg, color: item.color }}>
                    <Icon size={27} strokeWidth={2.8} />
                  </div>
                  <div>
                    <p className="text-[25px] font-black leading-none" style={{ color: item.color }}>
                      {item.value}
                    </p>
                    <p className="mt-2 text-[13px] font-semibold text-[#435373]">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
