export function formatDate(dateString: string | null | undefined, fallback = 'N/A'): string {
    if (!dateString) return fallback;
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTime(dateString: string | null | undefined, fallback = 'Never'): string {
    if (!dateString) return fallback;
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
