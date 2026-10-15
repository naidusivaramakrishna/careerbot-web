"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Card = ({ title, children, className = "", action }: any) => (
  <section
    className={`bg-white rounded-2xl border-2 border-[#D0D5DD] shadow-sm p-5 md:p-6 ${className}`}
  >
    <div className="-mx-5 md:-mx-6 mb-4">
      <div className="px-5 md:px-6 pb-3 border-b border-[#D0D5DD] flex justify-between items-center">
        <h3 className="text-h3 text-[#101828]">{title}</h3>
        {action}
      </div>
    </div>
    {children}
  </section>
);

export default Card;
