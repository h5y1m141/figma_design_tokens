const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

const baseURL = "https://api.figma.com";
const apiVersion = "v1";
const fileAPIPath = "files";
export async function getFigmaFile(fileId: string) {
  const url = `${baseURL}/${apiVersion}/${fileAPIPath}/${fileId}`;
  if (!FIGMA_ACCESS_TOKEN) {
    console.error("エラー: FIGMA_ACCESS_TOKENが設定されていません");
    console.error(".envファイルに以下を追加してください:");
    console.error("FIGMA_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }

  const response = await fetch(url, {
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
    },
  });
  if (!response.ok)
    throw new Error(
      `Figma API エラー: ${response.status} ${response.statusText}`,
    );

  return await response.json();
}
