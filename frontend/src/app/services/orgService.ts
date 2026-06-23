import api from "../api";

// Real PostgreSQL model: organizationSignUp
// GET /api/orgRegister returns { Clients: ApiOrg[] }
export interface ApiOrg {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  selectedPlan?: string;
  title?: string;
  status?: string;       // ENUM: "Converted" | "Dead" | "Processing"
  createdAt?: string;
  updatedAt?: string;
  // Merged from Organization table by getSignUpData
  organizationId?: number;
  isLocked?: boolean;
  planExpiryDate?: string;
  planGracePeriodEnd?: string;
  [key: string]: any;
}

export interface ApiOrgListResponse {
  Clients: ApiOrg[];
}

export const orgService = {
  // NOTE: response is wrapped: { Clients: [...] }
  getAll: () => api.get<ApiOrgListResponse>("/api/orgRegister"),
  getById: (id: number) => api.get<ApiOrg>(`/api/orgRegister/${id}`),
  update: (id: number, data: Partial<ApiOrg>) => api.put<ApiOrg>(`/api/orgRegister/${id}`, data),
  renewPlan: (id: number, data: { selectedPlan: string }) =>
    api.put(`/api/renewel/${id}`, data),
  // Unlock a locked org — id is Organization.id (from the organizationId field)
  unlockOrg: (organizationId: number) =>
    api.put(`/api/admin/unlock-org/${organizationId}`),
};
