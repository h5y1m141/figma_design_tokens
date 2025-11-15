/** biome-ignore-all lint/suspicious/noExplicitAny: Figma APIのレスポンス型定義は現時点では不要 */
export function findNodeById(node: any, targetId: string) {
  if (node.id === targetId) {
    return node;
  }

  if (!node.children) {
    return null;
  }

  return (
    node.children
      .map((child: any) => findNodeById(child, targetId))
      .find((result: any) => result !== null) ?? null
  );
}
export function displayFileInfo(fileData: any) {
  console.log("✓ ファイル情報取得成功");
  console.log(`  ファイル名: ${fileData.name}`);
  console.log(`  最終更新: ${fileData.lastModified}`);
  console.log(`  バージョン: ${fileData.version}\n`);
}
export function displayNodeInfo(node: any) {
  console.log("✓ 対象ノード発見");
  console.log(`  ノード名: ${node.name}`);
  console.log(`  タイプ: ${node.type}\n`);

  console.log("=== ノード詳細情報 ===");
  console.log(JSON.stringify(node, null, 2));
}
