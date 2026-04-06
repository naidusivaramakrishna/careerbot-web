"use client";
import { Lightbulb, TrendingUp } from "lucide-react";

const tips = [
  {
    icon: Lightbulb,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    label: "Skill Tip",
    labelColor: "text-amber-700",
    text: 'Adding "Figma Prototyping" could increase your match rate by 15%.',
  },
  {
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    label: "Market Trend",
    labelColor: "text-emerald-700",
    text: "Fintech companies are hiring 20% more designers this quarter.",
  },
];

export default function CareerTip() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Career Insights</h3>
      <div className="space-y-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.label}
              className="flex gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100"
            >
              <div
                className={`w-7 h-7 rounded-lg ${tip.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
              >
                <Icon size={13} className={tip.iconColor} />
              </div>
              <div>
                <p className={`text-xs font-semibold mb-0.5 ${tip.labelColor}`}>{tip.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
