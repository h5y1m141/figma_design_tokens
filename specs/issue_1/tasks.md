# Issue #1: Figmaの指定するプロジェクトのMeta情報を取得するスクリプト

## Issue概要

**タイトル**: Figmaの指定するプロジェクトのMeta情報を取得するスクリプト

**前提**:
- bunの環境は構築済み

**やりたいこと**:
- 任意のURLを指定してそのシートのMeta情報をREST API通じて取得する

**参照URL例**:
`https://www.figma.com/design/R7qHvI42pzxcnITlolkyVS/design-token?node-id=4-2&m=dev`

## 技術的アプローチ

### 使用する技術スタック
- **実行環境**: Bun
- **HTTPクライアント**: Bun標準の`fetch` API
- **認証**: Figma Personal Access Token（環境変数管理）
- **言語**: TypeScript

### Figma REST API仕様
- **エンドポイント**: `https://api.figma.com/v1/files/{file_key}`
- **認証ヘッダー**: `X-Figma-Token: {access_token}`
- **ドキュメント**: https://www.figma.com/developers/api

### URLから抽出する情報
- File ID: `R7qHvI42pzxcnITlolkyVS`
- Node ID: `4-2` (オプション)

## プロジェクト構成

```
figma_design_tokens/
├── index.ts              # エントリーポイント
├── src/
│   └── figma/
│       ├── client.ts     # Figma API クライアント
│       └── node.ts       # Figma Node操作
├── specs/
│   └── issue_1/
│       └── tasks.md
├── .env                  # 環境変数
├── package.json
└── tsconfig.json
```

### 構成の意図
- **index.ts**: エントリーポイントのみに集中。main関数とその呼び出しのみを記述
- **src/figma/client.ts**: Figma API通信のロジックを分離。再利用可能
- **src/figma/node.ts**: Figmaのノード操作（検索、表示等）を分離。ドメイン知識を反映

## 実装手順

### 1. 環境設定

#### 1.1 Figma Access Tokenの取得
1. Figmaにログイン
2. Settings → Account → Personal Access Tokens
3. 新しいトークンを生成
4. トークンをコピー

#### 1.2 環境変数の設定
`.env` ファイルを作成（既に`.gitignore`に含まれている）:

```bash
FIGMA_ACCESS_TOKEN=your_token_here
```

### 2. ディレクトリの作成

```bash
mkdir -p src/figma
```

### 3. 実装ファイル

#### 3.1 src/figma/client.ts - Figma APIクライアント

```typescript
/**
 * Figma API クライアント
 */

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_ACCESS_TOKEN) {
  console.error("エラー: FIGMA_ACCESS_TOKENが設定されていません");
  console.error(".envファイルに以下を追加してください:");
  console.error("FIGMA_ACCESS_TOKEN=your_token_here");
  process.exit(1);
}

/**
 * Figmaファイルのメタデータを取得
 */
export async function getFigmaFile(fileId: string) {
  const url = `https://api.figma.com/v1/files/${fileId}`;

  const response = await fetch(url, {
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API エラー: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
```

#### 3.2 src/figma/node.ts - Figma Node操作

```typescript
/**
 * Figma Node操作
 */

/**
 * 特定のノードを検索
 */
export function findNodeById(node: any, targetId: string): any {
  if (node.id === targetId) {
    return node;
  }

  if (!node.children) {
    return null;
  }

  return node.children
    .map((child: any) => findNodeById(child, targetId))
    .find((result: any) => result !== null) ?? null;
}

/**
 * ファイル情報を表示
 */
export function displayFileInfo(fileData: any) {
  console.log("✓ ファイル情報取得成功");
  console.log(`  ファイル名: ${fileData.name}`);
  console.log(`  最終更新: ${fileData.lastModified}`);
  console.log(`  バージョン: ${fileData.version}\n`);
}

/**
 * ノード情報を表示
 */
export function displayNodeInfo(node: any) {
  console.log("✓ 対象ノード発見");
  console.log(`  ノード名: ${node.name}`);
  console.log(`  タイプ: ${node.type}\n`);

  console.log("=== ノード詳細情報 ===");
  console.log(JSON.stringify(node, null, 2));
}
```

#### 3.3 index.ts - エントリーポイント

```typescript
import { getFigmaFile } from "./src/figma/client";
import { findNodeById, displayFileInfo, displayNodeInfo } from "./src/figma/node";

const FIGMA_FILE_ID = "R7qHvI42pzxcnITlolkyVS";
const FIGMA_NODE_ID = "4-2";

/**
 * メイン処理
 */
async function main() {
  console.log("Figmaデザインファイルを取得中...");
  console.log(`File ID: ${FIGMA_FILE_ID}`);
  console.log(`Node ID: ${FIGMA_NODE_ID}\n`);

  try {
    // ファイル全体を取得
    const fileData = await getFigmaFile(FIGMA_FILE_ID);

    // ファイル情報を表示
    displayFileInfo(fileData);

    // 指定されたノードを検索
    const targetNode = findNodeById(fileData.document, FIGMA_NODE_ID);

    if (targetNode) {
      displayNodeInfo(targetNode);
    } else {
      console.log(`⚠ ノードID "${FIGMA_NODE_ID}" が見つかりませんでした`);
    }

    // 全体のデータも表示（オプション）
    console.log("\n=== ファイル全体情報 ===");
    console.log(JSON.stringify(fileData, null, 2));

  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
```

### 4. 実行方法

```bash
# 実行
bun run index.ts

# または
bun index.ts
```

### 5. 期待される出力

```
Figmaデザインファイルを取得中...
File ID: R7qHvI42pzxcnITlolkyVS
Node ID: 4-2

✓ ファイル情報取得成功
  ファイル名: design-token
  最終更新: 2024-XX-XXTXX:XX:XX.XXXZ
  バージョン: XXXXXXXXX

✓ 対象ノード発見
  ノード名: [ノード名]
  タイプ: [ノードタイプ]

=== ノード詳細情報 ===
{
  "id": "4-2",
  "name": "...",
  ...
}

=== ファイル全体情報 ===
{
  "name": "design-token",
  "lastModified": "...",
  ...
}
```

## 実装チェックリスト

- [ ] `.env`ファイルを作成し、`FIGMA_ACCESS_TOKEN`を設定
- [ ] `src/figma`ディレクトリを作成
- [ ] `src/figma/client.ts`を実装（API通信ロジック）
- [ ] `src/figma/node.ts`を実装（Figma Node操作）
- [ ] `index.ts`を実装（エントリーポイント）
- [ ] `bun run index.ts`で実行
- [ ] ファイル情報が正しく取得できることを確認
- [ ] 指定したノード（node-id=4-2）の情報が取得できることを確認

## 今後の拡張案（オプション）

- [ ] コマンドライン引数でFile IDとNode IDを指定できるようにする
- [ ] 取得したデータをJSONファイルに保存する機能
- [ ] デザイントークンの抽出・変換機能
- [ ] 複数のノードを一括取得する機能

## 参考リンク

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Figma REST API - Files Endpoint](https://www.figma.com/developers/api#get-files-endpoint)
- [Bun Documentation](https://bun.sh/docs)
