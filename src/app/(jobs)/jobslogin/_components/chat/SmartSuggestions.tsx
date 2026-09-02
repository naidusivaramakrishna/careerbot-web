"use client";

interface SmartSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export default function SmartSuggestions({ onSuggestionClick }: SmartSuggestionsProps) {
  const suggestions = [
    { icon: '💬', text: 'Generate mock interview questions' },
    { icon: '📄', text: 'Improve resume for this role' },
    { icon: '🎯', text: 'Suggest portfolio projects' },
    { icon: '📚', text: 'Recommend learning resources' },
  ];

  return (
    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl animate-in fade-in duration-300">
      <p className="text-xs font-bold text-gray-800 mb-3">Would you like me to:</p>

      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="w-full flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 ease-out group"
          >
            <span className="text-lg">{suggestion.icon}</span>
            <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 text-left">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
