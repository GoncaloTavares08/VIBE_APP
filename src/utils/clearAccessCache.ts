// src/utils/clearAccessCache.ts
// Utility to clear access cache when needed (e.g., on logout)

export function clearAllAccessCache() {
  // Clear all club access cache entries
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('club_access_')) {
      sessionStorage.removeItem(key);
    }
  });
}

export function clearAccessCacheForClub(clubSlug: string, userId: number) {
  const cacheKey = `club_access_${clubSlug}_${userId}`;
  sessionStorage.removeItem(cacheKey);
}

export function clearAccessCacheForUser(userId: number) {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.includes(`_${userId}`)) {
      sessionStorage.removeItem(key);
    }
  });
}
