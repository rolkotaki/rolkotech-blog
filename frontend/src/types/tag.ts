export interface Tag {
  id: number;
  name: string;
}

export interface Tags {
  data: Tag[];
  count: number;
}

export interface CreateTagRequest {
  name: string;
}
