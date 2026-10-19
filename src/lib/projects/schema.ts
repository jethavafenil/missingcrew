import { z } from 'zod'

// Shared validation for creating/editing a project (POST and PUT routes).
// Dates and budget are optional; blank form fields ('') count as "not set".

const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value)

const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional())
const optionalAmount = z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(100_000_000).optional())

export const CONTACT_METHODS = ['email', 'phone', 'whatsapp'] as const

export const projectInputSchema = z
  .object({
    projectName: z.string().trim().min(1, 'Project name is required').max(200),
    projectType: z.string().trim().min(1, 'Please choose a project type').max(100),
    rolesNeeded: z.array(z.string().trim().min(1)).min(1, 'Select at least one crew role').max(50),
    shootStartDate: optionalDate,
    shootEndDate: optionalDate,
    location: z.string().trim().min(1, 'Location is required').max(300),
    budgetMin: optionalAmount,
    budgetMax: optionalAmount,
    budgetFixed: z.boolean().optional().default(false),
    productionHouse: z.preprocess(blankToUndefined, z.string().trim().max(150).optional()),
    description: z.string().trim().min(1, 'Description is required').max(20000),
    // Blank questions are dropped so crew never see empty prompts.
    questions: z
      .array(z.string())
      .default([])
      .transform((list) => list.map((q) => q.trim()).filter(Boolean))
      .pipe(z.array(z.string().max(300, 'Each question must be 300 characters or fewer')).max(10, 'You can add up to 10 questions')),
    contactPreference: z.array(z.enum(CONTACT_METHODS)).min(1, 'Select at least one contact method'),
  })
  .refine((v) => !v.shootStartDate || !v.shootEndDate || v.shootEndDate >= v.shootStartDate, {
    message: 'Shoot end date must be on or after the start date',
    path: ['shootEndDate'],
  })
  .refine((v) => v.budgetMin == null || v.budgetMax == null || v.budgetMax >= v.budgetMin, {
    message: 'Maximum budget must be at least the minimum budget',
    path: ['budgetMax'],
  })
  .refine((v) => !v.budgetFixed || v.budgetMin != null, {
    message: 'Enter the fixed budget amount',
    path: ['budgetMin'],
  })
  // Normalise: explicit nulls (so an edit can clear a field) and a fixed budget
  // always stores the same amount in min and max.
  .transform((v) => ({
    ...v,
    shootStartDate: v.shootStartDate ?? null,
    shootEndDate: v.shootEndDate ?? null,
    budgetMin: v.budgetMin ?? null,
    budgetMax: v.budgetFixed ? (v.budgetMin ?? null) : (v.budgetMax ?? null),
    productionHouse: v.productionHouse ?? null,
  }))

export type ProjectInput = z.infer<typeof projectInputSchema>
