import { useMemo, useCallback } from 'react';
import { useApi } from './useApi';
import type { PlaceImageRecord, PlaceLevel, User } from '@shared/types';

export function usePlaceImages() {
  const { data: userData } = useApi<{ user: User }>('/api/users/me');
  const { data, isLoading, refetch } = useApi<{ images: PlaceImageRecord[] }>('/api/places/images');

  const images = useMemo(() => data?.images ?? [], [data?.images]);

  const isAdmin = useMemo(() => {
    const role = userData?.user?.role;
    return role === 'admin' || role === 'super_admin';
  }, [userData?.user?.role]);

  // Lookup helper with hierarchical fallback:
  // exact match -> mandal -> district
  const getPlaceImage = useCallback(
    (level: PlaceLevel, district: string, mandal?: string, village?: string): PlaceImageRecord | undefined => {
      const d = district?.trim().toLowerCase();
      const m = mandal?.trim().toLowerCase();
      const v = village?.trim().toLowerCase();

      if (level === 'village' && v && m && d) {
        const exactVillage = images.find(
          (img) =>
            img.level === 'village' &&
            img.district.toLowerCase() === d &&
            img.mandal?.toLowerCase() === m &&
            img.village?.toLowerCase() === v
        );
        if (exactVillage) return exactVillage;
      }

      if ((level === 'village' || level === 'mandal') && m && d) {
        const exactMandal = images.find(
          (img) =>
            img.level === 'mandal' &&
            img.district.toLowerCase() === d &&
            img.mandal?.toLowerCase() === m
        );
        if (exactMandal) return exactMandal;
      }

      if (d) {
        const exactDistrict = images.find(
          (img) => img.level === 'district' && img.district.toLowerCase() === d
        );
        if (exactDistrict) return exactDistrict;
      }

      return undefined;
    },
    [images]
  );

  // Exact lookup without fallback (for configuration modal)
  const getExactPlaceImage = useCallback(
    (level: PlaceLevel, district: string, mandal?: string, village?: string): PlaceImageRecord | undefined => {
      const d = district?.trim().toLowerCase();
      const m = mandal?.trim().toLowerCase();
      const v = village?.trim().toLowerCase();

      return images.find((img) => {
        if (img.level !== level) return false;
        if (img.district.toLowerCase() !== d) return false;
        if (level === 'mandal') return img.mandal?.toLowerCase() === m;
        if (level === 'village') return img.mandal?.toLowerCase() === m && img.village?.toLowerCase() === v;
        return true;
      });
    },
    [images]
  );

  return {
    images,
    isLoading,
    refetch,
    isAdmin,
    getPlaceImage,
    getExactPlaceImage,
  };
}
