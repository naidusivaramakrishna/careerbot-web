"use client";
import React, { memo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { PlanItem } from '../types';

interface PlanCardProps {
    plan: PlanItem;
    onEdit: (plan: PlanItem) => void;
}

const PlanCard = memo<PlanCardProps>(({ plan, onEdit }) => {
    const handleEditClick = useCallback(() => {
        onEdit(plan);
    }, [plan, onEdit]);

    return (
        <div
            className={`relative bg-white border rounded-xl p-4 transition-shadow hover:shadow-md ${plan.is_popular
                ? 'border-2 border-[#5E5EFF] shadow-md'
                : 'border-gray-200'
                }`}
        >
            {plan.is_popular && (
                <div className="absolute top-0 right-0 bg-[#5E5EFF] text-white text-xs font-semibold px-3 py-1 rounded-bl-md rounded-tr-md shadow-md">
                    Most Popular
                </div>
            )}

            {!plan.is_active && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-br-md rounded-tl-md shadow-md">
                    Inactive
                </div>
            )}

            <div className="border-b border-gray-400 my-4 pb-2 mt-8">
                <h1 className="text-xl font-semibold">{plan.name}</h1>
                <p className="text-[#717182]">
                    <span className="text-2xl text-black">₹{plan.price.toLocaleString()}</span> /month
                </p>
            </div>

            <div className="my-8 min-h-40">
                {plan.features.map((feature, index) => (
                    <div key={index} className="text-sm flex gap-1 leading-8 items-center">
                        <Check className="w-4 h-4 text-[#00A63E] flex-shrink-0" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleEditClick}
                className="w-full text-sm px-4 py-2 rounded-lg border border-black/40 my-8 font-semibold hover:bg-gray-50 transition"
            >
                Edit Plan
            </button>

            <div className="border-t border-gray-400 py-4 mt-4 text-sm flex justify-between items-center">
                <p className="text-[#717182]">Active Users</p>
                <div className="border border-[#717182] px-2 py-1 rounded-md font-semibold">
                    {plan.active_users.toLocaleString()}
                </div>
            </div>
        </div>
    );
});

PlanCard.displayName = 'PlanCard';

export default PlanCard;
