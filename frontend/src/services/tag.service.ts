import api from "./api";
import type { Tags, Tag, CreateTagRequest } from "../types";

export const tagService = {
  getTags: async (): Promise<Tags> => {
    const url = `/tags`;

    const response = await api.get<Tags>(url);
    return response.data;
  },

  createTag: async (data: CreateTagRequest): Promise<Tag> => {
    const response = await api.post<Tag>("/tags", data);
    return response.data;
  },
};
