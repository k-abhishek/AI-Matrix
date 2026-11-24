import apiClient from "./client";
import type { SearchApiResponse, SearchQueryParams, SearchResponseData } from "../types";

export const searchApi = {
  /**
   * Performs semantic similarity search via POST /api/search
   */
  search: async (params: SearchQueryParams): Promise<SearchResponseData> => {
    const payload = {
      query: params.query,
      limit: params.limit ?? 10,
      page: params.page ?? 1,
    };

    const response = await apiClient.post<SearchApiResponse>("/search", payload);
    return response.data;
  },
};

export default searchApi;
