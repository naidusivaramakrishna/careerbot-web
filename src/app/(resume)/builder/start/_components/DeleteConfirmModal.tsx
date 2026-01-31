import { Trash2 } from "lucide-react";

const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    deleting
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Delete Resume?</h3>
                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                </div>

                <p className="text-gray-700 mb-6">
                    Are you sure you want to delete this resume? All data will be permanently removed from the system.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-2 border cursor-pointer border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 px-4 py-2 bg-red-600 cursor-pointer text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal
