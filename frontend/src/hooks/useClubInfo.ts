// src/hooks/useClubInfo.ts
import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface ClubInfo {
  id: number;
  name: string;
  logo_url?: string;
  slug: string;
  location: string;
}

export function useClubInfo() {
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClubInfo = async () => {
      // Detect club from URL
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const clubSlug = pathSegments[0] || '';

      // If no club in URL, don't fetch
      if (!clubSlug) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiFetch(`/clubs/info?slug=${clubSlug}`, {
          method: 'GET'
        });

        if (response.status === 'success') {
          setClubInfo(response.club);
        }
      } catch (err) {
        console.error('Error fetching club info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubInfo();
  }, [window.location.pathname]);

  return { clubInfo, isLoading };
}
