// src/hooks/useClubAccess.ts
import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

interface ClubAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  clubName: string | null;
  role: string | null; // Add role to interface
  points: number | null; // Add points
  memberSince: string | null; // Add memberSince
  error: string | null;
}

export function useClubAccess(userId: number | undefined, currentPath: string): ClubAccessResult {
  const [hasAccess, setHasAccess] = useState(true); // Start optimistic
  const [isLoading, setIsLoading] = useState(true);
  const [clubName, setClubName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // State for role
  const [points, setPoints] = useState<number | null>(null); // State for points
  const [memberSince, setMemberSince] = useState<string | null>(null); // State for memberSince
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const verifyAccess = async () => {
      // Get current club from URL
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const clubSlug = pathSegments[0];

      // Check cache first (valid for this session)
      const cacheKey = `club_access_${clubSlug}_${userId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);
        setHasAccess(cachedData.hasAccess);
        setClubName(cachedData.clubName);
        setRole(cachedData.role); // Restore role
        setPoints(cachedData.points); // Restore points
        setMemberSince(cachedData.memberSince); // Restore memberSince
        setError(cachedData.error);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiFetch('/user/verify-access', {
          method: 'POST',
          body: JSON.stringify({ user_id: userId })
        });

        const result = {
          hasAccess: response.has_access || false,
          clubName: response.club?.name || null,
          role: response.role || null, // Capture role
          points: response.points !== undefined ? response.points : null, // Capture points
          memberSince: response.joined_at || null, // Capture joined_at
          error: response.has_access ? null : (response.message || 'Sem acesso a este clube')
        };

        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify(result));

        setHasAccess(result.hasAccess);
        setClubName(result.clubName);
        setRole(result.role); // Set role
        setPoints(result.points);
        setMemberSince(result.memberSince);
        setError(result.error);
      } catch (err: any) {
        console.error('Access verification error:', err);
        setHasAccess(false);
        setError(err.message || 'Erro ao verificar acesso');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccess();

  }, [userId, currentPath]);

  return { hasAccess, isLoading, clubName, role, points, memberSince, error };
}
