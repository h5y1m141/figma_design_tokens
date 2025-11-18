import { getFigmaFile } from "./src/figma/client";
import { findNodeById } from "./src/figma/node";

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_NODE_ID = process.env.FIGMA_NODE_ID;

main();

async function main() {
  console.log("Node に Variables 参照情報が含まれているか確認中...");
  console.log(`File ID: ${FIGMA_FILE_ID}`);
  console.log(`Node ID: ${FIGMA_NODE_ID}\n`);

  if (!FIGMA_FILE_ID || !FIGMA_NODE_ID) {
    console.error("エラー: FIGMA_FILE_ID または FIGMA_NODE_ID が設定されていません");
    process.exit(1);
  }

  try {
    const fileData = await getFigmaFile(FIGMA_FILE_ID);
    const targetNode = findNodeById(
      fileData.document,
      FIGMA_NODE_ID.replace("-", ":"),
    );

    if (!targetNode) {
      console.log(`⚠ ノードID "${FIGMA_NODE_ID}" が見つかりませんでした`);
      process.exit(1);
    }

    console.log("✓ ノード発見\n");
    console.log(`ノード名: ${targetNode.name}`);
    console.log(`タイプ: ${targetNode.type}\n`);

    // Variables 関連のプロパティを確認
    const variableRelatedKeys = [
      "boundVariables",
      "fills",
      "strokes",
      "effects",
      "backgroundColor",
      "characters",
    ];

    console.log("=== Variables 関連プロパティの確認 ===\n");

    for (const key of variableRelatedKeys) {
      if (targetNode[key]) {
        console.log(`✓ ${key} が存在:`);
        console.log(JSON.stringify(targetNode[key], null, 2));
        console.log("");
      }
    }

    // boundVariables が存在する場合は特に詳しく表示
    if (targetNode.boundVariables) {
      console.log("🎯 boundVariables を発見！");
      console.log("これが Variables への参照情報です：");
      console.log(JSON.stringify(targetNode.boundVariables, null, 2));
    } else {
      console.log("⚠ boundVariables プロパティは存在しません");
      console.log(
        "このノードは Variables にバインドされていないか、REST API では取得できない可能性があります\n",
      );
    }

    // File全体のキーも確認
    console.log("\n=== File Data のトップレベルキー ===");
    console.log(Object.keys(fileData).join(", "));

    // styles 情報の確認
    if (fileData.styles) {
      console.log("\n✓ styles 情報が存在します");
      console.log(
        `styles の数: ${Object.keys(fileData.styles).length} 個`,
      );
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}
