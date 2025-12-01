import { get } from "./client";

export type UserType = {
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

export type ClientMetaType = FrameOffsetType | RegionType;

export type CommentType = {
  id: string;
  uuid?: string;
  file_key: string;
  parent_id: string;
  user: UserType;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: ClientMetaType | null;
  order_id: string;
};

export type CommentsResponseType = {
  comments: CommentType[];
};

export async function fetchComments(
  fileId: string,
): Promise<CommentsResponseType> {
  return await get(`files/${fileId}/comments`);
}
