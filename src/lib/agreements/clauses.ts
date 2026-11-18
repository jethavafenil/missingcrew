// The wording of the Crew Engagement & Hiring Agreement, supplied by the client
// (missing-crew-agreement.html). {{key}} marks a value filled in when the agreement is created
// (see FIELD-MAPPING.md from the client). Keep the wording here; bump AGREEMENT_VERSION in template.ts when it changes.
export type AgreementBlock =
  | { k: 'h3'; x: string }
  | { k: 'p'; x: string }
  | { k: 'clause'; n: string; x: string }
  | { k: 'ul'; items: string[] }
  | { k: 'kv'; items: { label: string; field: string }[] }

export interface AgreementSection {
  title: string
  blocks: AgreementBlock[]
}

export const AGREEMENT_SECTIONS: AgreementSection[] = [
 {
  "title": "1. Parties to the Agreement",
  "blocks": [
   {
    "k": "h3",
    "x": "Employer / Production Representative"
   },
   {
    "k": "kv",
    "items": [
     {
      "label": "Full Name:",
      "field": "employer.name"
     },
     {
      "label": "Company / Production House:",
      "field": "employer.company"
     },
     {
      "label": "Email:",
      "field": "employer.email"
     },
     {
      "label": "Phone:",
      "field": "employer.phone"
     },
     {
      "label": "Address:",
      "field": "employer.address"
     },
     {
      "label": "MC Username:",
      "field": "employer.username"
     }
    ]
   },
   {
    "k": "h3",
    "x": "Crew Member"
   },
   {
    "k": "kv",
    "items": [
     {
      "label": "Full Name:",
      "field": "crew.name"
     },
     {
      "label": "Primary Role:",
      "field": "crew.primaryRole"
     },
     {
      "label": "Email:",
      "field": "crew.email"
     },
     {
      "label": "Phone:",
      "field": "crew.phone"
     },
     {
      "label": "Address:",
      "field": "crew.address"
     },
     {
      "label": "MC Username:",
      "field": "crew.username"
     }
    ]
   },
   {
    "k": "p",
    "x": "Both parties confirm that the information provided above is accurate."
   }
  ]
 },
 {
  "title": "2. Project and Engagement Details",
  "blocks": [
   {
    "k": "p",
    "x": "The following details are fetched from the project posting, application and mutually agreed hiring terms."
   },
   {
    "k": "kv",
    "items": [
     {
      "label": "Project Name:",
      "field": "project.name"
     },
     {
      "label": "Project Type:",
      "field": "project.type"
     },
     {
      "label": "Production House:",
      "field": "project.productionHouse"
     },
     {
      "label": "Project Description:",
      "field": "project.description"
     },
     {
      "label": "Position / Department:",
      "field": "offer.position"
     },
     {
      "label": "Responsibilities:",
      "field": "offer.responsibilities"
     },
     {
      "label": "Project Location:",
      "field": "project.location"
     },
     {
      "label": "Engagement Start Date:",
      "field": "offer.startDate"
     },
     {
      "label": "Engagement End Date:",
      "field": "offer.endDate"
     },
     {
      "label": "Reporting Time / Working Schedule:",
      "field": "offer.schedule"
     },
     {
      "label": "Engagement Type:",
      "field": "offer.engagementType"
     },
     {
      "label": "Work Arrangement:",
      "field": "offer.workArrangement"
     },
     {
      "label": "Project Status:",
      "field": "project.status"
     }
    ]
   },
   {
    "k": "p",
    "x": "These details form part of this agreement. Any changes must be mutually acknowledged."
   }
  ]
 },
 {
  "title": "3. Scope of Work and Responsibilities",
  "blocks": [
   {
    "k": "clause",
    "n": "3.1",
    "x": "The Crew Member agrees to perform the responsibilities associated with the agreed position and any additional responsibilities specifically documented and accepted by both parties."
   },
   {
    "k": "clause",
    "n": "3.2",
    "x": "The Employer agrees to provide the information, instructions, access, resources and reasonable coordination necessary for the Crew Member to perform the agreed work."
   },
   {
    "k": "clause",
    "n": "3.3",
    "x": "Any substantial change in the role, responsibilities, workload or deliverables must be discussed and mutually agreed upon before it is implemented."
   },
   {
    "k": "clause",
    "n": "3.4",
    "x": "The Crew Member is not automatically obligated to perform substantially different work outside the agreed scope."
   }
  ]
 },
 {
  "title": "4. Remuneration and Payment",
  "blocks": [
   {
    "k": "p",
    "x": "The parties agree to the following payment terms:"
   },
   {
    "k": "kv",
    "items": [
     {
      "label": "Total Agreed Fee:",
      "field": "offer.totalFee"
     },
     {
      "label": "Payment Basis:",
      "field": "offer.paymentBasis"
     },
     {
      "label": "Advance Payment:",
      "field": "offer.advancePayment"
     },
     {
      "label": "Remaining Payment:",
      "field": "offer.remainingPayment"
     },
     {
      "label": "Payment Schedule:",
      "field": "offer.paymentSchedule"
     },
     {
      "label": "Payment Method:",
      "field": "offer.paymentMethod"
     }
    ]
   },
   {
    "k": "clause",
    "n": "4.1",
    "x": "The Employer agrees to pay the Crew Member according to the agreed payment schedule."
   },
   {
    "k": "clause",
    "n": "4.2",
    "x": "Any additional work, extended schedule or expenses outside the agreed arrangement must be approved by both parties before being incurred."
   },
   {
    "k": "clause",
    "n": "4.3",
    "x": "Neither party may unilaterally change the agreed remuneration or payment schedule."
   },
   {
    "k": "clause",
    "n": "4.4",
    "x": "If a payment is delayed, the affected party should notify the other party promptly and both parties should make reasonable efforts to resolve the issue."
   }
  ]
 },
 {
  "title": "5. Availability and Commitment",
  "blocks": [
   {
    "k": "clause",
    "n": "5.1",
    "x": "Once this agreement is mutually accepted, the Crew Member confirms their commitment to the agreed engagement dates and schedule."
   },
   {
    "k": "clause",
    "n": "5.2",
    "x": "The Employer confirms that the Crew Member has been selected for the specified role and that the engagement is subject to the agreed project conditions."
   },
   {
    "k": "clause",
    "n": "5.3",
    "x": "Both parties agree to communicate promptly if circumstances arise that may affect the engagement."
   },
   {
    "k": "clause",
    "n": "5.4",
    "x": "Neither party should make avoidable last-minute changes that materially affect the other party's commitments."
   }
  ]
 },
 {
  "title": "6. Cancellation, Withdrawal and Changes",
  "blocks": [
   {
    "k": "clause",
    "n": "6.1",
    "x": "Either party may request cancellation or changes to the engagement by providing written notice to the other party via their official emails."
   },
   {
    "k": "clause",
    "n": "6.2",
    "x": "Where the Employer cancels after confirming the engagement, both parties should settle payment for work already completed and any previously approved, non-recoverable expenses."
   },
   {
    "k": "clause",
    "n": "6.3",
    "x": "Where the Crew Member withdraws after confirming the engagement, they should provide notice as early as reasonably possible and cooperate in handing over any completed work or materials."
   },
   {
    "k": "clause",
    "n": "6.4",
    "x": "Any cancellation compensation, booking fee or other financial consequence must be explicitly agreed by both parties before acceptance of this agreement. No additional penalty will automatically apply."
   },
   {
    "k": "clause",
    "n": "6.5",
    "x": "Neither party will be held responsible for failure to perform obligations where circumstances beyond their reasonable control make performance impossible, subject to prompt communication and reasonable efforts to minimise the impact."
   }
  ]
 },
 {
  "title": "7. Professional Conduct and Working Conditions",
  "blocks": [
   {
    "k": "clause",
    "n": "7.1",
    "x": "Both parties agree to maintain professional communication and respectful conduct throughout the engagement."
   },
   {
    "k": "clause",
    "n": "7.2",
    "x": "The Employer agrees to provide a reasonably safe working environment and communicate known safety risks relevant to the work."
   },
   {
    "k": "clause",
    "n": "7.3",
    "x": "The Crew Member agrees to follow reasonable project-related instructions, safety procedures and agreed production protocols."
   },
   {
    "k": "clause",
    "n": "7.4",
    "x": "Any concerns relating to working conditions, harassment, discrimination, safety or professional conduct should be raised promptly and handled seriously."
   },
   {
    "k": "clause",
    "n": "7.5",
    "x": "Neither party should misrepresent the project, agreed compensation, responsibilities or working conditions."
   }
  ]
 },
 {
  "title": "8. Equipment and Materials",
  "blocks": [
   {
    "k": "clause",
    "n": "8.1",
    "x": "Equipment and materials required for the engagement will be provided according to the arrangement (if applicable)"
   },
   {
    "k": "clause",
    "n": "8.2",
    "x": "Both parties agree to take reasonable care of equipment and materials entrusted to them."
   },
   {
    "k": "clause",
    "n": "8.3",
    "x": "Responsibility for damage, loss or replacement costs should be determined based on the circumstances and should not be imposed automatically without establishing responsibility."
   }
  ]
 },
 {
  "title": "9. Confidentiality and Non-Disclosure",
  "blocks": [
   {
    "k": "clause",
    "n": "9.1",
    "x": "Both parties agree not to disclose confidential project information, scripts, footage, unreleased material, production plans, financial information, personal information or other sensitive information received through the engagement without appropriate permission."
   },
   {
    "k": "clause",
    "n": "9.2",
    "x": "The Crew Member will not publish, distribute or share unreleased project material, behind-the-scenes footage or confidential production information without the Employer's written permission unless mutually agreed for marketing purposes."
   },
   {
    "k": "clause",
    "n": "9.3",
    "x": "The Employer will not misuse or disclose the Crew Member's private information, personal contact details or confidential professional material."
   },
   {
    "k": "clause",
    "n": "9.4",
    "x": "Confidentiality obligations do not prevent disclosures required by law or the use of information that is already publicly available through no breach of this agreement."
   }
  ]
 },
 {
  "title": "10. Intellectual Property and Work Ownership",
  "blocks": [
   {
    "k": "clause",
    "n": "10.1",
    "x": "Ownership and permitted use of work created during the engagement must follow the specific arrangement agreed by both parties."
   },
   {
    "k": "clause",
    "n": "10.2",
    "x": "The applicable ownership or licensing arrangement is: {{offer.ownershipTerms}}"
   },
   {
    "k": "clause",
    "n": "10.3",
    "x": "The Employer must not assume that all pre-existing material, tools, techniques, templates or independently owned work of the Crew Member automatically transfers to the Employer."
   },
   {
    "k": "clause",
    "n": "10.4",
    "x": "The Crew Member must not use or distribute project material beyond the agreed purpose without permission."
   },
   {
    "k": "clause",
    "n": "10.5",
    "x": "Any specific intellectual property transfer, licence, usage restriction or portfolio permission must be expressly documented and accepted by both parties."
   }
  ]
 },
 {
  "title": "11. Screen Credit and Portfolio Rights",
  "blocks": [
   {
    "k": "kv",
    "items": [
     {
      "label": "Screen Credit:",
      "field": "offer.screenCredit"
     },
     {
      "label": "Credit Name:",
      "field": "offer.creditName"
     }
    ]
   },
   {
    "k": "clause",
    "n": "11.1",
    "x": "The Employer agrees to provide the agreed credit, subject to the project's actual crediting requirements and any applicable platform or distributor restrictions."
   },
   {
    "k": "clause",
    "n": "11.2",
    "x": "The Crew Member must obtain permission before publicly sharing unreleased footage, confidential material or project assets."
   }
  ]
 },
 {
  "title": "12. Communication and Project Changes",
  "blocks": [
   {
    "k": "clause",
    "n": "12.1",
    "x": "Both parties agree to maintain reasonable communication through the mutually agreed contact channels."
   },
   {
    "k": "clause",
    "n": "12.2",
    "x": "Important changes to dates, locations, responsibilities, compensation or deliverables must be recorded in writing."
   },
   {
    "k": "clause",
    "n": "12.3",
    "x": "Verbal discussions alone should not be treated as a modification of this agreement unless subsequently acknowledged in writing by both parties."
   }
  ]
 },
 {
  "title": "13. Termination",
  "blocks": [
   {
    "k": "clause",
    "n": "13.1",
    "x": "Either party may terminate this engagement in the event of a material breach of the agreement, subject to providing written notice and a reasonable opportunity to resolve the issue where appropriate."
   },
   {
    "k": "clause",
    "n": "13.2",
    "x": "Immediate termination may be justified in circumstances involving serious misconduct, safety risks, fraud or other serious breaches."
   },
   {
    "k": "clause",
    "n": "13.3",
    "x": "Upon termination, both parties should settle outstanding agreed payments, return entrusted property and complete any reasonable handover obligations."
   },
   {
    "k": "clause",
    "n": "13.4",
    "x": "Termination does not automatically remove obligations relating to confidentiality, intellectual property, outstanding payments or other provisions intended to continue after the engagement."
   }
  ]
 },
 {
  "title": "14. Dispute Resolution",
  "blocks": [
   {
    "k": "clause",
    "n": "14.1",
    "x": "Both parties agree to first attempt to resolve any disagreement through direct and good-faith communication."
   },
   {
    "k": "clause",
    "n": "14.2",
    "x": "If the matter cannot be resolved, the parties may mutually agree to mediation or another appropriate dispute-resolution process."
   },
   {
    "k": "clause",
    "n": "14.3",
    "x": "If legal proceedings become necessary, the applicable law and jurisdiction will be determined by the agreed jurisdiction and applicable law, as specified below:"
   },
   {
    "k": "kv",
    "items": [
     {
      "label": "Governing Law:",
      "field": "site.governingLaw"
     }
    ]
   }
  ]
 },
 {
  "title": "15. Nature of Engagement",
  "blocks": [
   {
    "k": "clause",
    "n": "15.1",
    "x": "The parties acknowledge that the nature of the engagement is: {{offer.natureOfEngagement}}"
   },
   {
    "k": "clause",
    "n": "15.2",
    "x": "The actual legal relationship between the parties will be determined by the circumstances and applicable law, and not merely by the label selected above."
   },
   {
    "k": "clause",
    "n": "15.3",
    "x": "Nothing in this agreement removes any mandatory rights or obligations imposed by applicable law."
   }
  ]
 },
 {
  "title": "16. General Terms",
  "blocks": [
   {
    "k": "clause",
    "n": "16.1",
    "x": "Both parties confirm that they have read and understood this agreement before accepting it."
   },
   {
    "k": "clause",
    "n": "16.2",
    "x": "This agreement, together with its project-specific details and any mutually accepted attachments, represents the understanding between the parties regarding this engagement."
   },
   {
    "k": "clause",
    "n": "16.3",
    "x": "Any amendment must be recorded in writing and accepted by both parties."
   },
   {
    "k": "clause",
    "n": "16.4",
    "x": "If any provision is found unenforceable, the remaining provisions will continue to apply to the extent permitted by law."
   },
   {
    "k": "clause",
    "n": "16.5",
    "x": "This agreement does not override any mandatory legal rights or statutory obligations."
   }
  ]
 },
 {
  "title": "17. Digital Acceptance and Signature",
  "blocks": [
   {
    "k": "p",
    "x": "By digitally accepting this agreement, both parties confirm that:"
   },
   {
    "k": "ul",
    "items": [
     "They have reviewed the complete agreement and all project-specific details.",
     "They understand their respective responsibilities and commitments.",
     "They agree to the payment, schedule and working conditions recorded in this agreement.",
     "They have had the opportunity to request clarification or changes before acceptance.",
     "They intend to be bound by the agreement to the extent permitted by applicable law."
    ]
   }
  ]
 },
 {
  "title": "18. Platform Disclaimer, Independent Agreement and Limitation of Liability",
  "blocks": [
   {
    "k": "ul",
    "items": [
     "{{site.domain}} (\"Platform\") acts solely as a technology platform that facilitates connections between employers and crew members and provides tools to document their mutually agreed engagement terms.",
     "This agreement is entered into directly between the Employer and the Crew Member. {{site.name}} is not a party, employer, production representative, agent, guarantor, partner or contracting principal to this agreement and does not assume responsibility for the performance of either party's obligations.",
     "All responsibilities relating to hiring, payment, remuneration, working conditions, project execution, deliverables, cancellations, professional conduct, intellectual property, confidentiality and other engagement-related matters rest solely with the Employer and the Crew Member, as applicable under their agreement and applicable law.",
     "Any disagreement, claim, financial dispute, breach, loss, damage, injury or legal proceeding arising from or relating to the engagement must be addressed directly between the Employer and the Crew Member. Neither party shall treat {{site.name}} as responsible for resolving, compensating or fulfilling obligations arising from their engagement merely because the agreement was generated, accepted or stored through the Platform.",
     "{{site.name}} may, at its discretion, provide access to the agreement, its recorded versions, acceptance timestamps and relevant platform records where legally permitted or required. Such access is provided for documentation and evidentiary purposes and does not constitute legal representation, arbitration, mediation, an admission of liability or a guarantee of either party's claims.",
     "{{site.name}} does not independently guarantee the accuracy of information supplied by either party, the legitimacy of a project, the quality of services, the availability of funds or the fulfilment of contractual obligations.",
     "Nothing in this section excludes or limits any liability that cannot legally be excluded or limited under applicable law, including liability arising from {{site.name}}'s own statutory obligations, negligence, fraud or wilful misconduct where such exclusion is prohibited.",
     "Both parties acknowledge that {{site.name}} provides the platform and agreement-recording facility as a convenience, while the contractual relationship and its associated obligations remain between the Employer and the Crew Member."
    ]
   }
  ]
 }
]
