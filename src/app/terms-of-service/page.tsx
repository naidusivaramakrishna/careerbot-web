'use client';

import React from 'react';
import { COMPANY_CONFIG } from '@/config';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">Last updated: May 12, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using {COMPANY_CONFIG.name}, you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on {COMPANY_CONFIG.name}
            for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title,
            and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to reverse engineer any software contained on {COMPANY_CONFIG.name}</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or mirroring the materials on any other server</li>
            <li>Bypassing any authentication or security measures</li>
            <li>Scraping or automating access to the service</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The materials on {COMPANY_CONFIG.name} are provided on an 'as is' basis. {COMPANY_CONFIG.name} makes no warranties, expressed or implied,
            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions
            of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
          <p className="text-gray-700 mb-4">
            In no event shall {COMPANY_CONFIG.name} or its suppliers be liable for any damages (including, without limitation, damages for loss of data
            or profit, or due to business interruption) arising out of the use or inability to use the materials on {COMPANY_CONFIG.name}, even if
            {COMPANY_CONFIG.name} or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
          <p className="text-gray-700 mb-4">
            The materials appearing on {COMPANY_CONFIG.name} could include technical, typographical, or photographic errors.
            {COMPANY_CONFIG.name} does not warrant that any of the materials on {COMPANY_CONFIG.name} are accurate, complete, or current.
            {COMPANY_CONFIG.name} may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Links</h2>
          <p className="text-gray-700 mb-4">
            {COMPANY_CONFIG.name} has not reviewed all of the sites linked to its website and is not responsible for the contents of any such
            linked site. The inclusion of any link does not imply endorsement by {COMPANY_CONFIG.name} of the site. Use of any such linked website
            is at the user's own risk.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications</h2>
          <p className="text-gray-700 mb-4">
            {COMPANY_CONFIG.name} may revise these terms of service for its website at any time without notice. By using this website,
            you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. User Accounts</h2>
          <p className="text-gray-700 mb-4">
            If you create an account on {COMPANY_CONFIG.name}, you are responsible for maintaining the confidentiality of your account information
            and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur
            under your account or password. You agree to notify {COMPANY_CONFIG.name} immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            All content on {COMPANY_CONFIG.name}, including text, graphics, logos, images, and software, is the property of {COMPANY_CONFIG.name} or its
            content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or transmit the
            content without our prior written permission.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Payment & Billing</h2>
          <p className="text-gray-700 mb-4">
            By purchasing a subscription to {COMPANY_CONFIG.name}, you authorize us to charge your payment method for the subscription fee
            and any other charges described on our website. Subscription fees are billed in advance on a recurring basis
            (monthly or yearly, depending on your selection). Your subscription will continue until canceled.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Cancellation</h2>
          <p className="text-gray-700 mb-4">
            You may cancel your subscription at any time. Cancellation requests take effect at the end of your current billing period.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These terms and conditions are governed by and construed in accordance with the laws of {COMPANY_CONFIG.country},
            and you irrevocably submit to the exclusive jurisdiction of the courts located in {COMPANY_CONFIG.country}.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Severability</h2>
          <p className="text-gray-700 mb-4">
            If any provision of these Terms of Service is found to be invalid by a court of competent jurisdiction,
            the invalidity of such provision shall not affect the validity of the remaining provisions,
            which shall remain in full force and effect.
          </p>
        </section>

        <section className="mb-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="space-y-2 text-gray-700">
            <p>
              📧 Email:{' '}
              <a href={`mailto:${COMPANY_CONFIG.supportEmail}`} className="text-blue-600 hover:underline font-semibold">
                {COMPANY_CONFIG.supportEmail}
              </a>
            </p>
            <p>
              🕐 Response time: Within 24-48 hours
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}