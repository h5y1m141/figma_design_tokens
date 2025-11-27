import { getFile } from "./src/figma/file";
import {
  displayFileInfo,
  displayNodeInfo,
  findNodeById,
} from "./src/figma/node";

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
    displayFileInfo(fileData);
    const targetNode = findNodeById(
      fileData.document,
      FIGMA_NODE_ID.replace("-", ":"),
    );

    if (targetNode) {
      displayNodeInfo(targetNode);
    } else {
      console.log(`⚠ ノードID "${FIGMA_NODE_ID}" が見つかりませんでした`);
    }
    console.log("\n=== ファイル全体情報 ===");
    console.log(JSON.stringify(fileData, null, 2));
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}
