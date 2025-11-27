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
└── [domain].ts    # ドメイン層 (file.ts, node.ts, variable.ts, comment.ts など)
                   # - Figma固有のドメインモデルを反映
                   # - 各ファイルがAPIエンドポイントURLを持つ
                   # - 型定義 + 取得/表示関数
                   # - 実際のAPIアクセスは client.ts を経由
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
