const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

const baseURL = "https://api.figma.com/v1";

/**
 * 汎用的な GET リクエストを実行
 * @param endpoint - API エンドポイント（例: "files/xxx"）
 * @returns API レスポンスの JSON
 */
export async function get(endpoint: string): Promise<any> {
  if (!FIGMA_ACCESS_TOKEN) {
    console.error("エラー: FIGMA_ACCESS_TOKENが設定されていません");
    console.error(".envファイルに以下を追加してください:");
    console.error("FIGMA_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }

  const url = `${baseURL}/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Figma API エラー: ${response.status} ${response.statusText}\nURL: ${url}\n詳細: ${errorBody}`,
    );
  }

  return await response.json();
}

/**
 * 汎用的な POST リクエストを実行
 * @param endpoint - API エンドポイント
 * @param body - リクエストボディ
 * @returns API レスポンスの JSON
 */
export async function post(endpoint: string, body: any): Promise<any> {
  if (!FIGMA_ACCESS_TOKEN) {
    console.error("エラー: FIGMA_ACCESS_TOKENが設定されていません");
    console.error(".envファイルに以下を追加してください:");
    console.error("FIGMA_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }

  const url = `${baseURL}/${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Figma API エラー: ${response.status} ${response.statusText}\nURL: ${url}\n詳細: ${errorBody}`,
    );
  }

  return await response.json();
}

/**
 * 後方互換性のために残す
 * @deprecated file.ts の getFile() を使用してください
 */
export async function getFigmaFile(fileId: string) {
  return await get(`files/${fileId}`);
}
