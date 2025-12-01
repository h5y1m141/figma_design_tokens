import { display } from "./src/figma/display";
import { getFile } from "./src/figma/file";
import { findNodeById } from "./src/figma/node";

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_NODE_ID = process.env.FIGMA_NODE_ID;

main();
async function main() {
  console.log("Figmaデザインファイルを取得中...");
  console.log(`File ID: ${FIGMA_FILE_ID}`);
  console.log(`Node ID: ${FIGMA_NODE_ID}\n`);

  if (!FIGMA_FILE_ID || !FIGMA_NODE_ID) process.exit(1);

  try {
    const fileData = await getFile(FIGMA_FILE_ID);
    display(
      {
        name: fileData.name,
        lastModified: fileData.lastModified,
        version: fileData.version,
      },
      { title: "✓ ファイル情報取得成功" },
    );
    console.log("");

    const targetNode = findNodeById(
      fileData.document,
      FIGMA_NODE_ID.replace("-", ":"),
    );

    if (targetNode) {
      display(targetNode, { title: "✓ 対象ノード発見" });
    } else {
      console.log(`⚠ ノードID "${FIGMA_NODE_ID}" が見つかりませんでした`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}
