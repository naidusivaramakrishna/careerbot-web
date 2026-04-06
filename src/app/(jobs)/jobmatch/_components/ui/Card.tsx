"use client";

const Card = ({ title, children, className = "", action }: any) => (
  <section
    className={`bg-white rounded-2xl border-2 border-[#c7c7c7] shadow-sm p-5 md:p-6 ${className}`}
  >
    <div className="-mx-5 md:-mx-6 mb-4">
      <div className="px-5 md:px-6 pb-3 border-b border-[#d1d1d1] flex justify-between items-center">
        <h3 className="text-[15px] font-semibold text-[#1F2328]">{title}</h3>
        {action}
      </div>
    </div>
    {children}
  </section>
);

export default Card;
