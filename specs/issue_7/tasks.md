# Issue #7: display層の設計・実装（出力ロジックの共通化）

## 背景・目的

現在の `displayXxx()` 系の関数には以下の問題がある：

- 表示に必要なデータ加工と実際の出力（console.log）が入り乱れていて読みづらい
- 各ドメインモジュール（variable.ts, node.ts など）に出力ロジックが散在している
- 再利用性が低く、テストしにくい
- **ドメインモデルが増えるたびに displayXxx() を作らないといけない**

**ゴール**: `src/figma/display.ts` を新規作成し、**汎用的な表示関数**を実装する

---

## 設計方針

### 重要な要件

1. **ドメインごとの displayXxx() は作らない**
   - ❌ `displayFileInfo()`, `displayVariables()`, `displayComments()` を個別に作る
   - ✅ `display()` 1つで、どんな型のデータでも表示できるようにする

2. **汎用的なアプローチ**
   - 引数で Node型、Variable型、Comment型... など任意のデータを受け取る
   - 型に応じて適切に表示する（または Key/Value をそのまま出力）

3. **シンプルさ優先**
   - ロジックが複雑になるなら、Key/Value をオブジェクト構造でそのまま出力するだけでもOK

---

## 現状分析

### 削除対象の既存 display 系関数

| ファイル | 関数名 | 対応 |
|----------|--------|------|
| `node.ts` | `displayFileInfo()` | 削除 → `display()` で置き換え |
| `node.ts` | `displayNodeInfo()` | 削除 → `display()` で置き換え |
| `variable.ts` | `displayVariables()` | 削除 → `display()` で置き換え |
| `variable.ts` | `displayVariablesJSON()` | 削除 → `display()` で置き換え |

---

## 実装計画

### アプローチ案

#### 案A: 型判別による分岐（複雑）

```typescript
export function display(data: unknown): void {
  if (isFileData(data)) { /* ファイル用の表示 */ }
  else if (isVariablesResponse(data)) { /* Variables用の表示 */ }
  else if (isCommentsResponse(data)) { /* Comments用の表示 */ }
  else { /* デフォルト: Key/Value出力 */ }
}
```

→ 型が増えるたびに分岐が増えるので微妙

#### 案B: Key/Value の再帰的表示（シンプル・推奨）

```typescript
/**
 * 任意のオブジェクトを見やすく標準出力する
 * - オブジェクト/配列は再帰的に展開
 * - インデントで階層を表現
 */
export function display(data: unknown, options?: DisplayOptions): void {
  // 再帰的に Key/Value を出力
}

type DisplayOptions = {
  title?: string;      // 先頭に表示するタイトル（例: "✓ Variables 取得成功"）
  indent?: number;     // 初期インデント（デフォルト: 0）
  maxDepth?: number;   // 展開する最大深度（デフォルト: 無制限）
};
```

**使用例:**
```typescript
import { display } from "./display";

// ファイル情報
const fileData = await getFile(fileId);
display(fileData, { title: "✓ ファイル情報取得成功" });

// Variables
const variables = await getFileVariables(fileId);
display(variables, { title: "✓ Variables 取得成功" });

// Comments
const comments = await fetchComments(fileId);
display(comments, { title: "✓ コメント取得成功" });
```

**出力イメージ:**
```
✓ ファイル情報取得成功
  name: "Design System"
  lastModified: "2024-01-15T10:30:00Z"
  version: "123456789"

✓ Variables 取得成功
  meta:
    variables:
      VariableID:xxxx:
        id: "VariableID:xxxx"
        name: "primary-color"
        resolvedType: "COLOR"
        valuesByMode:
          ModeID:yyyy:
            r: 0.2
            g: 0.4
            b: 0.8
            a: 1
```

---

### 実装詳細

**ファイル**: `src/figma/display.ts`

```typescript
type DisplayOptions = {
  title?: string;
  indent?: number;
  maxDepth?: number;
};

/**
 * 任意のデータを見やすく標準出力する
 */
export function display(data: unknown, options?: DisplayOptions): void {
  const { title, indent = 0 } = options ?? {};

  if (title) {
    console.log(title);
  }

  printValue(data, indent);
}

/**
 * 値を再帰的に出力（内部関数）
 */
function printValue(value: unknown, indent: number, maxDepth?: number): void {
  const prefix = "  ".repeat(indent);

  if (value === null || value === undefined) {
    console.log(`${prefix}(empty)`);
    return;
  }

  if (typeof value !== "object") {
    // プリミティブ値
    console.log(`${prefix}${value}`);
    return;
  }

  if (Array.isArray(value)) {
    // 配列
    value.forEach((item, index) => {
      console.log(`${prefix}[${index}]:`);
      printValue(item, indent + 1, maxDepth);
    });
    return;
  }

  // オブジェクト
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "object" && val !== null) {
      console.log(`${prefix}${key}:`);
      printValue(val, indent + 1, maxDepth);
    } else {
      console.log(`${prefix}${key}: ${JSON.stringify(val)}`);
    }
  }
}
```

---

## タスク一覧

### Phase 1: display.ts の作成
- [ ] `src/figma/display.ts` を新規作成
- [ ] `DisplayOptions` 型を定義
- [ ] `display()` 関数を実装（汎用的な Key/Value 出力）
- [ ] `printValue()` 内部関数を実装（再帰処理）

### Phase 2: 既存の displayXxx 関数を削除・置き換え
- [ ] `node.ts`: `displayFileInfo()`, `displayNodeInfo()` を削除
- [ ] `variable.ts`: `displayVariables()`, `displayVariablesJSON()` を削除
- [ ] `index.ts`: 呼び出し箇所を `display()` に置き換え

### Phase 3: 検証・ドキュメント
- [ ] `bun run index.ts` で動作確認
- [ ] `bunx biome check --write .` でフォーマット確認
- [ ] CLAUDE.md のアーキテクチャ図を更新

---

## ファイル変更一覧

| ファイル | 変更内容 |
|----------|----------|
| `src/figma/display.ts` | **新規作成** - 汎用的な display() 関数 |
| `src/figma/node.ts` | `displayFileInfo()`, `displayNodeInfo()` を**削除** |
| `src/figma/variable.ts` | `displayVariables()`, `displayVariablesJSON()` を**削除** |
| `index.ts` | display() を使うように修正 |
| `CLAUDE.md` | アーキテクチャ図の更新 |

---

## 設計上の注意点

1. **標準ライブラリのみ使用**: 外部パッケージは使わない（Claude Code Skills 対応のため）
2. **シンプルさ優先**: 複雑な型判別より、Key/Value の再帰出力でシンプルに
3. **既存関数は削除**: リファクタリングではなく、置き換え

---

## 確認事項（レビュー時）

- [ ] 案B（Key/Value の再帰的表示）のアプローチで良いか？
- [ ] `DisplayOptions` に他に必要なオプションはあるか？
- [ ] 出力フォーマット（インデント幅、区切り文字など）はこれで良いか？
