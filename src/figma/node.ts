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
