import { fetchComments } from "./src/figma/comment";

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;

async function main() {
  if (!FIGMA_FILE_ID) {
    console.error("FIGMA_FILE_ID が設定されていません");
    process.exit(1);
  }
  const data = await fetchComments(FIGMA_FILE_ID);
  console.log(JSON.stringify(data, null, 2));
}

main();
