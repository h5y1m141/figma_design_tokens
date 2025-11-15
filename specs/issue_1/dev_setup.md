# 開発環境セットアップ: Biome導入

## Biomeとは

Biomeは、JavaScriptとTypeScript向けの高速なフォーマッター・リンターです。
- ESLintとPrettierの代替として、単一ツールでフォーマットとリントを実行
- Rustで書かれており、非常に高速
- 設定がシンプル

## 導入手順

### 1. Biomeのインストール

```bash
bun add --dev @biomejs/biome
```

### 2. biome.jsonの配置

プロジェクトルートに`biome.json`を作成:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.4/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": false
  },
  "files": {
    "ignoreUnknown": false
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80,
    "formatWithErrors": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

### 設定内容の説明

- **formatter**: インデント2スペース、行幅80文字、ダブルクォート使用
- **linter**: 推奨ルールを有効化
- **assist**: import文の自動整理を有効化

### 3. package.jsonへのスクリプト追加

`package.json`に以下のスクリプトを追加:

```json
{
  "scripts": {
    "format": "biome format --write .",
    "lint": "biome lint .",
    "check": "biome check --write .",
    "ci": "biome ci ."
  }
}
```

各コマンドの説明:
- `format`: ファイルをフォーマットして上書き
- `lint`: リントチェックのみ実行
- `check`: フォーマット + リント + import整理を実行して上書き
- `ci`: CI用のチェック（変更なし）

## 使い方

### フォーマット実行

```bash
# 全ファイルをフォーマット
bun run format

# または
bunx biome format --write .
```

### リントチェック

```bash
# リントエラーを確認
bun run lint

# リントエラーを自動修正
bunx biome lint --write .
```

### フォーマット + リント + import整理

```bash
# 推奨: すべてを一度に実行
bun run check
```

### 特定のファイルのみ実行

```bash
# index.tsのみフォーマット
bunx biome format --write index.ts

# src/配下のみチェック
bunx biome check --write src/
```

## エディタ統合（オプション）

### VSCode

1. Biome拡張機能をインストール
   - 拡張機能ID: `biomejs.biome`

2. `.vscode/settings.json`を作成（プロジェクトルート）:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

これで保存時に自動フォーマットされます。

## セットアップ確認

### チェックリスト

- [ ] `@biomejs/biome`をdevDependenciesにインストール
- [ ] `biome.json`をプロジェクトルートに配置
- [ ] `package.json`にスクリプトを追加
- [ ] `bun run format`を実行してエラーが出ないことを確認
- [ ] 既存のTypeScriptファイルがフォーマットされることを確認

### 動作確認

```bash
# インストール確認
bunx biome --version

# 設定ファイルの検証
bunx biome check --help

# 実際にフォーマット実行
bun run check
```

## トラブルシューティング

### エラー: "biome: command not found"

```bash
# 再インストール
bun add --dev @biomejs/biome

# またはbunxで直接実行
bunx biome format --write .
```

### 特定のファイルを無視したい

`biome.json`に`files.ignore`を追加:

```json
{
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "node_modules",
      "dist",
      "*.min.js"
    ]
  }
}
```

## 参考リンク

- [Biome公式ドキュメント](https://biomejs.dev/)
- [Biome - Getting Started](https://biomejs.dev/guides/getting-started/)
- [Biome - Configuration](https://biomejs.dev/reference/configuration/)
