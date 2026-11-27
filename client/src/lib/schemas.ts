// Zod schemas for API responses. Used by api() to validate data before it
// reaches the UI, so a malformed payload fails loudly instead of crashing
// a component.

import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  work: z.string(),
  area: z.string(),
  emergencyContact: z.string(),
  wid: z.string(),
  role: z.string(),
  verified: z.boolean(),
  lang: z.string(),
  photo: z.string(),
  issuedAt: z.number().nullable(),
  createdAt: z.number(),
  idCreated: z.boolean(),
  privacy: z.record(z.string(), z.boolean()),
  phoneVerified: z.boolean(),
})

export const SessionResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
  profileComplete: z.boolean(),
  progress: z.unknown().optional(),
})

export const DashboardSchema = z.object({
  user: UserSchema,
  stats: z.object({
    todayKg: z.number(),
    collections: z.number(),
    incidents: z.number(),
    scans: z.number(),
    checksToday: z.number(),
    points: z.number(),
  }),
  recent: z.object({
    collections: z.array(z.unknown()),
    incidents: z.array(z.unknown()),
  }),
  progress: z.unknown(),
})

export const AiChatResponseSchema = z.object({
  reply: z.string(),
  provider: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
})

export const AiStatusSchema = z.object({
  mode: z.string(),
  configured: z.record(z.string(), z.boolean()).optional(),
  lastProvider: z.string().optional(),
  providers: z.array(z.string()).optional(),
})

export const ProvidersSchema = z.object({
  sms: z.enum(['firebase', 'demo']),
  demoMode: z.boolean(),
  firebase: z
    .object({
      apiKey: z.string(),
      projectId: z.string(),
      authDomain: z.string(),
    })
    .nullable(),
})

export const PhoneVerifyResponseSchema = z.object({
  user: UserSchema,
  phone: z.string().optional(),
  message: z.string().optional(),
})

export const GenericOkSchema = z.object({
  ok: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})
