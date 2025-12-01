# Issue #8: ドメインモデルのリファクタリング

## 背景・目的

CLI 対応（`--type` オプション）を進める前に、各ドメインモデルを整理する。

---

## 現状分析

### 1. 命名規則の不統一

| ファイル | 現在の関数名 | 現在の型名 |
|----------|--------------|------------|
| `file.ts` | `getFile` | なし（`Promise<any>`） |
| `node.ts` | `findNodeById` | なし（全部 `any`） |
| `variable.ts` | `getFileVariables` | `FigmaXxx`, `GetVariablesResponse` |
| `comment.ts` | `fetchComments` | `FigmaXxxType`, `XxxType`, `CommentsResponse` |

**問題点:**
- 関数名: `getXxx` vs `fetchXxx` が混在
- 型名: `FigmaXxx` vs `XxxType` が混在

### 2. 型定義の欠如

| ファイル | 問題 |
|----------|------|
| `file.ts` | 戻り値が `Promise<any>` |
| `node.ts` | 引数・戻り値が全部 `any` |

### 3. node.ts の責務が曖昧

- `findNodeById` は API を叩かない（file データから検索するヘルパー）
- `--type=node` として単体で呼び出せない構造
- 現状は file.ts に依存している

### 4. 不要な JSDoc

```typescript
// ❌ 型定義があるのに JSDoc で重複説明
/**
 * Figma File を取得
 * @param fileId - Figma File ID
 * @returns File データ
 */
export async function getFile(fileId: string): Promise<any> {
```

### 5. variable.ts の冗長なコメント

```typescript
// ❌ セクション区切りコメントは不要
// ============================================
// 型定義
// ============================================
```

---

## リファクタリング計画

### Phase 1: 命名規則の統一

#### 関数名: `fetchXxx` に統一

| ファイル | Before | After |
|----------|--------|-------|
| `file.ts` | `getFile` | `fetchFile` |
| `variable.ts` | `getFileVariables` | `fetchVariables` |
| `comment.ts` | `fetchComments` | （変更なし） |

#### 型名: `XxxType` に統一

| ファイル | Before | After |
|----------|--------|-------|
| `variable.ts` | `FigmaResolvedType` | `ResolvedType` |
| `variable.ts` | `FigmaVariable` | `VariableType` |
| `variable.ts` | `FigmaMode` | `ModeType` |
| `variable.ts` | `FigmaVariableCollection` | `VariableCollectionType` |
| `variable.ts` | `GetVariablesResponse` | `VariablesResponseType` |
| `comment.ts` | `FigmaUserType` | `UserType` |
| `comment.ts` | `FigmaCommentType` | `CommentType` |
| `comment.ts` | `CommentsResponse` | `CommentsResponseType` |

### Phase 2: 型定義の追加

#### file.ts

```typescript
export type FileType = {
  name: string;
  lastModified: string;
  version: string;
  document: DocumentType;
  // 他のプロパティは必要に応じて追加
};

export type DocumentType = {
  id: string;
  name: string;
  type: string;
  children: NodeType[];
};
```

#### node.ts

```typescript
export type NodeType = {
  id: string;
  name: string;
  type: string;
  children?: NodeType[];
  // 共通プロパティのみ定義（ノードタイプごとの詳細は省略）
};
```

### Phase 3: node.ts の責務整理

**方針**: `findNodeById` はヘルパー関数として残す（API を叩く関数ではないため）

```typescript
// node.ts - ヘルパー関数のみ
export function findNodeById(node: NodeType, targetId: string): NodeType | null {
  // 実装は変更なし、型を追加
}
```

**将来の拡張**: `--type=node` が必要になったら、node 単体を取得する API 関数を追加

### Phase 4: 不要な JSDoc・コメントの削除

#### 削除対象

1. **file.ts**: JSDoc コメント削除
2. **variable.ts**:
   - セクション区切りコメント削除（`// ====...`）
   - 冗長な JSDoc 削除
3. **comment.ts**: 冗長な JSDoc 削除

#### 残す JSDoc

- 型だけでは意図が伝わらない場合（例: URL参照）
- 複雑なロジックの説明

```typescript
// ✅ 残す: 外部リファレンスへのリンク
/**
 * ref: https://www.figma.com/developers/api#variables-types
 */
export type ResolvedType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
```

### Phase 5: CLAUDE.md への反映

以下を「コーディング規約」セクションに追記:

```markdown
## コーディング規約

...（既存の内容）...

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| API 取得関数 | `fetchXxx` | `fetchFile`, `fetchVariables` |
| 型名 | `XxxType` | `FileType`, `VariableType` |
| レスポンス型 | `XxxResponseType` | `VariablesResponseType` |

### JSDoc

- 型定義で自明な場合は JSDoc 不要
- 外部リファレンスへのリンクは残す
- 複雑なロジックの説明は残す

### ロジック構成

データ加工と出力処理を分離する（2段構成）

```typescript
// ✅ OK: データ加工 → 出力処理
const filtered = items.filter((item) => item.active);
display(filtered);

// ❌ NG: for/forEach 内でデータ加工と出力が混在
items.forEach((item) => {
  if (item.active) console.log(item);
});
```
```

---

## タスク一覧

### Phase 1: 命名規則の統一
- [ ] `file.ts`: `getFile` → `fetchFile` にリネーム
- [ ] `variable.ts`: `getFileVariables` → `fetchVariables` にリネーム
- [ ] `variable.ts`: 型名を `XxxType` 形式に統一
- [ ] `comment.ts`: 型名を `XxxType` 形式に統一（`Figma` プレフィックス削除）
- [ ] `index.ts`: 関数名変更に伴う呼び出し箇所の修正

### Phase 2: 型定義の追加
- [ ] `file.ts`: `FileType`, `DocumentType` を定義
- [ ] `node.ts`: `NodeType` を定義、`any` を置き換え

### Phase 3: node.ts の責務整理
- [ ] `findNodeById` に型を追加（引数・戻り値）
- [ ] biome-ignore コメントを削除

### Phase 4: 不要な JSDoc・コメントの削除
- [ ] `file.ts`: JSDoc 削除
- [ ] `variable.ts`: セクション区切りコメント削除、冗長な JSDoc 削除
- [ ] `comment.ts`: 冗長な JSDoc 削除

### Phase 5: CLAUDE.md への反映
- [ ] 命名規則を追記
- [ ] JSDoc ルールを追記
- [ ] ロジック構成ルールを追記

### Phase 6: 検証
- [ ] `bun run index.ts` で動作確認
- [ ] `bunx biome check --write .` でフォーマット確認

---

## ファイル変更一覧

| ファイル | 変更内容 |
|----------|----------|
| `src/figma/file.ts` | 関数名変更、型定義追加、JSDoc 削除 |
| `src/figma/node.ts` | 型定義追加、biome-ignore 削除 |
| `src/figma/variable.ts` | 関数名変更、型名変更、コメント整理 |
| `src/figma/comment.ts` | 型名変更、JSDoc 整理 |
| `index.ts` | 関数名変更に伴う修正 |
| `CLAUDE.md` | コーディング規約追記 |

---

## 確認事項（レビュー時）

- [ ] 関数名 `fetchXxx` への統一で良いか？（`getXxx` の方が好みなら変更可）
- [ ] 型名から `Figma` プレフィックスを削除して良いか？
- [ ] `node.ts` の `findNodeById` はヘルパーとして残す方針で良いか？
- [ ] セクション区切りコメント（`// ====...`）は削除して良いか？
