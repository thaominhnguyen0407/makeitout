import { describe, expect, it } from 'vitest'
import { estimateFlight, getCity, getDestination } from './places'

const fare = (from: string, to: string) => estimateFlight(getCity(from)!, getDestination(to)!)

describe('flight estimates', () => {
  // Real budget round trips on these routes are roughly $50–150.
  it.each([
    ['london', 'barcelona'], // Europe
    ['lisbon', 'rome'], // Europe
    ['istanbul', 'athens'], // Türkiye counts as Europe
    ['bangkok', 'hanoi'], // Southeast Asia
    ['delhi', 'mumbai'], // India domestic
    ['mexicocity', 'cancun'], // Mexico domestic
    ['saopaulo', 'rio'], // Brazil domestic
  ])('%s → %s is a budget fare', (from, to) => {
    expect(fare(from, to)).toBeGreaterThanOrEqual(40)
    expect(fare(from, to)).toBeLessThanOrEqual(150)
  })

  // Outside budget markets the distance formula is unchanged.
  it.each([
    ['newyork', 'chicago', 210], // US domestic
    ['newyork', 'lisbon', 560], // crosses regions
    ['sydney', 'melbourne', 160], // Australia domestic
    ['mexicocity', 'bogota', 380], // cross-border Latin America
    ['delhi', 'kathmandu', 170], // India → Nepal is not domestic
  ])('%s → %s stays at $%i', (from, to, expected) => {
    expect(fare(from, to)).toBe(expected)
  })
})
