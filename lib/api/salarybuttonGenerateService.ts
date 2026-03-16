import api from "./axios";
import { ExtraDecisionRequestDTO } from "./types";

export const salaryGenerateService = {

  /* ───────────────────────────────────────────
     GENERATE SALARY
  ─────────────────────────────────────────── */

  generateSalary: async (year: string, month: string) => {
    const payload = {
      month: `${year}-${month}`,
    };

    const response = await api.post("/salary/generate", payload);
    return response.data;
  },

  /* ───────────────────────────────────────────
     EXTRA WORK DECISION
  ─────────────────────────────────────────── */

  extraDecision: async (payload: ExtraDecisionRequestDTO) => {
    const response = await api.post(
      "/salary/extra-decision",
      payload
    );

    return response.data;
  },

  /* ───────────────────────────────────────────
     GET EXTRA WORK EMPLOYEES
  ─────────────────────────────────────────── */

  getExtraWorkEmployees: async (month: string) => {
    const response = await api.get(
      `/salary/extra-work`,
      {
        params: { month }
      }
    );

    return response.data;
  },

};