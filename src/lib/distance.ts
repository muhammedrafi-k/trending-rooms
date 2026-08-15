import { LocationCoords } from '../types';

/**
 * Calculate distance in kilometers between two lat/lng points using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format human-readable witness distance string
 */
export function formatWitnessDistance(
  userLoc: LocationCoords,
  roomLoc: LocationCoords,
  randomVariation = true
): string {
  // Base distance in km
  let distKm = calculateDistanceKm(userLoc.lat, userLoc.lng, roomLoc.lat, roomLoc.lng);
  
  // Add small random noise to simulate micro-positioning within the same area if close
  if (randomVariation && distKm < 5) {
    const jitter = (Math.random() - 0.5) * 0.2; // +/- 100m
    distKm = Math.max(0.05, distKm + jitter);
  }

  if (distKm < 0.2) {
    return '📍 Same spot (<100m)';
  } else if (distKm < 0.6) {
    const meters = Math.round(distKm * 1000 / 50) * 50;
    return `📍 ${meters}m away`;
  } else if (distKm < 1.0) {
    return '📍 ~800m away (Same neighborhood)';
  } else if (distKm < 10) {
    return `📍 ${distKm.toFixed(1)}km away`;
  } else {
    return `📍 ${Math.round(distKm)}km away`;
  }
}

/**
 * Check if user is within witness radius (<3km)
 */
export function isNearbyWitness(userLoc: LocationCoords, roomLoc: LocationCoords): boolean {
  const distKm = calculateDistanceKm(userLoc.lat, userLoc.lng, roomLoc.lat, roomLoc.lng);
  return distKm <= 3.5;
}

/**
 * Format relative time (e.g. "Just now", "2m ago", "1h ago", "1d ago")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Calculate dynamic room expiration status (e.g. "Auto-deletes in 28 days if inactive")
 */
export function getRoomExpirationText(lastActivityAt: string): {
  daysLeft: number;
  label: string;
  isExpiringSoon: boolean;
} {
  const lastActive = new Date(lastActivityAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const expiresTimestamp = lastActive + thirtyDaysMs;
  const now = Date.now();
  
  const msLeft = expiresTimestamp - now;
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  let label = `Dies in ${daysLeft}d (Inactivity timer)`;
  if (daysLeft <= 1) {
    label = `⚠️ Dying in ${Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60)))}h of inactivity!`;
  }

  return {
    daysLeft,
    label,
    isExpiringSoon: daysLeft <= 3,
  };
}
