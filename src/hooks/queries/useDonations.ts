import type { DonationFilters } from '../../types/donation';

// Query keys for React Query
export const donationKeys = {
  all: ['donations'] as const,
  lists: () => [...donationKeys.all, 'list'] as const,
  list: (filters: DonationFilters, page: number, limit: number) =>
    [...donationKeys.lists(), { filters, page, limit }] as const,
  stats: () => [...donationKeys.all, 'stats'] as const,
  campaign: () => [...donationKeys.all, 'campaign'] as const,
  campaignProgress: (campaignId: string) =>
    [...donationKeys.campaign(), 'progress', campaignId] as const,
};
