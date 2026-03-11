"use client";

interface ReadinessArea {
  name: string;
  status: 'strong' | 'moderate' | 'needs-improvement';
  icon: string;
}

export default function InterviewReadiness() {
  const readinessAreas: ReadinessArea[] = [
    { name: 'Technical Skills', status: 'strong', icon: '🟢' },
    { name: 'Projects & Portfolio', status: 'moderate', icon: '🟡' },
    { name: 'System Design', status: 'needs-improvement', icon: '🔴' },
    { name: 'Communication', status: 'strong', icon: '🟢' },
    { name: 'Problem Solving', status: 'moderate', icon: '🟡' },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'strong': return 'Strong';
      case 'moderate': return 'Moderate';
      case 'needs-improvement': return 'Needs Improvement';
      default: return 'Unknown';
    }
  };

  return (
    <div className="mt-4 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 animate-in fade-in duration-300">
      <p className="text-xs font-bold text-gray-800 mb-3">🎯 Interview Readiness</p>

      <div className="space-y-2">
        {readinessAreas.map((area) => (
          <div key={area.name} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">{area.icon}</span>
              <span className="text-xs font-medium text-gray-700">{area.name}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              area.status === 'strong' ? 'text-green-700' :
              area.status === 'moderate' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {getStatusLabel(area.status)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-3 pt-2 border-t border-emerald-200/30">
        💪 Focus on System Design before your interviews.
      </p>
    </div>
  );
}
