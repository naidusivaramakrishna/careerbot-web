"use client";
import { ArrowRight, Ellipsis, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import type { StartResume } from "../page";
import ResumeThumbnail from "./ResumeThumbnail";

const YourResumes = ({ resumes }: { resumes: StartResume[] }) => {
  const router = useRouter();

  const open = (resume: StartResume) => {
    localStorage.removeItem("resumeData");
    localStorage.setItem("current_resume_id", resume.id);
    router.push(
      resume.source === "enhanced"
        ? `/builder/creation/${encodeURIComponent(resume.id)}?source=enhanced`
        : `/builder/creation/${encodeURIComponent(resume.id)}`,
    );
  };

  return (
    <section className="mt-8">
      {resumes.length > 0 && (
        <>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Your Resumes</h2>
              <p className="text-sm text-gray-600 mt-1">Continue editing your saved resumes or create a new one.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/builder/start/list")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d4fa8] hover:underline"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumes.slice(0, 3).map((resume) => (
              <div
                key={resume.id}
                className="flex items-start gap-3.5 bg-white rounded-xl border border-[#e3e9f2] p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <ResumeThumbnail resumeId={resume.id} source={resume.source} updatedAt={resume.updatedAt} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{resume.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Updated {resume.modified}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1.5 rounded-full bg-[#e3e9f2] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1d4fa8]"
                        style={{ width: `${Math.min(100, Math.max(0, resume.score))}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap">{resume.score}% score</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => open(resume)}
                      className="flex-1 h-8 rounded-md bg-[#eceff4] hover:bg-[#1d4fa8] text-xs font-semibold text-gray-700 hover:text-white transition-colors"
                    >
                      Continue Editing
                    </button>
                    <button
                      type="button"
                      aria-label="Open all resumes"
                      onClick={() => router.push("/builder/start/list")}
                      className="w-8 h-8 rounded-md border border-[#e3e9f2] bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600"
                    >
                      <Ellipsis className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#eef3fa] px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-[#dbe6f6] flex items-center justify-center shrink-0">
          <Lightbulb className="w-4.5 h-4.5 text-[#1d4fa8]" />
        </div>
        <span className="text-sm font-semibold text-gray-900">Tip</span>
        <span className="h-5 w-px bg-[#c9d6ea]" />
        <p className="text-[13px] text-gray-600">
          Tailor your resume to each job to improve your chances of getting noticed.
        </p>
      </div>
    </section>
  );
};

export default YourResumes;
