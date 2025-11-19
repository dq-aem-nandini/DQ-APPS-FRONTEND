import api from "./axios";

export const salaryGenerateService = {
  generateSalary: async (year: string, month: string) => {
    const payload = {
      month: `${year}-${month}`,  // "2025-06"
    };

    const response = await api.post("/salary/generate", payload);
    return response.data;
  }
};

