import { get } from "./client";

export type FigmaUserType = {
  id: string;
  handle: string;
  image_url: string;
};

export type FrameOffsetType = {
  node_id: string;
  node_offset: {
    x: number;
    y: number;
  };
};

export type RegionType = {
  x: number;
  y: number;
  region_height: number;
  comment_pin_corner: string;
};

/**
 * コメントの client_meta（位置情報）
 */
export type ClientMetaType = FrameOffsetType | RegionType;

export type FigmaCommentType = {
  id: string;
  uuid?: string;
  file_key: string;
  parent_id: string;
  user: FigmaUserType;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: ClientMetaType | null;
  order_id: string;
};

export type CommentsResponse = {
  comments: FigmaCommentType[];
};

export async function fetchComments(fileId: string): Promise<CommentsResponse> {
  return await get(`files/${fileId}/comments`);
}
