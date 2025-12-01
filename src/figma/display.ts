// ============================================
// 型定義
// ============================================

/**
 * display() 関数のオプション
 */
export type DisplayOptions = {
  /** 先頭に表示するタイトル（例: "✓ Variables 取得成功"） */
  title?: string;
  /** 初期インデントレベル（デフォルト: 0） */
  indent?: number;
  /** 展開する最大深度（デフォルト: 無制限） */
  maxDepth?: number;
};

// ============================================
// 内部関数
// ============================================

/**
 * 値を再帰的に出力（内部関数）
 * @param value - 出力する値
 * @param indent - 現在のインデントレベル
 * @param currentDepth - 現在の深度
 * @param maxDepth - 最大深度（undefined で無制限）
 */
function printValue(
  value: unknown,
  indent: number,
  currentDepth: number,
  maxDepth?: number,
): void {
  const prefix = "  ".repeat(indent);

  // 最大深度に達した場合は JSON で出力
  if (maxDepth !== undefined && currentDepth >= maxDepth) {
    console.log(`${prefix}${JSON.stringify(value)}`);
    return;
  }

  // null / undefined
  if (value === null || value === undefined) {
    console.log(`${prefix}(empty)`);
    return;
  }

  // プリミティブ値
  if (typeof value !== "object") {
    console.log(`${prefix}${value}`);
    return;
  }

  // 配列
  if (Array.isArray(value)) {
    if (value.length === 0) {
      console.log(`${prefix}(empty array)`);
      return;
    }
    value.forEach((item, index) => {
      console.log(`${prefix}[${index}]:`);
      printValue(item, indent + 1, currentDepth + 1, maxDepth);
    });
    return;
  }

  // オブジェクト
  const entries = Object.entries(value);
  if (entries.length === 0) {
    console.log(`${prefix}(empty object)`);
    return;
  }

  for (const [key, val] of entries) {
    if (typeof val === "object" && val !== null) {
      console.log(`${prefix}${key}:`);
      printValue(val, indent + 1, currentDepth + 1, maxDepth);
    } else {
      console.log(`${prefix}${key}: ${JSON.stringify(val)}`);
    }
  }
}

// ============================================
// エクスポート関数
// ============================================

/**
 * 任意のデータを見やすく標準出力する
 *
 * - オブジェクト/配列は再帰的に展開
 * - インデントで階層を表現
 * - どんな型のデータでも表示可能
 *
 * @param data - 出力するデータ（任意の型）
 * @param options - 表示オプション
 *
 * @example
 * ```typescript
 * // ファイル情報
 * const fileData = await getFile(fileId);
 * display(fileData, { title: "✓ ファイル情報取得成功" });
 *
 * // Variables
 * const variables = await getFileVariables(fileId);
 * display(variables, { title: "✓ Variables 取得成功" });
 * ```
 */
export function display(data: unknown, options?: DisplayOptions): void {
  const { title, indent = 0, maxDepth } = options ?? {};

  if (title) {
    console.log(title);
  }

  printValue(data, indent, 0, maxDepth);
}
