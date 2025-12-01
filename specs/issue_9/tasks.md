# Issue #9: CLI ツールとして index.ts を拡張（--type オプション対応）

## 背景・目的

毎回 `check_xx.ts` を作成して動作確認するのは非効率。
`index.ts` を CLI ツールとして拡張し、コマンドライン引数で処理を切り替えられるようにする。

**ゴール**: `--type` オプションで取得するデータ種別を指定できるようにする

---

## 前提条件

- #8 ドメインモデルのリファクタリング が完了していること ✅

---

## 実装イメージ

```bash
# コメント取得
bun run ./index.ts --type=comment

# Variables取得
bun run ./index.ts --type=variable

# ファイル情報取得
bun run ./index.ts --type=file

# ノード取得
bun run ./index.ts --type=node --node-id=xxx
```

---

## 現状分析

### 現在の index.ts

```typescript
import { display } from "./src/figma/display";
import { fetchFile } from "./src/figma/file";
import { findNodeById } from "./src/figma/node";

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_NODE_ID = process.env.FIGMA_NODE_ID;

main();
async function main() {
  // ファイル取得 + ノード検索のみ（ハードコード）
}
```

**問題点:**
- 処理がハードコードされている
- comment, variable の取得には別ファイル（check_xx.ts）が必要
- 柔軟性がない

### 削除対象ファイル

| ファイル | 用途 | 対応 |
|----------|------|------|
| `check_comments.ts` | コメント取得確認 | 削除（`--type=comment` で代替） |
| `check_node_variables.ts` | Variables取得確認 | 削除（`--type=variable` で代替） |

---

## 技術方針

### `util.parseArgs` の使用

Node.js/Bun 標準ライブラリを使用（外部依存なし）

```typescript
import { parseArgs } from "util";

const { values } = parseArgs({
  options: {
    type: { type: "string", short: "t" },
    "node-id": { type: "string" },
  },
});
```

### 出力方法

- 統一して `JSON.stringify()` で出力
- display層（#7）は今後対応するため、現時点では JSON 出力のみ

---

## 実装計画

### Phase 1: 引数パース処理の実装

`util.parseArgs` を使って CLI 引数を解析する。

```typescript
import { parseArgs } from "util";

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
```

### Phase 2: type に応じた処理の振り分け

各 type に応じて適切な関数を呼び出す。

```typescript
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
```

### Phase 3: 各ハンドラーの実装

```typescript
import { fetchComments } from "./src/figma/comment";
import { fetchFile } from "./src/figma/file";
import { findNodeById } from "./src/figma/node";
import { fetchVariables } from "./src/figma/variable";

async function handleComment(fileId: string): Promise<void> {
  const response = await fetchComments(fileId);
  console.log(JSON.stringify(response, null, 2));
}

async function handleVariable(fileId: string): Promise<void> {
  const response = await fetchVariables(fileId);
  console.log(JSON.stringify(response, null, 2));
}

async function handleFile(fileId: string): Promise<void> {
  const response = await fetchFile(fileId);
  console.log(JSON.stringify(response, null, 2));
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

  console.log(JSON.stringify(node, null, 2));
}
```

### Phase 4: 不要ファイルの削除

- `check_comments.ts` を削除
- `check_node_variables.ts` を削除

### Phase 5: 検証

各 type での動作確認:

```bash
# コメント取得
bun run ./index.ts --type=comment

# Variables取得
bun run ./index.ts --type=variable

# ファイル情報取得
bun run ./index.ts --type=file

# ノード取得
bun run ./index.ts --type=node --node-id=xxx
```

---

## タスク一覧

### Phase 1: 引数パース処理の実装
- [ ] `util.parseArgs` を使った引数解析処理を実装
- [ ] `CommandType` 型を定義
- [ ] バリデーション（必須チェック、有効な type チェック）を実装
- [ ] エラー時のヘルプメッセージを表示

### Phase 2: 処理振り分けの実装
- [ ] `main()` 関数を switch 文で type ごとに振り分け
- [ ] `FIGMA_FILE_ID` 環境変数の必須チェック

### Phase 3: 各ハンドラーの実装
- [ ] `handleComment()` を実装
- [ ] `handleVariable()` を実装
- [ ] `handleFile()` を実装
- [ ] `handleNode()` を実装（--node-id 必須チェック含む）

### Phase 4: 不要ファイルの削除
- [ ] `check_comments.ts` を削除
- [ ] `check_node_variables.ts` を削除

### Phase 5: 検証
- [ ] `--type=comment` で動作確認
- [ ] `--type=variable` で動作確認
- [ ] `--type=file` で動作確認
- [ ] `--type=node --node-id=xxx` で動作確認
- [ ] `bunx biome check --write .` でフォーマット確認

---

## ファイル変更一覧

| ファイル | 変更内容 |
|----------|----------|
| `index.ts` | CLI引数パース、type振り分け、各ハンドラー実装 |
| `check_comments.ts` | **削除** |
| `check_node_variables.ts` | **削除** |

---

## 設計判断

### handleXxx 関数の配置場所

`index.ts` に直接記述する。

**理由:**
- 各ハンドラーは fetch → JSON 出力のシンプルな処理（4〜10行程度）
- CLI エントリーポイントとして index.ts に集約するのが自然
- 将来的にハンドラーが増えて肥大化したら `src/handlers.ts` 等への分離を検討

---

## 設計上の注意点

1. **標準ライブラリのみ使用**: `util.parseArgs` を使用（外部CLIパーサー不使用）
2. **JSON出力で統一**: display層は別Issue（#7）で対応予定
3. **エラーハンドリング**: 適切なエラーメッセージと exit code を返す
4. **node-id の正規化**: ハイフン（`-`）をコロン（`:`）に変換する処理を維持

---

## 確認事項（レビュー時）

- [ ] `--type` オプションの命名は適切か？（`-t` ショートオプションも対応）
- [ ] `--node-id` の命名は適切か？（ケバブケースで統一）
- [ ] 出力を JSON.stringify で統一する方針で良いか？
- [ ] エラー時の exit code は 1 で統一して良いか？
- [ ] 将来的に `--help` オプションを追加する必要はあるか？（今回のスコープ外とする想定）
