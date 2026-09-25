'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'

interface NetworkConnection {
  id: string
  connectedAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    crewProfile?: {
      id?: string
      photo: string | null
      city: string | null
      primaryRoles: string[]
      yearsExperience: string | null
      location: string | null
      contactWhatsApp: string | null
      portfolioLinks: string[]
      imdbLink: string | null
    }
    employerProfile?: {
      id?: string
      companyName: string | null
      companyWebsite: string | null
    }
  }
}

interface NetworkListProps {
  connections: NetworkConnection[]
}

export function NetworkList({ connections }: NetworkListProps) {
  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No connections yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Start building your network by connecting with other crew members.
        </p>
        <Link
          href="/browse-crew"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          Browse Crew
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => {
        // Determine the correct profile link
        const profileId = connection.user.crewProfile?.id || connection.user.employerProfile?.id || connection.user.id
        const profileLink = `/crew/${slugifyName(connection.user.name)}`
        
        return (
        <Card key={connection.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Link href={profileLink}>
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={connection.user.crewProfile?.photo || ''}
                    alt={connection.user.name}
                  />
                  <AvatarFallback>
                    {connection.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={profileLink}
                      className="hover:underline"
                    >
                      <h4 className="font-semibold text-lg">
                        {connection.user.name}
                      </h4>
                    </Link>

                    {connection.user.crewProfile?.primaryRoles &&
                      connection.user.crewProfile.primaryRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {connection.user.crewProfile.primaryRoles
                            .slice(0, 3)
                            .map((role, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                        </div>
                      )}

                    <div className="mt-2 space-y-1">
                      {connection.user.crewProfile?.city && (
                        <p className="text-sm text-gray-500">
                          📍 {connection.user.crewProfile.city}
                        </p>
                      )}

                      {connection.user.crewProfile?.yearsExperience && (
                        <p className="text-sm text-gray-500">
                          💼 {connection.user.crewProfile.yearsExperience}
                        </p>
                      )}

                      {connection.user.employerProfile?.companyName && (
                        <p className="text-sm text-gray-500">
                          🏢 {connection.user.employerProfile.companyName}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link href={profileLink}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-4 w-4" />
                      View Profile
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${connection.user.email}`}
                    className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </a>

                  {connection.user.crewProfile?.contactWhatsApp && (
                    <a
                      href={`https://wa.me/${connection.user.crewProfile.contactWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      WhatsApp
                    </a>
                  )}

                  {connection.user.phone && (
                    <a
                      href={`tel:${connection.user.phone}`}
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </a>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Connected since{' '}
                  {new Date(connection.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
