import { get } from "./client";

/**
 * Figma File を取得
 * @param fileId - Figma File ID
 * @returns File データ
 */
export async function getFile(fileId: string): Promise<any> {
  return await get(`files/${fileId}`);
}
