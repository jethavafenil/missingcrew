import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Privacy - MissingCrew',
  description: 'Terms of Service and Privacy Policy for MissingCrew.'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Terms & Privacy</h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Terms of Service</h2>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">1. Acceptance of Terms</h3>
                <p className="text-gray-700">
                  By accessing or using MissingCrew, you agree to be bound by these Terms of Service.
                  If you disagree with any part of the terms, you may not use our services.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">2. User Accounts</h3>
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account and password
                  and for restricting access to your computer. You agree to accept responsibility for all
                  activities that occur under your account.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">3. Prohibited Activities</h3>
                <p className="text-gray-700">
                  You agree not to engage in any of the following prohibited activities:
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700">
                  <li>Using the service for any illegal purpose</li>
                  <li>Harassing or defaming other users</li>
                  <li>Posting false or misleading information</li>
                  <li>Attempting to gain unauthorized access to other accounts</li>
                  <li>Interfering with the proper working of the service</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">4. Intellectual Property</h3>
                <p className="text-gray-700">
                  All content included on the MissingCrew platform, such as text, graphics, logos,
                  button icons, images, audio clips, and software, is the property of MissingCrew
                  or its content suppliers and protected by international copyright laws.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">5. Termination</h3>
                <p className="text-gray-700">
                  MissingCrew may terminate or suspend your account and bar access to the service
                  immediately, without prior notice or liability, under our sole discretion, for any
                  reason whatsoever and without limitation, including but not limited to a breach of
                  the Terms.
                </p>
              </section>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Privacy Policy</h2>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">1. Information We Collect</h3>
                <p className="text-gray-700">
                  We collect information you provide directly to us, such as when you create or
                  modify your account, create or modify a project, contact customer support, or
                  communicate with other users.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">2. How We Use Your Information</h3>
                <p className="text-gray-700">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Respond to your inquiries and fulfill your requests</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Personalize the service and provide tailored content</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">3. Information Sharing and Disclosure</h3>
                <p className="text-gray-700">
                  We may share your information as follows:
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700">
                  <li>With other users when you choose to share your profile or project information</li>
                  <li>With service providers who help us provide our services</li>
                  <li>To comply with legal obligations or protect our rights</li>
                  <li>With your consent or at your direction</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">4. Security</h3>
                <p className="text-gray-700">
                  We take reasonable measures to help protect your personal information from loss,
                  theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">5. Your Choices</h3>
                <p className="text-gray-700">
                  You may update or correct your account information at any time by logging into your
                  account. You may also control the communications you receive from us.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">6. Changes to This Policy</h3>
                <p className="text-gray-700">
                  We may change this privacy policy from time to time. If we make changes, we will
                  notify you by revising the date at the top of the policy and, in some cases,
                  we may provide you with additional notice.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Last updated: October 10, 2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}
