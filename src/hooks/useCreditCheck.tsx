/**
 * useCreditCheck Hook
 *
 * Manages credit confirmation flow for credit-consuming actions
 *
 * Features:
 * - Checks if user has sufficient credits
 * - Determines if confirmation modal should show (adaptive logic)
 * - Tracks first-time usage of features
 * - Handles "don't ask again" preference
 * - Opens insufficient credits modal on failure
 *
 * Usage:
 * const { checkCredits, CreditModals } = useCreditCheck(currentBalance);
 *
 * const handleAction = async () => {
 *   const canProceed = await checkCredits('ats_scan', 'ATS Scan', 'Analyze resume compatibility');
 *   if (canProceed) {
 *     // Perform action
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleAction}>Scan Resume</button>
 *     <CreditModals />
 *   </>
 * );
 */

import { useState, useCallback } from 'react';
import { shouldShowCreditModal, markFeatureAsUsed, isFirstTimeUsingFeature } from '@/types/quota.types';
import { checkCredits } from '@/api/creditsApi';
import { CreditConfirmModal } from '@/components/credits/CreditConfirmModal';
import { InsufficientCreditsModal } from '@/components/credits/InsufficientCreditsModal';
import logger from '@/lib/logger';

export interface CreditCheckResult {
  canProceed: boolean;
  modalShown: boolean;
}

export const useCreditCheck = (currentBalance: number) => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    featureId: string;
    actionName: string;
    actionDescription: string;
    creditCost: number;
    onConfirm: () => void;
  } | null>(null);

  const [insufficientModal, setInsufficientModal] = useState<{
    isOpen: boolean;
    actionName: string;
    requiredCredits: number;
  } | null>(null);

  /**
   * Check if user can proceed with credit-consuming action
   * Shows appropriate modal if needed
   *
   * @param featureId - Feature identifier (e.g., 'ats_scan')
   * @param actionName - Display name (e.g., 'ATS Scan')
   * @param actionDescription - Brief description for modal
   * @returns Promise<boolean> - True if user can proceed
   */
  const checkCreditsAction = useCallback(
    (
      featureId: string,
      actionName: string,
      actionDescription: string
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        checkCredits(featureId)
          .then((result) => {
            logger.info('Credit check result:', {
              featureId,
              can_proceed: result.can_proceed,
              credit_cost: result.credit_cost,
              credits_remaining: result.credits_remaining,
            });

            // Check if sufficient balance
            if (!result.can_proceed) {
              logger.warn('Insufficient credits:', {
                required: result.credit_cost,
                remaining: result.credits_remaining,
              });

              setInsufficientModal({
                isOpen: true,
                actionName,
                requiredCredits: result.credit_cost,
              });
              resolve(false);
              return;
            }

            // Check if modal should be shown
            const shouldShow = shouldShowCreditModal(result.credit_cost, isFirstTimeUsingFeature(featureId), Number(result.credits_remaining));

            if (!shouldShow) {
              logger.info('Skipping credit modal (user preference or low cost)');
              resolve(true);
              return;
            }

            // Show confirmation modal
            logger.info('Showing credit confirmation modal');
            setConfirmModal({
              isOpen: true,
              featureId,
              actionName,
              actionDescription,
              creditCost: result.credit_cost,
              onConfirm: () => {
                markFeatureAsUsed(featureId);
                setConfirmModal(null);
                resolve(true);
              },
            });
          })
          .catch((error) => {
            logger.error('Credit check failed:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to check credits';
            setInsufficientModal({
              isOpen: true,
              actionName,
              requiredCredits: 0,
            });
            resolve(false);
          });
      });
    },
    []
  );

  /**
   * Handle "don't ask again" preference
   */
  const handleDontAskAgain = useCallback((value: boolean) => {
    if (value) {
      localStorage.setItem('careerbot_skip_small_credit_modals', 'true');
      logger.info('User opted out of small credit confirmations');
    }
  }, []);

  /**
   * Close confirmation modal (user cancelled)
   */
  const closeConfirmModal = useCallback(() => {
    if (confirmModal) {
      logger.info('User cancelled credit action');
      setConfirmModal(null);
    }
  }, [confirmModal]);

  /**
   * Close insufficient credits modal
   */
  const closeInsufficientModal = useCallback(() => {
    setInsufficientModal(null);
  }, []);

  /**
   * Render both modals
   */
  const CreditModals = useCallback(() => {
    return (
      <>
        {confirmModal && (
          <CreditConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={closeConfirmModal}
            onConfirm={confirmModal.onConfirm}
            actionName={confirmModal.actionName}
            actionDescription={confirmModal.actionDescription}
            creditCost={confirmModal.creditCost}
            currentBalance={currentBalance}
            isFirstUse={isFirstTimeUsingFeature(confirmModal.featureId)}
            onDontAskAgain={handleDontAskAgain}
          />
        )}
        {insufficientModal && (
          <InsufficientCreditsModal
            isOpen={insufficientModal.isOpen}
            onClose={closeInsufficientModal}
            actionName={insufficientModal.actionName}
            requiredCredits={insufficientModal.requiredCredits}
            currentBalance={currentBalance}
          />
        )}
      </>
    );
  }, [
    confirmModal,
    insufficientModal,
    currentBalance,
    closeConfirmModal,
    closeInsufficientModal,
    handleDontAskAgain,
  ]);

  return {
    checkCredits: checkCreditsAction,
    CreditModals,
  };
};

/**
 * Usage Example:
 *
 * const MyComponent = () => {
 *   const { checkCredits, CreditModals } = useCreditCheck(45);
 *
 *   const handleATSScan = async () => {
 *     const canProceed = await checkCredits(
 *       'ats_scan',
 *       'ATS Scan',
 *       'Analyze your resume for ATS compatibility'
 *     );
 *
 *     if (canProceed) {
 *       // Call API to perform ATS scan
 *       const result = await performATSScan();
 *       // Handle result
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleATSScan}>
 *         Scan My Resume (5 credits)
 *       </button>
 *       <CreditModals />
 *     </>
 *   );
 * };
 */
