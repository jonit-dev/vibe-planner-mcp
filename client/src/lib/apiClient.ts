import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { PlanDetail, PrdSummary } from '../types';

const API_BASE_URL = '/api'; // Assuming your API is proxied or on the same domain

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function requestWrapper<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axiosInstance.request<T>(config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    let errorMessage = 'An unknown error occurred';
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const serverError = axiosError.response.data as { message?: string };
      errorMessage = `API Error (${axiosError.response.status}): ${
        serverError.message || axiosError.message
      }`;
    } else if (axiosError.request) {
      // The request was made but no response was received
      errorMessage = 'API Error: No response received from server.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = `API Error: ${axiosError.message}`;
    }
    console.error('Axios request failed:', axiosError);
    throw new Error(errorMessage);
  }
}

export const apiClient = {
  async getPlanSummaries(): Promise<PrdSummary[]> {
    return requestWrapper<PrdSummary[]>({ method: 'GET', url: '/plans' });
  },

  async getPlanDetail(planId: string): Promise<PlanDetail> {
    if (!planId) {
      throw new Error('planId is required to fetch plan details.');
    }
    return requestWrapper<PlanDetail>({
      method: 'GET',
      url: `/plans/${planId}`,
    });
  },
  // Add other methods here as needed, e.g., for updating tasks if the read-only requirement changes.
};

// Example usage (optional, for testing or demonstration):
/*
async function testApiClient() {
  try {
    console.log('Fetching plan summaries with axios...');
    const summaries = await apiClient.getPlanSummaries();
    console.log('Summaries:', summaries);

    if (summaries.length > 0) {
      console.log(`Fetching details for plan: ${summaries[0].id} with axios...`);
      const planDetail = await apiClient.getPlanDetail(summaries[0].id);
      console.log('Plan Detail:', planDetail);

      if (planDetail.phases && planDetail.phases.length > 0) {
        console.log('Phases:', planDetail.phases);
        if (planDetail.phases[0].tasks && planDetail.phases[0].tasks.length > 0) {
          console.log('Tasks in first phase:', planDetail.phases[0].tasks);
        }
      }
    }
  } catch (error) {
    console.error('API Client Test Error (axios):', error);
  }
}

testApiClient();
*/
