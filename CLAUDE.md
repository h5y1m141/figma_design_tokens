# Figma Design Tokens

Figma REST API にアクセスしてデザイントークンを取得するツール

## 実行環境

- **ランタイム**: Bun
- **将来の展開**: Claude Code Skills として動作予定

## アーキテクチャ

```
src/figma/
├── client.ts      # HTTP Client層
│                  # - Figma REST API アクセスの基盤
│                  # - get(), post() などの汎用メソッド
│                  # - 認証ヘッダーの付与、エラーハンドリング
│                  # - エンドポイントURLは持たない
│
├── display.ts     # 出力層
│                  # - 汎用的な display() 関数を提供
│                  # - 任意の型のデータを Key/Value 形式で標準出力
│                  # - ドメインごとの displayXxx() は作らない設計
│
└── [domain].ts    # ドメイン層 (file.ts, node.ts, variable.ts, comment.ts など)
                   # - Figma固有のドメインモデルを反映
                   # - 各ファイルがAPIエンドポイントURLを持つ
                   # - 型定義 + データ取得関数
                   # - 実際のAPIアクセスは client.ts を経由
                   # - 表示は display.ts の display() を使用
```

## 技術的制約

- **標準ライブラリのみ使用**（外部パッケージ依存なし）
- 理由: TypeScript → JavaScript 変換して Claude Code Skills として使用予定
- `fetch` など標準APIのみで実装すること

## コーディング規約

Biome を使用してフォーマット＆リントを行う

| 項目 | 設定 |
|------|------|
| インデント | スペース 2文字 |
| 行幅 | 80文字 |
| クォート | ダブルクォート (`"`) |
| Linter | recommended ルール |
| import整理 | 自動 |

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| API 取得関数 | `fetchXxx` | `fetchFile`, `fetchVariables` |
| 型名 | `XxxType` | `FileType`, `VariableType` |
| レスポンス型 | `XxxResponseType` | `VariablesResponseType` |

### JSDoc

- 型定義で自明な場合は JSDoc 不要
- 外部リファレンスへのリンクは残す（例: Figma API ドキュメントへの参照）
- 複雑なロジックの説明は残す

### ロジック構成

データ加工と出力処理を分離する（2段構成）

```typescript
// OK: データ加工 → 出力処理
const filtered = items.filter((item) => item.active);
display(filtered);

// NG: for/forEach 内でデータ加工と出力が混在
items.forEach((item) => {
  if (item.active) console.log(item);
});
```

## コマンド

```bash
# メイン実行
bun run index.ts

# フォーマット＆リント修正
bunx biome check --write .
```

## 環境変数

`.env` ファイルに以下を設定:

```
FIGMA_ACCESS_TOKEN=your_token_here
FIGMA_FILE_ID=your_file_id
FIGMA_NODE_ID=your_node_id
```
