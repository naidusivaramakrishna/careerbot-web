import { Bot, Check, MessageCircle, Search, Shield, UserRound } from 'lucide-react';
import type { ArticleIllustration } from '@/lib/blog';

const PRIMARY = '#2557A7';
const SUCCESS = '#10B981';
const PURPLE_MID = '#9B72E8';
const PURPLE_DARK = '#7C4FE0';

export function TeamAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${PRIMARY}, #4c8fd6)` }}
    >
      <Bot size={size * 0.56} strokeWidth={2.4} />
    </div>
  );
}

function ResumeArt() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #DCE8FF 0%, #A9C6FF 100%)' }}
    >
      {/* desk / pedestal */}
      <div className="absolute bottom-[4%] left-1/2 h-[13%] w-[86%] -translate-x-1/2 rounded-[50%] bg-white/30" />

      {/* desk props */}
      <div className="absolute bottom-[13%] left-[7%] flex items-end gap-1">
        <div className="h-8 w-6 rounded-t-full rounded-b-md bg-slate-800/80" />
        <div className="h-7 w-4 rounded-sm bg-slate-800/70" />
        <div className="h-6 w-4 rounded-sm bg-slate-700/70" />
      </div>

      {/* document with folded corner */}
      <div className="absolute left-[24%] top-[6%] h-[74%] w-[56%] overflow-hidden rounded-md bg-white" style={{ boxShadow: '0 16px 30px rgba(16,24,40,0.2)' }}>
        <div className="absolute right-0 top-0 h-3.5 w-3.5" style={{ background: '#CBD5E1', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 shrink-0 rounded-sm" style={{ background: 'linear-gradient(135deg,#FBBF71,#F59E42)' }} />
            <div className="h-2 flex-1 rounded bg-slate-300" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-1.5 w-full rounded bg-slate-100" />
            <div className="h-1.5 w-5/6 rounded bg-slate-100" />
            <div className="h-1.5 w-full rounded bg-slate-100" />
            <div className="h-1.5 w-4/6 rounded bg-slate-100" />
            <div className="h-1.5 w-full rounded bg-slate-100" />
            <div className="h-1.5 w-3/6 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* shield + check badge, two-tone like the mockup */}
      <div className="absolute right-[10%] top-[38%] flex h-[24%] w-[24%] items-center justify-center">
        <Shield className="absolute inset-0 h-full w-full" style={{ color: PRIMARY }} fill={PRIMARY} strokeWidth={0} />
        <Check className="relative h-[42%] w-[42%] text-white" strokeWidth={3.5} />
      </div>
    </div>
  );
}

function AtsArt() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #DFF7EA 0%, #B7ECC9 100%)' }}
    >
      <div className="h-[72%] w-[64%] overflow-hidden rounded-lg bg-white" style={{ boxShadow: '0 14px 28px rgba(16,24,40,0.14)' }}>
        <div className="flex items-center gap-1 px-3 pt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3.5 p-3 pt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded" style={{ backgroundColor: SUCCESS }}>
                <Check className="h-3 w-3 text-white" strokeWidth={4} />
              </div>
              <div className="h-1.5 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-[12%] right-[12%] flex h-[20%] w-[20%] items-center justify-center rounded-full"
        style={{ backgroundColor: SUCCESS, boxShadow: '0 10px 22px rgba(16,185,129,0.45)' }}
      >
        <Search className="h-[46%] w-[46%] text-white" strokeWidth={2.8} />
      </div>
    </div>
  );
}

function CoverLetterArt() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EDE7FF 0%, #D9CBFF 100%)' }}
    >
      {/* envelope body + roof, one silhouette (paints first = bottom layer) */}
      <div
        className="absolute bottom-[8%] left-1/2 h-[50%] w-[70%] -translate-x-1/2 rounded-b-lg"
        style={{ backgroundColor: PURPLE_MID, clipPath: 'polygon(0% 34%, 50% 0%, 100% 34%, 100% 100%, 0% 100%)', boxShadow: '0 16px 26px rgba(124,79,224,0.3)' }}
      />

      {/* letter, resting right at the envelope opening (paints second = middle layer) */}
      <div className="absolute left-1/2 top-[8%] h-[42%] w-[44%] -translate-x-1/2 rounded-md bg-white p-2.5" style={{ boxShadow: '0 10px 18px rgba(16,24,40,0.16)' }}>
        <div className="h-2 w-3/4 rounded bg-slate-300" />
        <div className="mt-2 h-1.5 w-full rounded bg-slate-100" />
        <div className="mt-1.5 h-1.5 w-5/6 rounded bg-slate-100" />
        <div className="mt-1.5 h-1.5 w-2/3 rounded bg-slate-100" />
      </div>

      {/* front flap crease, folds over the lower half of the envelope (paints last = top layer) */}
      <div
        className="absolute bottom-[8%] left-1/2 h-[26%] w-[70%] -translate-x-1/2"
        style={{ backgroundColor: PURPLE_DARK, clipPath: 'polygon(0% 0%, 50% 100%, 100% 0%, 100% 100%, 0% 100%)' }}
      />
    </div>
  );
}

function InterviewArt() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #DCE8FF 0%, #AFC9FF 100%)' }}
    >
      {/* large chat bubble */}
      <div
        className="absolute left-[10%] top-[10%] flex h-[32%] w-[52%] flex-col justify-center gap-2 rounded-2xl rounded-bl-md px-4"
        style={{ backgroundColor: PRIMARY, boxShadow: '0 10px 20px rgba(37,87,167,0.3)' }}
      >
        <div className="h-2 w-4/5 rounded-full bg-white/85" />
        <div className="h-2 w-3/5 rounded-full bg-white/85" />
      </div>

      {/* small bubble chip */}
      <div className="absolute left-[10%] top-[50%] flex h-[26%] w-[30%] items-center justify-center rounded-xl bg-white" style={{ boxShadow: '0 8px 16px rgba(16,24,40,0.12)' }}>
        <MessageCircle className="h-[42%] w-[42%]" style={{ color: PRIMARY }} fill={PRIMARY} strokeWidth={0} />
      </div>

      {/* person icons, bare fill */}
      <UserRound className="absolute right-[13%] top-[16%] h-[15%] w-[15%]" style={{ color: PRIMARY }} fill={PRIMARY} strokeWidth={0} />
      <UserRound className="absolute left-[15%] bottom-[8%] h-[15%] w-[15%]" style={{ color: PRIMARY }} fill={PRIMARY} strokeWidth={0} />

      {/* text-line chip */}
      <div className="absolute bottom-[10%] right-[8%] flex h-[24%] w-[38%] flex-col justify-center gap-2 rounded-xl bg-white px-3.5" style={{ boxShadow: '0 8px 16px rgba(16,24,40,0.12)' }}>
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-4/5 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export const illustrations: Record<ArticleIllustration, () => React.ReactElement> = {
  resume: ResumeArt,
  ats: AtsArt,
  'cover-letter': CoverLetterArt,
  interview: InterviewArt,
};
