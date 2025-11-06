const ResumeProgressBar = ({ count, total = 5 }: { count: number; total?: number }) => (
    <div className="bg-white rounded-xl p-3 mb-6">
        <div className='flex items-center justify-between'>
            <p className="text-sm text-gray-700">
                You have <span className="font-semibold text-red-600">{count}</span>{" "}
                resumes saved out of{" "}
                <span className="font-semibold text-black">{total}</span> available slots
            </p>
            <span className='font-semibold text-[#2200ff]'>{count}/{total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
                className="bg-[#3e3197] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(count / total) * 100}%` }}
            ></div>
        </div>
    </div>
);

export default ResumeProgressBar