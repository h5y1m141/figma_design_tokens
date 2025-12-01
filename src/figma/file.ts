import { get } from "./client";
import type { NodeType } from "./node";

export type DocumentType = {
  id: string;
  name: string;
  type: string;
  children: NodeType[];
};

export type FileType = {
  name: string;
  lastModified: string;
  version: string;
  document: DocumentType;
};

export async function fetchFile(fileId: string): Promise<FileType> {
  return await get(`files/${fileId}`);
}
