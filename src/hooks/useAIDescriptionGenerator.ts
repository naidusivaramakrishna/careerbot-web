import { useState } from 'react';
import { toast } from 'sonner';

interface GenerateDescriptionParams {
    job_title?: string;
    company?: string;
    job_type?: string;
    location?: string;
}

interface GenerateProjectParams {
    project_name?: string;
    project_type?: string;
    technologies?: string;
    role?: string;
}

interface GenerateSummaryParams {
    fullName?: string;
    headline?: string;
    location?: string;
    skills?: string[];
}

export const useAIGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * Generate experience description based on job details
     */
    const generateDescription = async (params: GenerateDescriptionParams): Promise<string | null> => {
        if (!params.job_title?.trim()) {
            toast.error("Please enter a position/job title first");
            return null;
        }

        setIsGenerating(true);
        toast.loading("Generating description...", { id: "ai-generation" });

        try {
            const response = await fetch("/api/generate-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: 'experience',
                    ...params
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate description");
            }

            if (!data.description) {
                throw new Error("AI returned no description");
            }

            toast.success("Description generated!", { id: "ai-generation" });
            return data.description;
        } catch {
            toast.error("Failed to generate description", { id: "ai-generation" });
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Generate project description based on project details
     */
    const generateProjectDescription = async (params: GenerateProjectParams): Promise<string | null> => {
        if (!params.project_name?.trim()) {
            toast.error("Please enter a project name first");
            return null;
        }

        setIsGenerating(true);
        toast.loading("Generating project description...", { id: "ai-generation" });

        try {
            const response = await fetch("/api/generate-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: 'project',
                    ...params
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate project description");
            }

            if (!data.description) {
                throw new Error("AI returned no description");
            }

            toast.success("Project description generated!", { id: "ai-generation" });
            return data.description;
        } catch {
            toast.error("Failed to generate project description", { id: "ai-generation" });
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Generate professional summary based on profile information
     */
    const generateSummary = async (params: GenerateSummaryParams): Promise<string | null> => {
        setIsGenerating(true);
        toast.loading("Generating summary...", { id: "ai-generation" });

        try {
            const response = await fetch("/api/generate-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: 'summary',
                    ...params
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate summary");
            }

            if (!data.summary) {
                throw new Error("AI returned no summary");
            }

            toast.success("Summary generated!", { id: "ai-generation" });
            return data.summary;
        } catch {
            toast.error("Failed to generate summary", { id: "ai-generation" });
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        generateDescription,
        generateProjectDescription,
        generateSummary,
    };
};
