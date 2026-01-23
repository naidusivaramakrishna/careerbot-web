import { Download } from "lucide-react";

const DownloadModal = ({
    isOpen,
    onClose,
    onDownload,
    downloading
}: {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (format: 'pdf' | 'docx') => void;
    downloading: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Download className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Download Resume</h3>
                        <p className="text-sm text-gray-600">Choose your preferred format</p>
                    </div>
                </div>

                <p className="text-gray-700 mb-6">
                    Select the file format you&apos;d like to download your resume in.
                </p>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => onDownload('pdf')}
                        disabled={downloading}
                        className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9L13,3.5V9H18.5Z" />
                            </svg>
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900">PDF Document</p>
                            <p className="text-xs text-gray-500">Best for sharing and printing</p>
                        </div>
                        {downloading && (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </button>

                    <button
                        onClick={() => onDownload('docx')}
                        disabled={downloading}
                        className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9L13,3.5V9H18.5Z" />
                            </svg>
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-semibold text-gray-900">Word Document</p>
                            <p className="text-xs text-gray-500">Editable in Microsoft Word</p>
                        </div>
                        {downloading && (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    disabled={downloading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};


export default DownloadModal