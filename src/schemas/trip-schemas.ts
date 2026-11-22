/**
 * Trip collections.
 *
 * Each trip lives in its own RecordRoom (`trip:<tripId>`), so these
 * collections hold only that trip's data and the link itself is the key.
 *
 * Friends join without signing in, so they connect anonymously (role
 * `viewer`, `'*'` as fallback). Every role gets the same rules: anyone with
 * the link can add themselves, fix an entry, and vote. That is deliberate for
 * a friend-group tool — the link is the access control. `writableFields`
 * keeps writes to the declared columns.
 */

import type { CollectionSchema, RolePermissions } from 'deepspace/schema'

function openTo(fields: string[]): Record<string, RolePermissions> {
  const rule: RolePermissions = {
    read: true,
    create: true,
    update: true,
    delete: true,
    writableFields: fields,
  }
  return { '*': rule, viewer: rule, member: rule, admin: { ...rule, writableFields: undefined } }
}

/** One row per trip room (key = 'main'): the trip's name and length. */
export const tripInfoSchema: CollectionSchema = {
  name: 'trip_info',
  columns: [
    { name: 'key', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'name', storage: 'text', interpretation: 'plain', required: true },
    { name: 'nights', storage: 'number', interpretation: 'plain', default: 4 },
  ],
  uniqueOn: ['key'],
  permissions: openTo(['key', 'name', 'nights']),
}

/** A person in the group: where they fly from and their all-in budget (USD). */
export const travelersSchema: CollectionSchema = {
  name: 'travelers',
  columns: [
    { name: 'name', storage: 'text', interpretation: 'plain', required: true },
    { name: 'originId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'budget', storage: 'number', interpretation: 'plain', required: true },
  ],
  permissions: openTo(['name', 'originId', 'budget']),
}

/** One vote per traveler; changing your pick updates the same row. */
export const votesSchema: CollectionSchema = {
  name: 'votes',
  columns: [
    { name: 'travelerId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'destinationId', storage: 'text', interpretation: 'plain', required: true },
  ],
  uniqueOn: ['travelerId'],
  permissions: openTo(['travelerId', 'destinationId']),
}

/**
 * Downvotes: "I really don't want to go here". A traveler can downvote any
 * number of places, but each place only once. Each downvote counts as −3 in
 * the score (see useTrip.ts), so one strong "no" outweighs a few "yes"es.
 */
export const downvotesSchema: CollectionSchema = {
  name: 'downvotes',
  columns: [
    { name: 'travelerId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'destinationId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
  ],
  uniqueOn: ['travelerId', 'destinationId'],
  permissions: openTo(['travelerId', 'destinationId']),
}

export const tripSchemas: CollectionSchema[] = [tripInfoSchema, travelersSchema, votesSchema, downvotesSchema]

export type TripInfo = { key: string; name: string; nights: number }
export type Traveler = { name: string; originId: string; budget: number }
export type Vote = { travelerId: string; destinationId: string }
export type Downvote = { travelerId: string; destinationId: string }
