import { CheckCircle2, Users } from 'lucide-react';

export default function TrustBadgeRow() {
  const badges = [
    { icon: Users, text: '12,400+ job seekers' },
    { icon: CheckCircle2, text: 'Free plan - no credit card required' },
  ];

  return (
    <div className="relative border-y border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 py-4">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.text}
                className="flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 shadow-sm shadow-blue-100/70"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                  <Icon size={15} className="text-[#2557a7]" />
                </span>
                <span className="text-sm font-semibold text-slate-700">{badge.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
