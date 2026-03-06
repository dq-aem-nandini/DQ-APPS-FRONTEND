import { AxiosResponse } from "axios";
import api from "./axios";
import {
  WebResponseDTO,
  WorkingPolicyRequestDTO,
  WorkingPolicyResponseDTO,
  EmploymentWorkingPolicy,
  EmploymentType,
} from "./types";

function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.response?.data ||
    error?.message ||
    "Something went wrong"
  );
}

export const workingPolicyService = {

  /**
   * Create Working Policy
   */
  async createWorkingPolicy(
    data: WorkingPolicyRequestDTO
  ): Promise<WebResponseDTO<EmploymentWorkingPolicy>> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmploymentWorkingPolicy>> =
        await api.post("/working-policy/create", data);

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Update Working Policy
   */
  async updateWorkingPolicy(
    policyId: string,
    data: WorkingPolicyRequestDTO
  ): Promise<WebResponseDTO<EmploymentWorkingPolicy>> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmploymentWorkingPolicy>> =
        await api.put(
          `/working-policy/update?policyId=${policyId}`,
          data
        );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Close Working Policy
   */
  async closeWorkingPolicy(
    policyId: string,
    closeDate: string
  ): Promise<WebResponseDTO<EmploymentWorkingPolicy>> {
    try {
      const response: AxiosResponse<WebResponseDTO<EmploymentWorkingPolicy>> =
        await api.post(
          `/working-policy/close?policyId=${policyId}&closeDate=${closeDate}`
        );

      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Get all working policies
   */
  async getAllWorkingPolicies(
    employmentType?: EmploymentType,
    active?: boolean
  ): Promise<WebResponseDTO<WorkingPolicyResponseDTO[]>> {
    try {
      const response: AxiosResponse<
        WebResponseDTO<WorkingPolicyResponseDTO[]>
      > = await api.get("/working-policy/get/all", {
        params: {
          employmentType,
          active,
        },
      });
  
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
};