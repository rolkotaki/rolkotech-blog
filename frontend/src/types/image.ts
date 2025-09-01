export interface ImageUploadResponse {
  filename: string;
  size: number;
  url: string;
}

export interface Image extends ImageUploadResponse {
  upload_date: string;
}

export interface Images {
  data: Image[];
  count: number;
}
