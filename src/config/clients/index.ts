import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
    client: PrismaClient | undefined
}
export const client = globalForPrisma.client ?? new PrismaClient({
    log:['error','warn']
})
import Stripe from 'stripe'

let StripeSecret = process.env.STRIPE_SECRET || ''
export const stripeClient = new Stripe(StripeSecret, {
    apiVersion: '2025-05-28.basil',
    telemetry: false,
})