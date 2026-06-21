import api from "../api";

export interface ApiPlan {
  id: number;
  planName: string;
  duration: string;        // "monthly" | "yearly"
  price: string;           // stored as STRING in DB
  employeeLimit: number;
  subscription?: string;
  total?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export const plansService = {
  getAll: () => api.get<ApiPlan[]>("/api/plans"),
  getById: (id: number) => api.get<ApiPlan>(`/api/plans/${id}`),
  create: (data: Partial<ApiPlan>) => api.post<ApiPlan>("/api/plans", data),
  update: (id: number, data: Partial<ApiPlan>) => api.put<ApiPlan>(`/api/plans/${id}`, data),
  delete: (id: number) => api.delete(`/api/plans/${id}`),
  // Public-safe listing used by the unauthenticated /pricing page.
  getActivePublic: () => api.get<{ status: boolean; data: ApiPlan[] }>("/api/plans/public"),
};
