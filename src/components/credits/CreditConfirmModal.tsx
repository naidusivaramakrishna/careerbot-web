/**
 * Credit Confirm Modal
 *
 * Adaptive confirmation modal shown before credit-consuming actions
 *
 * Show logic:
 * - First time using ANY credit feature: ALWAYS show
 * - Action < 5 credits: Skip modal (inline confirmation only)
 * - Action 5-9 credits: Show modal (unless user opted out)
 * - Action >= 10 credits: ALWAYS show
 * - Balance < 2x action cost: ALWAYS show with warning
 *
 * Features:
 * - "Don't ask for small actions" checkbox (< 10 credits)
 * - Warning when balance is low
 * - Credit balance display
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Sparkles, Info } from 'lucide-react';

export interface CreditConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionName: string;
  actionDescription: string;
  creditCost: number;
  currentBalance: number;
  isFirstUse?: boolean;
  onDontAskAgain?: (value: boolean) => void;
}

export const CreditConfirmModal: React.FC<CreditConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionName,
  actionDescription,
  creditCost,
  currentBalance,
  isFirstUse = false,
  onDontAskAgain,
}) => {
  const [dontAskForSmall, setDontAskForSmall] = useState(false);

  if (!isOpen) return null;

  const remainingAfter = currentBalance - creditCost;
  const isLowBalance = remainingAfter < creditCost * 2;
  const isSmallAction = creditCost < 10;
  const canOptOut = isSmallAction && !isFirstUse;

  const handleConfirm = () => {
    if (dontAskForSmall && onDontAskAgain) {
      onDontAskAgain(true);
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLowBalance ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              {isLowBalance ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : (
                <Sparkles className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Action
              </h2>
              <p className="text-sm text-gray-600">
                This will use credits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Details */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              {actionName}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {actionDescription}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600">Cost:</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  {creditCost} {creditCost === 1 ? 'credit' : 'credits'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Info */}
          <div className={`rounded-lg p-4 ${
            isLowBalance ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              {isLowBalance ? (
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isLowBalance ? 'text-orange-900' : 'text-blue-900'
                  }`}>
                    Current Balance:
                  </span>
                  <span className={`font-semibold ${
                    isLowBalance ? 'text-orange-900' : 'text-blue-900'
                  }`}>
                    {currentBalance}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isLowBalance ? 'text-orange-900' : 'text-blue-900'
                  }`}>
                    After Action:
                  </span>
                  <span className={`font-semibold ${
                    isLowBalance ? 'text-orange-900' : 'text-blue-900'
                  }`}>
                    {remainingAfter}
                  </span>
                </div>
                {isLowBalance && (
                  <p className="text-xs text-orange-700 mt-2">
                    ⚠️ Your balance is running low. Consider{' '}
                    <a href="/pricing" className="underline font-medium">
                      upgrading your plan
                    </a>{' '}
                    to get more credits.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* First-Use Message */}
        {isFirstUse && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>First time using this feature!</strong> We&apos;ll confirm credit-consuming actions to help you manage your balance.
            </p>
          </div>
        )}

        {/* Don't Ask Again Option */}
        {canOptOut && (
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontAskForSmall}
                onChange={(e) => setDontAskForSmall(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                Don&apos;t ask again for small actions (&lt; 10 credits)
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-all ${
              isLowBalance
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gradient-to-r from-[#2200FF] to-[#1800B3] hover:shadow-lg'
            }`}
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
