import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import { PlanDetail, PrdSummary } from '../types';

interface PlanState {
  planSummaries: PrdSummary[];
  currentPlanDetail: PlanDetail | null;
  summariesLoading: boolean;
  detailLoading: boolean;
  summariesError: Error | null;
  detailError: Error | null;
  fetchPlanSummaries: (isInitialCall?: boolean) => Promise<void>;
  fetchPlanDetail: (planId: string) => Promise<void>;
  clearCurrentPlanDetail: () => void;
  getPlanById: (planId: string) => PrdSummary | undefined;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  planSummaries: [],
  currentPlanDetail: null,
  summariesLoading: false,
  detailLoading: false,
  summariesError: null,
  detailError: null,

  fetchPlanSummaries: async (isInitialCall?: boolean) => {
    if (isInitialCall !== false) {
      set({ summariesLoading: true, summariesError: null });
    } else {
      set((state) => ({ ...state, summariesError: null }));
    }
    try {
      const summaries = await apiClient.getPlanSummaries();
      set({ planSummaries: summaries, summariesLoading: false });
    } catch (error) {
      set({ summariesError: error as Error, summariesLoading: false });
      console.error('Failed to fetch plan summaries:', error);
    }
  },

  fetchPlanDetail: async (planId: string) => {
    if (!planId) {
      set({
        currentPlanDetail: null,
        detailError: new Error('Plan ID is required.'),
        detailLoading: false,
      });
      return;
    }
    set({ detailLoading: true, detailError: null });
    try {
      const detail = await apiClient.getPlanDetail(planId);
      set({ currentPlanDetail: detail, detailLoading: false });
    } catch (error) {
      set({
        detailError: error as Error,
        detailLoading: false,
        currentPlanDetail: null,
      });
      console.error(`Failed to fetch plan detail for ${planId}:`, error);
    }
  },

  clearCurrentPlanDetail: () => {
    set({ currentPlanDetail: null, detailError: null, detailLoading: false });
  },

  getPlanById: (planId: string) => {
    return get().planSummaries.find((plan) => plan.id === planId);
  },
}));
