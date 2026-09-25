import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - MissingCrew',
  description: 'Learn more about MissingCrew and our mission to connect filmmakers with top-tier crew members worldwide.'
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">About MissingCrew</h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Our Mission</h2>
            <p className="text-gray-700 mb-6">
              MissingCrew is a professional network designed to connect filmmakers with verified,
              experienced crew members worldwide. Our mission is to streamline the process of finding
              the perfect team for any production, from indie films to major studio projects.
            </p>
            <p className="text-gray-700 mb-6">
              We believe that every great film starts with the right crew. Whether you&#39;re a director
              looking for a cinematographer, a producer searching for a production designer, or a crew
              member seeking your next opportunity, MissingCrew provides the platform to make those
              connections happen.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Our Story</h2>
            <p className="text-gray-700 mb-6">
              Founded in 2023, MissingCrew was created by film industry professionals who understood
              the challenges of finding reliable, skilled crew members. We&#39;ve built a platform that
              verifies credentials, showcases portfolios, and matches talent with opportunities
              based on skills, experience, and project requirements.
            </p>
            <p className="text-gray-700 mb-6">
              Today, we&#39;re proud to serve thousands of filmmakers and crew members across the globe,
              helping to bring creative visions to life.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Our Values</h2>
            <ul className="list-disc pl-6 space-y-4 text-gray-700">
              <li>
                <strong>Professionalism:</strong> We maintain high standards for all members of our community.
              </li>
              <li>
                <strong>Transparency:</strong> We provide clear information about skills, experience, and credentials.
              </li>
              <li>
                <strong>Diversity:</strong> We celebrate and promote diversity in the film industry.
              </li>
              <li>
                <strong>Innovation:</strong> We continuously improve our platform to better serve our users.
              </li>
              <li>
                <strong>Community:</strong> We foster connections and collaborations within the film industry.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
