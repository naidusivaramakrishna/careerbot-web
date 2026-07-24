import type { ReactElement } from "react";
import {
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardCheck,
  Crown,
  FilePenLine,
  FileUser,
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  ReceiptText,
  Rocket,
  FileScan,
  ShieldCheck,
  Sparkles,
  SquareChartGantt,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type EnterpriseIconProps = {
  size?: number;
  className?: string;
  sw?: number;
};

export type EnterpriseNavIcon = (props: EnterpriseIconProps) => ReactElement;

const createEnterpriseNavIcon = (
  Icon: LucideIcon,
  opticalStroke = 1.85,
): EnterpriseNavIcon => {
  const EnterpriseIcon = ({
    size = 18,
    className = "",
    sw = opticalStroke,
  }: EnterpriseIconProps) => (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={size}
      className={className}
      strokeWidth={sw}
      absoluteStrokeWidth
    />
  );

  EnterpriseIcon.displayName = `EnterpriseNavIcon(${Icon.displayName ?? Icon.name ?? "Lucide"})`;
  return EnterpriseIcon;
};

export const EnterpriseDashboardIcon = createEnterpriseNavIcon(LayoutDashboard);
export const EnterpriseProfileIcon = createEnterpriseNavIcon(UserRound);
export const EnterpriseResumeIcon = createEnterpriseNavIcon(FileUser);
export const EnterpriseAtsScanIcon = createEnterpriseNavIcon(FileScan);
export const EnterpriseJobMatchIcon = createEnterpriseNavIcon(ClipboardCheck);
export const EnterpriseJobsIcon = createEnterpriseNavIcon(BriefcaseBusiness);
export const EnterpriseApplicationTrackerIcon = createEnterpriseNavIcon(SquareChartGantt);
export const EnterpriseNotesIcon = createEnterpriseNavIcon(NotebookPen);
export const EnterpriseInterviewPrepIcon = createEnterpriseNavIcon(MessageSquareText);
export const EnterpriseSubscriptionIcon = createEnterpriseNavIcon(BadgeCheck);
export const EnterpriseBillingHistoryIcon = createEnterpriseNavIcon(ReceiptText);
export const EnterpriseCoverLetterIcon = createEnterpriseNavIcon(FilePenLine);
export const EnterprisePlanIcon = createEnterpriseNavIcon(Crown, 1.9);
export const EnterpriseUpgradeIcon = createEnterpriseNavIcon(Rocket, 1.9);
export const EnterpriseNotificationIcon = createEnterpriseNavIcon(BellRing, 1.9);
export const EnterpriseSystemNotificationIcon = createEnterpriseNavIcon(ShieldCheck, 1.9);
export const EnterpriseAiActionIcon = createEnterpriseNavIcon(Sparkles, 1.9);
export const EnterpriseChevronRightIcon = createEnterpriseNavIcon(ChevronRight, 2.25);

