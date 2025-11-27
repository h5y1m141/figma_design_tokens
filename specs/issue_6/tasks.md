# Issue #6: page内に存在するコメントの取得

## 概要

Figma ファイル内のコメントを取得する機能を実装する。

## 実装ファイル

`src/figma/comment.ts` を新規作成

## 実装コード

```typescript
import { get } from "./client";

// ============================================
// 型定義
// ============================================

/**
 * コメントしたユーザー情報
 */
export type FigmaUser = {
  id: string;
  handle: string;
  img_url: string;
};

/**
 * コメントの位置情報（ノードに紐づく場合）
 */
export type FrameOffset = {
  node_id: string;
  node_offset: {
    x: number;
    y: number;
  };
};

/**
 * コメントの位置情報（キャンバス上の絶対座標）
 */
export type Region = {
  x: number;
  y: number;
  region_height: number;
  comment_pin_corner: string;
};

/**
 * コメントの client_meta（位置情報）
 */
export type ClientMeta = FrameOffset | Region;

/**
 * Figma コメントの型定義
 * ref: https://www.figma.com/developers/api#comments-types
 */
export type FigmaComment = {
  id: string;
  uuid?: string;
  file_key: string;
  parent_id: string;
  user: FigmaUser;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: ClientMeta | null;
  order_id: string;
};

/**
 * GET /v1/files/:file_key/comments のレスポンス
 */
export type GetCommentsResponse = {
  comments: FigmaComment[];
};

// ============================================
// 関数
// ============================================

/**
 * Figma File のコメントを取得
 * @param fileId - Figma File ID
 * @returns Comments データ
 */
export async function getComments(
  fileId: string
): Promise<GetCommentsResponse> {
  return await get(`files/${fileId}/comments`);
}

/**
 * コメントを見やすく表示
 * @param commentsData - getComments() のレスポンス
 */
export function displayComments(commentsData: GetCommentsResponse): void {
  const { comments } = commentsData;

  console.log(`✓ コメント取得成功（${comments.length}件）\n`);

  if (comments.length === 0) {
    console.log("コメントはありません");
    return;
  }

  // 親コメント（parent_id が空）とリプライを分離
  const parentComments = comments.filter((c) => c.parent_id === "");
  const replies = comments.filter((c) => c.parent_id !== "");

  parentComments.forEach((comment) => {
    const resolvedMark = comment.resolved_at ? "✅" : "💬";
    console.log(`${resolvedMark} ${comment.user.handle}`);
    console.log(`   "${comment.message}"`);
    console.log(`   ID: ${comment.id}`);
    console.log(`   作成日時: ${comment.created_at}`);

    // ノードに紐づいている場合
    if (comment.client_meta && "node_id" in comment.client_meta) {
      console.log(`   ノードID: ${comment.client_meta.node_id}`);
    }

    // このコメントへのリプライを表示
    replies
      .filter((r) => r.parent_id === comment.id)
      .forEach((reply) => {
        console.log(`   ↳ ${reply.user.handle}: "${reply.message}"`);
      });

    console.log("");
  });
}

/**
 * コメントの詳細情報を JSON で表示
 * @param commentsData - getComments() のレスポンス
 */
export function displayCommentsJSON(commentsData: GetCommentsResponse): void {
  console.log("=== Comments 詳細情報（JSON） ===");
  console.log(JSON.stringify(commentsData, null, 2));
}
```

## 使用例

```typescript
import { getComments, displayComments } from "./src/figma/comment";

const fileId = process.env.FIGMA_FILE_ID;

async function main() {
  const commentsData = await getComments(fileId);
  displayComments(commentsData);
}

main();
```

## API エンドポイント

- **URL**: `GET /v1/files/:file_key/comments`
- **ドキュメント**: https://www.figma.com/developers/api#get-comments-endpoint

## 実装のポイント

| 項目 | 説明 |
|------|------|
| エンドポイント | `files/${fileId}/comments` |
| 型定義 | Figma API ドキュメントに基づく |
| displayComments | 親コメントとリプライを階層表示、解決済みは ✅ マーク |
| 既存パターン踏襲 | `variable.ts` と同じ構造（型定義 + get関数 + display関数） |

## チェックリスト

- [ ] `src/figma/comment.ts` を作成
- [ ] `bunx biome check --write .` でフォーマット
- [ ] 動作確認
