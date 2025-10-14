import React, { useState, useMemo } from "react";
import Image from "next/image"; // Added import for Image component
import { ArrowLeft, CheckCircle2, FileText, Lightbulb, Loader2 } from "lucide-react";
import { getSeverityStyle } from "../utils/helpers";
import { AnalysisItem } from "../utils/data";

const ResumeEnhancer = ({
  onBackToAnalysis,
  currentScore,
  onScoreUpdate,
  initialAnalysisData,
}: {
  onBackToAnalysis: () => void;
  currentScore: number;
  onScoreUpdate: (newScore: number) => void;
  initialAnalysisData: AnalysisItem[];
}) => {
  const [issuesToResolve, setIssuesToResolve] =
    useState<AnalysisItem[]>(initialAnalysisData);
  const [resolvedIssues, setResolvedIssues] = useState<AnalysisItem[]>([]);
  const [isFixing, setIsFixing] = useState<number | null>(null);

  const fixableIssues = useMemo(
    () => initialAnalysisData.filter((item) => item.severity !== "Positive"),
    [initialAnalysisData]
  );
  const totalPossiblePoints = useMemo(
    () => fixableIssues.reduce((sum, item) => sum + item.points, 0),
    [fixableIssues]
  );
  const pointsGained = useMemo(
    () =>
      resolvedIssues.reduce(
        (sum, item) => (item.severity !== "Positive" ? sum + item.points : sum),
        0
      ),
    [resolvedIssues]
  );
  const totalIssuesCount = initialAnalysisData.length;
  const issuesReviewedCount = totalIssuesCount - issuesToResolve.length;
  const pointsRemaining = fixableIssues
    .filter((item) => !resolvedIssues.some((resolved) => resolved.id === item.id))
    .reduce((sum, item) => sum + item.points, 0);

  const handleFixIssue = (id: number) => {
    const itemToFix = issuesToResolve.find((item) => item.id === id);
    if (itemToFix) {
      setIsFixing(id);
      setTimeout(() => {
        setIssuesToResolve((prev) => prev.filter((item) => item.id !== id));
        setResolvedIssues((prev) =>
          [...prev, itemToFix].sort((a, b) => a.id - b.id)
        );
        onScoreUpdate(Math.min(100, currentScore + itemToFix.points));
        setIsFixing(null);
      }, 1000);
    }
  };

  const handleIgnoreIssue = (id: number) => {
    setIssuesToResolve((prev) => prev.filter((item) => item.id !== id));
  };

  const IssueCard = ({ item }: { item: AnalysisItem }) => {
    const style = getSeverityStyle(item.severity);
    const Icon = style.icon;
    const fixing = isFixing === item.id;

    return (
      <div
        className={`bg-white rounded-xl border ${style.cardBorderColor} shadow-sm overflow-hidden mb-4`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 mt-0.5 ${style.iconColor}`} />
              <h3 className="font-semibold text-gray-900">{item.issue}</h3>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${style.pointsBg}`}>
              +{item.points} Points
            </span>
          </div>
          <p className="pl-8 text-sm text-gray-600 mt-1">{item.description}</p>
        </div>
        <div className={`px-4 py-3 ${style.fixBg} border-t ${style.cardBorderColor}`}>
          <div className="flex items-start gap-3">
            <Lightbulb
              className={`w-5 h-5 mt-0.5 ${style.fixIconColor} flex-shrink-0`}
            />
            <div className="text-sm">
              <span className="font-semibold text-gray-800">Suggested Fix: </span>
              <span className="text-gray-700">{item.fix}</span>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => handleIgnoreIssue(item.id)}
            disabled={fixing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Ignore
          </button>
          <button
            onClick={() => handleFixIssue(item.id)}
            disabled={fixing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center w-24 disabled:bg-blue-400"
          >
            {fixing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fix It"}
          </button>
        </div>
      </div>
    );
  };

  const ResolvedIssueCard = ({ item }: { item: AnalysisItem }) => (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <p className="font-medium text-gray-800">{item.issue}</p>
      </div>
      <span className="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded-md">
        +{item.points} points
      </span>
    </div>
  );

  const AllIssuesResolvedContent = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col justify-between">
      <div className="w-full rounded-xl bg-gray-50 border border-gray-100 p-2 flex-1 flex flex-col justify-center">
        <div className="relative w-full overflow-hidden rounded-lg">
          <Image
            src="/images/All-issues-resolved.jpg"
            alt="All issues resolved"
            width={0}
            height={200}
            style={{ width: "100%", height: "290px", objectFit: "contain" }}
            sizes="100vw"
            priority
          />
        </div>
      </div>
      <p className="text-center text-lg font-semibold text-gray-900 mt-4">
        All issues resolved
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4  min-h-screen">
      <button
        onClick={onBackToAnalysis}
        className="px-3 py-1 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md mb-6 hover:bg-gray-100 flex items-center shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Analysis
      </button>

      <h1 className="text-3xl text-center font-bold text-gray-900 mb-2">
        Resume Enhancer
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Fix issues to improve your ATS score
      </p>

      {/* Progress header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium text-gray-700">Enhancement Progress</h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-800">{currentScore}</span>
            <span className="text-sm font-medium text-gray-500">/100</span>
            <p className="text-xs text-gray-500 -mt-1">Current Score</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          {issuesReviewedCount} of {totalIssuesCount} issues reviewed
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${
                totalPossiblePoints === 0
                  ? 100
                  : (pointsGained / totalPossiblePoints) * 100
              }%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          +{pointsGained} points gained • {pointsRemaining} points remaining
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Issues To Resolve</h2>
          <div className="min-h-[400px]">
            {issuesToResolve.length > 0 ? (
              issuesToResolve.map((item) => <IssueCard key={item.id} item={item} />)
            ) : (
              <AllIssuesResolvedContent />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Resolved Issues</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[400px] shadow-sm flex flex-col">
            {resolvedIssues.length > 0 ? (
              <div className="space-y-3 flex-1">
                {resolvedIssues.map((item) => (
                  <ResolvedIssueCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <FileText className="w-24 h-24 text-gray-300 mb-6" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  No issues resolved yet!
                </h3>
                <p className="text-gray-500 max-w-xs text-sm">
                  Start fixing issues to see progress here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEnhancer;