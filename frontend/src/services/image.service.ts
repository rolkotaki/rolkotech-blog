import api from "./api";
import type { Images, ImageUploadResponse } from "../types";

export const imageService = {
  uploadImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ImageUploadResponse>(
      "/uploads/images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return response.data;
  },

  getImages: async (): Promise<Images> => {
    const response = await api.get<Images>("/uploads/images");
    return response.data;
  },

  deleteImage: async (filename: string): Promise<void> => {
    await api.delete(`/uploads/images/${filename}`);
  }
};
