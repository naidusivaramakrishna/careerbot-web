import { COMPANY_CONFIG } from '@/config';

const sections = [
  {
    title: '1. Information We Collect',
    body:
      'We collect account information, resume and career materials you choose to upload or create, usage data, and payment-related subscription status needed to operate CareerBot.',
  },
  {
    title: '2. How We Use Information',
    body:
      'We use your information to provide resume, cover letter, ATS, job matching, mock interview, and mock test features, improve product quality, prevent abuse, and support your account.',
  },
  {
    title: '3. Career Documents',
    body:
      'Your resumes, cover letters, job descriptions, and profile data are used to generate and personalize the services you request. Do not upload information you are not authorized to use.',
  },
  {
    title: '4. Sharing And Service Providers',
    body:
      'We may share limited data with service providers that help us host, secure, analyze, support, or process payments for the service. We do not sell your personal career documents.',
  },
  {
    title: '5. Security',
    body:
      'We use reasonable technical and organizational safeguards to protect your information. No online service can guarantee absolute security, so keep your account credentials private.',
  },
  {
    title: '6. Data Choices',
    body:
      'You may update account information, delete drafts or saved documents where product controls allow, and contact support for privacy or account questions.',
  },
  {
    title: '7. Updates',
    body:
      'We may update this policy as CareerBot changes. Continued use of the service after updates means the revised policy applies.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-4 text-lg text-gray-600">Last updated: July 2, 2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="mb-10 text-gray-700">
          This Privacy Policy explains how {COMPANY_CONFIG.name} collects, uses, and protects information when you use our career tools.
        </p>

        {sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">{section.title}</h2>
            <p className="leading-7 text-gray-700">{section.body}</p>
          </section>
        ))}

        <section className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Contact Us</h2>
          <p className="text-gray-700">
            For privacy questions, contact{' '}
            <a href={`mailto:${COMPANY_CONFIG.supportEmail}`} className="font-semibold text-blue-600 hover:underline">
              {COMPANY_CONFIG.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
