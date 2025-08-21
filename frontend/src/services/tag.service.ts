import api from "./api";
import type { Tags } from "../types";

export const tagService = {
  getTags: async (): Promise<Tags> => {
    const url = `/tags`;

    const response = await api.get<Tags>(url);
    return response.data;
  },
};
