export default function JobMatchLoading() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar placeholder */}
      <div className="w-20 shrink-0 bg-white border-r border-gray-100" />

      <main className="flex-1 pt-27 pl-6 pr-8 pb-8">
        <style>{`
          @keyframes shimmer {
            0%, 100% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .animate-shimmer-bg {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}</style>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="h-9 w-72 animate-shimmer-bg rounded-lg" />
            <div className="h-4 w-96 animate-shimmer-bg rounded" />
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 pb-6 border-b border-gray-200">
            <div className="h-10 w-28 animate-shimmer-bg rounded-lg" />
            <div className="h-10 w-28 animate-shimmer-bg rounded-lg" />
            <div className="h-10 w-28 animate-shimmer-bg rounded-lg" />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upload/Preview Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="h-5 w-32 animate-shimmer-bg rounded mb-4" />
                <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 animate-shimmer-bg rounded-lg mx-auto" />
                    <div className="h-4 w-40 animate-shimmer-bg rounded mx-auto" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="h-5 w-32 animate-shimmer-bg rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-10 animate-shimmer-bg rounded-lg" />
                  <div className="h-24 animate-shimmer-bg rounded-lg" />
                </div>
              </div>
            </div>

            {/* Right: Score Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
              <div className="h-5 w-20 animate-shimmer-bg rounded mb-6" />
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 animate-shimmer-bg rounded-full" />
                <div className="h-4 w-32 animate-shimmer-bg rounded" />
                <div className="space-y-2 w-full">
                  <div className="h-3 animate-shimmer-bg rounded w-full" />
                  <div className="h-3 animate-shimmer-bg rounded w-5/6" />
                  <div className="h-3 animate-shimmer-bg rounded w-4/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="h-5 w-32 animate-shimmer-bg rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-8 animate-shimmer-bg rounded-lg" />
                  <div className="h-8 animate-shimmer-bg rounded-lg w-5/6" />
                  <div className="h-8 animate-shimmer-bg rounded-lg w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
