import { parseArgs } from "node:util";
import { fetchComments } from "./src/figma/comment";
import { display } from "./src/figma/display";
import { fetchFile } from "./src/figma/file";
import { findNodeById } from "./src/figma/node";
import { fetchVariables } from "./src/figma/variable";

type CommandType = "comment" | "variable" | "file" | "node";

type ParsedArgs = {
  type: CommandType;
  nodeId?: string;
};

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    options: {
      type: { type: "string", short: "t" },
      "node-id": { type: "string" },
    },
  });

  const type = values.type as CommandType;
  if (!type) {
    console.error("Error: --type オプションは必須です");
    console.error("使用可能な type: comment, variable, file, node");
    process.exit(1);
  }

  const validTypes = ["comment", "variable", "file", "node"];
  if (!validTypes.includes(type)) {
    console.error(`Error: 無効な type: ${type}`);
    console.error("使用可能な type: comment, variable, file, node");
    process.exit(1);
  }

  return {
    type,
    nodeId: values["node-id"] as string | undefined,
  };
}

async function handleComment(fileId: string): Promise<void> {
  const response = await fetchComments(fileId);
  display(response, { title: "✓ コメント取得成功" });
}

async function handleVariable(fileId: string): Promise<void> {
  const response = await fetchVariables(fileId);
  display(response, { title: "✓ Variables 取得成功" });
}

async function handleFile(fileId: string): Promise<void> {
  const response = await fetchFile(fileId);
  display(response, { title: "✓ ファイル情報取得成功" });
}

async function handleNode(fileId: string, nodeId?: string): Promise<void> {
  if (!nodeId) {
    console.error("Error: --type=node には --node-id オプションが必須です");
    process.exit(1);
  }

  const fileData = await fetchFile(fileId);
  const normalizedNodeId = nodeId.replace("-", ":");
  const node = findNodeById(fileData.document, normalizedNodeId);

  if (!node) {
    console.error(`Error: ノードID "${nodeId}" が見つかりませんでした`);
    process.exit(1);
  }

  display(node, { title: "✓ ノード取得成功" });
}

async function main() {
  const args = parseCliArgs();
  const fileId = process.env.FIGMA_FILE_ID;

  if (!fileId) {
    console.error("Error: FIGMA_FILE_ID 環境変数が設定されていません");
    process.exit(1);
  }

  switch (args.type) {
    case "comment":
      await handleComment(fileId);
      break;
    case "variable":
      await handleVariable(fileId);
      break;
    case "file":
      await handleFile(fileId);
      break;
    case "node":
      await handleNode(fileId, args.nodeId);
      break;
  }
}

main();
