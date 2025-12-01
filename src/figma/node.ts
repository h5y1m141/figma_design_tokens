export type NodeType = {
  id: string;
  name: string;
  type: string;
  children?: NodeType[];
  [key: string]: unknown;
};

export function findNodeById(
  node: NodeType,
  targetId: string,
): NodeType | null {
  if (node.id === targetId) {
    return node;
  }

  if (!node.children) {
    return null;
  }

  return (
    node.children
      .map((child) => findNodeById(child, targetId))
      .find((result) => result !== null) ?? null
  );
}
