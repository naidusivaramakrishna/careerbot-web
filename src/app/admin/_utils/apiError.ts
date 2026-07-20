type ApiErrorShape = {
    response?: {
        data?: {
            error?: { message?: string };
            detail?: string | Array<{ msg?: string; message?: string }>;
        };
    };
};

export function extractApiError(error: unknown, fallback: string): string {
    const err = error as ApiErrorShape;
    const detail = err?.response?.data?.detail;
    const detailStr = Array.isArray(detail)
        ? (detail[0]?.msg || detail[0]?.message || fallback)
        : detail;
    return err?.response?.data?.error?.message || detailStr || fallback;
}
