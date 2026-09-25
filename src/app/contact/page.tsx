import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - MissingCrew',
  description: 'Get in touch with the MissingCrew team for support, partnerships, or general inquiries.'
}

import ContactForm from '@/components/contact/ContactForm'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
            <p className="text-gray-700 mb-6">
              We&apos;d love to hear from you! Whether you have questions about our platform,
              need support with your account, or want to explore partnership opportunities,
              our team is here to help.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">General Inquiries</h3>
                  <p className="text-gray-600">info@missingcrew.com</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Support</h3>
                  <p className="text-gray-600">support@missingcrew.com</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Partnerships</h3>
                  <p className="text-gray-600">partnerships@missingcrew.com</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Press & Media</h3>
                  <p className="text-gray-600">press@missingcrew.com</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Careers</h3>
                  <p className="text-gray-600">careers@missingcrew.com</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Address</h3>
                  <p className="text-gray-600">
                    MissingCrew Inc.<br />
                    123 Film Street<br />
                    Los Angeles, CA 90001<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Form</h2>
            {/* Client-side form with validation and submission */}
            <ContactForm />

          </div>
        </div>
      </div>
    </div>
  )
}
