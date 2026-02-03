import { Bold, Italic, List, ListOrdered, Underline, Sparkles } from "lucide-react";
import { useRef, useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    minHeight?: string;
    disabled?: boolean;
    className?: string;
    onAIGenerate?: () => void;
    isGenerating?: boolean;
    showAIButton?: boolean;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Enter your text here...",
    minHeight = "150px",
    disabled = false,
    className = "",
    onAIGenerate,
    isGenerating = false,
    showAIButton = true,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Update editor content when value changes externally (e.g., from AI generation)
    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleContentChange = () => {
        if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            onChange(content);
        }
    };

    const toggleBold = () => {
        if (disabled) return;
        document.execCommand('bold', false);
        editorRef.current?.focus();
    };

    const toggleItalic = () => {
        if (disabled) return;
        document.execCommand('italic', false);
        editorRef.current?.focus();
    };

    const toggleUnderline = () => {
        if (disabled) return;
        document.execCommand('underline', false);
        editorRef.current?.focus();
    };

    const insertBulletList = () => {
        if (disabled) return;
        document.execCommand('insertUnorderedList', false);
        editorRef.current?.focus();
    };

    const insertNumberedList = () => {
        if (disabled) return;
        document.execCommand('insertOrderedList', false);
        editorRef.current?.focus();
    };

    return (
        <div className={`rich-text-editor-wrapper ${className}`}>
            {/* Toolbar */}
            <div className={`border border-neutral-200 rounded-t-lg bg-gray-50 p-2 flex gap-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                    type="button"
                    onClick={toggleBold}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Bold (Ctrl+B)"
                    disabled={disabled}
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={toggleItalic}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Italic (Ctrl+I)"
                    disabled={disabled}
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={toggleUnderline}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Underline (Ctrl+U)"
                    disabled={disabled}
                >
                    <Underline className="w-4 h-4" />
                </button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button
                    type="button"
                    onClick={insertBulletList}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Bullet List"
                    disabled={disabled}
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={insertNumberedList}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Numbered List"
                    disabled={disabled}
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Content with AI Button */}
            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    onInput={handleContentChange}
                    className="border border-t-0 border-neutral-200 rounded-b-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500 editor-content"
                    style={{ minHeight }}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                />

                {/* AI Generate Button - Top Right Corner */}
                {showAIButton && onAIGenerate && (
                    <button
                        type="button"
                        onClick={onAIGenerate}
                        disabled={isGenerating || disabled}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isGenerating || disabled
                                ? 'bg-gray-100 cursor-not-allowed'
                                : 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                            }`}
                        title={isGenerating ? "Generating..." : "Generate with AI"}
                    >
                        <Sparkles
                            className={`w-5 h-5 transition-colors ${isGenerating
                                    ? 'text-gray-400 animate-pulse'
                                    : 'text-[#1F00EC]'
                                }`}
                        />
                    </button>
                )}
            </div>
        </div>
    );
}
