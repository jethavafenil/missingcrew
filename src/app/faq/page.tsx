import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - MissingCrew',
  description: 'Frequently Asked Questions about MissingCrew and how to use our platform.'
}

export default function FAQPage() {
  const faqs = [
    {
      question: "What is MissingCrew?",
      answer: "MissingCrew is a professional network that connects filmmakers with verified, experienced crew members worldwide. We help production teams find the right talent for their projects and help crew members find exciting opportunities."
    },
    {
      question: "How do I sign up as a crew member?",
      answer: "To sign up as a crew member, click on the 'Join as Crew' button on our homepage and follow the registration process. You'll need to provide information about your skills, experience, and portfolio."
    },
    {
      question: "How do I post a job as an employer?",
      answer: "To post a job, sign up as an employer and navigate to the 'Post Requirement' section. Fill out the details about your project, including the roles you need, project timeline, and location."
    },
    {
      question: "Is there a cost to use MissingCrew?",
      answer: "MissingCrew offers both free and premium membership options. Basic features are free, but we also offer premium subscription plans with additional benefits for both crew members and employers."
    },
    {
      question: "How does MissingCrew verify crew members?",
      answer: "We use a multi-step verification process that includes identity verification, portfolio review, and reference checks. This helps ensure that all crew members on our platform are qualified professionals."
    },
    {
      question: "Can I find international crew members?",
      answer: "Yes, MissingCrew connects filmmakers with crew members from around the world. You can filter by location and availability to travel when searching for crew."
    },
    {
      question: "How do I contact a crew member?",
      answer: "Once you find a crew member you're interested in, you can use our platform's messaging system to contact them directly. For premium members, we also provide additional contact information."
    },
    {
      question: "What types of projects are listed on MissingCrew?",
      answer: "MissingCrew features a wide range of projects including feature films, TV shows, commercials, music videos, documentaries, and more. You can filter projects by type, location, and required roles."
    },
    {
      question: "How do I update my profile?",
      answer: "You can update your profile by logging in and navigating to your dashboard. From there, you can edit your personal information, skills, portfolio, and availability."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take privacy and security very seriously. Your personal information is protected and only shared according to our privacy policy. You have control over what information is visible to others on the platform."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <p className="text-gray-700 mb-6 text-center">
              Find answers to common questions about MissingCrew and how to use our platform.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{faq.question}</h2>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mt-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Still have questions?</h2>
            <p className="text-gray-700 mb-6">
              If you can&apos;t find the answer to your question, please don&apos;t hesitate to
              <a href="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium"> contact our support team</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
