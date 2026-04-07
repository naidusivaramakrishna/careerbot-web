"use client";

/**
 * Onboarding Wizard — 2-step experience
 *
 * Step 1: Personal Info + optional Resume Upload
 * Step 2: Welcome Summary + Go to Dashboard
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ProgressIndicator }    from './_components/ProgressIndicator';
import { Step1PersonalInfo }    from './_components/Step1PersonalInfo';
import { Step3WelcomeSummary }  from './_components/Step3WelcomeSummary';
import { PersonalInfoData }     from '@/types/onboarding.types';
import logger                   from '@/lib/logger';

const OnboardingContent: React.FC = () => {
  const searchParams = useSearchParams();

  const urlStep    = searchParams?.get('step');
  const initialStep = urlStep ? parseInt(urlStep) : 1;

  const [currentStep,    setCurrentStep]    = useState(initialStep);
  const [personalInfo,   setPersonalInfo]   = useState<PersonalInfoData | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  useEffect(() => {
    logger.info('Onboarding loaded, step:', currentStep);
  }, [currentStep]);

  const handleStep1Continue = async (data: PersonalInfoData, resumeFile?: File) => {
    logger.info('Step 1 complete. Resume:', resumeFile?.name);
    setPersonalInfo(data);
    setIsSubmitting(true);

    try {
      // TODO: POST personal info to backend
      // await saveOnboardingProgress({ step: 1, data });
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (resumeFile) {
        // TODO: upload & parse resume
        // await parseResume(resumeFile);
        await new Promise((resolve) => setTimeout(resolve, 700));
        setResumeUploaded(true);
        toast.success('Profile saved & resume parsed!');
      } else {
        toast.success('Profile saved successfully!');
      }

      setCurrentStep(2);
    } catch (error) {
      logger.error('Error saving step 1:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileCompleteness = resumeUploaded ? 65 : 35;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">

      {/* ── Ambient background ── */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #fafbff 45%, #f5f0ff 100%)' }}
      />
      <div
        className="absolute -z-10 pointer-events-none"
        style={{
          top: '-180px', right: '-120px',
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,87,167,0.08) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute -z-10 pointer-events-none"
        style={{
          bottom: '-160px', left: '-100px',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(88,150,215,0.07) 0%, transparent 65%)',
        }}
      />

      {/* ── Fixed top progress rail ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.75" style={{ background: '#e8eef7' }}>
        <div
          className="h-full transition-all duration-700 ease-in-out"
          style={{
            width: currentStep === 1 ? '50%' : '100%',
            background: 'linear-gradient(90deg, #1a3a6b 0%, #2557a7 50%, #5896d7 100%)',
          }}
        />
      </div>

      {/* ── Sticky nav ── */}
      <nav
        className="w-full sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(37,87,167,0.08)',
          boxShadow: '0 1px 0 rgba(37,87,167,0.04)',
        }}
      >
        <div className="max-w-215 mx-auto px-8 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={38}
              height={38}
              className="shrink-0 object-contain"
            />
            <span className="text-[15px] font-bold text-gray-900 tracking-tight -ml-0.5">
              CareerBOT
            </span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 font-medium mr-1 hidden sm:block">
              {currentStep === 1 ? 'Setting up your profile' : 'Almost done!'}
            </span>
            {[1, 2].map((n) => (
              <div
                key={n}
                className="rounded-full transition-all duration-500"
                style={{
                  height: '6px',
                  width: n === currentStep ? '24px' : '6px',
                  background: n < currentStep
                    ? '#5896d7'
                    : n === currentStep
                    ? '#2557a7'
                    : '#e2e8f0',
                }}
              />
            ))}
          </div>

        </div>
      </nav>

      {/* ── Page content ── */}
      <div
        className="mx-auto w-full px-4 pt-3 pb-3 flex-1 min-h-0 flex flex-col max-w-215"
      >

        {/* ── Content card ── */}
        <div
          className="rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow:
              '0 0 0 1px rgba(37,87,167,0.07), 0 4px 8px rgba(37,87,167,0.04), 0 24px 64px rgba(37,87,167,0.10)',
          }}
        >
          {/* Step header inside card */}
          <div
            className="px-8 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(37,87,167,0.06)' }}
          >
            <ProgressIndicator currentStep={currentStep} totalSteps={2} />
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="p-6 md:p-7 flex-1 min-h-0 overflow-auto">
              <Step1PersonalInfo
                initialData={personalInfo || undefined}
                onContinue={handleStep1Continue}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          {/* Step 2 — completion */}
          {currentStep === 2 && (
            <div className="p-6 md:p-7 flex-1 min-h-0 overflow-auto">
              <Step3WelcomeSummary
                userName={personalInfo?.full_name.split(' ')[0] || 'there'}
                creditsAllocated={50}
                profileCompleteness={profileCompleteness}
                resumeUploaded={resumeUploaded}
              />
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <p className="text-center mt-2 text-xs text-gray-400 shrink-0">
          Already have an account?{' '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/?showLogin=true"
            className="font-semibold hover:underline"
            style={{ color: '#2557a7' }}
          >
            Sign In
          </a>
        </p>

      </div>
    </div>
  );
};

const OnboardingPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
};

export default OnboardingPage;
