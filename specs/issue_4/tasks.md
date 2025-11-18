# Issue #4: ツールを通じて任意のvariablesを設定できるようにする

## 概要

Issue #1 で実装した基本構造を拡張し、Figma の Variables（デザイントークン）を取得・設定する機能を追加する。

## 実装の基本方針

### アーキテクチャ原則

明確な責任範囲の分離により、保守性と拡張性を確保する：

#### レイヤー構造
```
CLI層
  ↓
Domain層 (file.ts, node.ts, variable.ts)
  ↓
Infrastructure層 (client.ts)
```

#### 各ファイルの責務

**`src/figma/client.ts`** - HTTPクライアント層
- Figma API への HTTP リクエスト処理を担当
- **PersonalAccessToken の読み込みはこのファイルのみ**
- 汎用的な `get()`, `post()` などの HTTP メソッドを提供
- 認証ヘッダーの付与とエラーハンドリング
- ビジネスロジックは持たない（純粋なHTTPクライアント）

**`src/figma/file.ts`** - File取得層（新規作成）
- `client.ts` を通じて Figma File 情報を取得
- File 関連の API エンドポイントを抽象化
- File データの型定義とパース処理
- 他のドメイン層（node, variable）の基盤となる

**`src/figma/node.ts`** - Node処理層
- `file.ts` から取得した File 情報を基に Node を参照・操作
- Node の検索、フィルタリング、表示処理
- Node 固有のビジネスロジック

**`src/figma/variable.ts`** - Variable処理層（新規作成）
- `file.ts` から取得した File 情報を基に Variables を参照・操作
- Variables の取得、作成、更新処理
- Variable 固有のビジネスロジック

### 設計原則
- **単一責任の原則**: 各ファイルは1つの責務のみを持つ
- **依存関係の明確化**: Domain層 → Infrastructure層の一方向依存
- **テスタビリティ**: client.ts をモック化することで Domain層のテストが容易

## タスク一覧

### Phase 0: アーキテクチャのリファクタリング

既存コードを新しいアーキテクチャに適合させる。

#### Task 0.1: 既存コードの分析
- [ ] 現在の `client.ts` の `getFigmaFile()` 関数を確認
- [ ] `node.ts` の現在の依存関係を確認
- [ ] 既存の CLI 層（index.ts など）の実装を確認

#### Task 0.2: `client.ts` のリファクタリング
- [ ] 汎用的な HTTP クライアントとして再設計
  ```typescript
  // 汎用的な HTTP メソッドを提供
  export async function get(endpoint: string): Promise<any>
  export async function post(endpoint: string, body: any): Promise<any>
  ```
- [ ] PersonalAccessToken の読み込みと管理
- [ ] 認証ヘッダーの自動付与
- [ ] エラーハンドリングの統一

#### Task 0.3: `file.ts` の新規作成
- [ ] ファイル作成と基本構造の定義
- [ ] `client.ts` を使った File 取得関数の実装
  ```typescript
  import { get } from './client';

  export async function getFile(fileId: string) {
    return await get(`files/${fileId}`);
  }
  ```
- [ ] 既存の `getFigmaFile()` ロジックを移行
- [ ] File データの型定義
  - `type` を使用（今後の一貫性のため）
  - 必要に応じて Union Type を活用
  - 現時点では `any` でも可（段階的な型付けを許容）

#### Task 0.4: `node.ts` のリファクタリング
- [ ] `file.ts` への依存に変更
- [ ] File データを引数として受け取るように変更
  ```typescript
  // Before: 直接 API を呼ぶ
  // After: File データを受け取る
  export function findNodeById(fileData: any, targetId: string)
  export function displayFileInfo(fileData: any)
  ```

#### Task 0.5: 既存の CLI 層の更新
- [ ] `file.ts` をインポート
- [ ] `getFile()` を使うように変更
- [ ] 動作確認

### Phase 1: 調査・設計（事前準備）

#### Task 1.1: Figma Variables API の調査
- [ ] [Figma Variables REST API](https://www.figma.com/developers/api#variables) のドキュメント確認
- [ ] エンドポイント仕様の理解
  - GET `/v1/files/:file_key/variables/local` - ローカル変数の取得
  - POST `/v1/files/:file_key/variables` - 変数の作成・更新
- [ ] リクエスト・レスポンス形式の確認
- [ ] 必要な権限とアクセストークンの確認
- [ ] Variables が File データに含まれるか、別エンドポイントか確認

#### Task 1.2: データ構造の設計
- [ ] Variable の型定義設計
  - `type` を使用（`interface` ではなく）
  - `resolvedType` は Union Type で厳密に定義
  - その他の固定値も可能な限り Union Type にする
- [ ] VariableCollection の型定義設計
  - Mode の型定義も含める
  - API レスポンス全体の型定義も作成
- [ ] file.ts との連携方法の検討
- [ ] 型安全性のガイドライン策定
  - Figma API のドキュメントから正確な値を抽出
  - `string` や `any` を避け、具体的な Union Type を優先
  - オプショナルプロパティの明確化

### Phase 2: Variables 機能の実装

#### Task 2.1: `src/figma/variable.ts` の作成
- [ ] ファイル作成と基本構造の定義
- [ ] 型定義の追加（厳密な Union Type を使用）
  ```typescript
  // Figma Variables の resolvedType
  // ref: https://www.figma.com/developers/api#variables-types
  type FigmaResolvedType = 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';

  // Variable の値の型（resolvedType に応じて異なる）
  type VariableValue =
    | boolean  // BOOLEAN
    | number   // FLOAT
    | string   // STRING
    | { r: number; g: number; b: number; a: number }  // COLOR (RGBA)
    | { type: 'VARIABLE_ALIAS'; id: string };  // 他の変数への参照

  // Variable の型定義（type を使用）
  type FigmaVariable = {
    id: string;
    name: string;
    key: string;
    variableCollectionId: string;
    resolvedType: FigmaResolvedType;
    valuesByMode: Record<string, VariableValue>;
    // オプショナルなプロパティ
    remote?: boolean;
    description?: string;
    hiddenFromPublishing?: boolean;
    scopes?: VariableScope[];
  };

  // Variable の適用範囲
  type VariableScope =
    | 'ALL_SCOPES'
    | 'TEXT_CONTENT'
    | 'TEXT_FILL'
    | 'FRAME_FILL'
    | 'SHAPE_FILL'
    | 'STROKE_COLOR'
    | 'EFFECT_COLOR'
    | 'WIDTH_HEIGHT'
    | 'GAP'
    | 'CORNER_RADIUS';

  // Mode の型定義
  type FigmaMode = {
    modeId: string;
    name: string;
  };

  // VariableCollection の型定義（type を使用）
  type FigmaVariableCollection = {
    id: string;
    name: string;
    modes: FigmaMode[];
    defaultModeId: string;
    remote?: boolean;
    hiddenFromPublishing?: boolean;
    variableIds: string[];
  };

  // API レスポンスの型定義
  type GetVariablesResponse = {
    status: number;
    error: boolean;
    meta: {
      variables: Record<string, FigmaVariable>;
      variableCollections: Record<string, FigmaVariableCollection>;
    };
  };

  // Variable 作成・更新用のパラメータ型
  type CreateVariableParams = {
    name: string;
    variableCollectionId: string;
    resolvedType: FigmaResolvedType;
    // 初期値の設定（モードIDと値のマップ）
    initialValue?: {
      modeId: string;
      value: VariableValue;
    };
    description?: string;
    scopes?: VariableScope[];
  };

  type UpdateVariableParams = {
    name?: string;
    description?: string;
    scopes?: VariableScope[];
    // 値の更新（モードIDと値のマップ）
    values?: Array<{
      modeId: string;
      value: VariableValue;
    }>;
  };
  ```

#### Task 2.2: Variables 取得機能の実装
- [ ] `getFileVariables(fileId: string)` 関数の実装
  ```typescript
  import { get } from './client';

  export async function getFileVariables(fileId: string) {
    // client.ts を通じて Variables を取得
    return await get(`files/${fileId}/variables/local`);
  }
  ```
- [ ] Variables データのパース処理
- [ ] エラーハンドリング

#### Task 2.3: Variables 表示機能の実装
- [ ] `displayVariables(variablesData)` 関数の実装
  - 変数一覧の見やすい表示
  - Collection ごとのグルーピング
  - Mode 情報の表示
- [ ] `findVariableByName(variablesData, name)` 関数の実装（検索機能）

#### Task 2.4: Variables 設定機能の実装
- [ ] `createVariable(fileId, params)` 関数の実装
  ```typescript
  import { post } from './client';

  export async function createVariable(
    fileId: string,
    params: CreateVariableParams
  ): Promise<FigmaVariable> {
    // パラメータのバリデーション
    validateCreateParams(params);
    // client.ts を通じて Variables を作成
    return await post(`files/${fileId}/variables`, params);
  }
  ```
- [ ] `updateVariable(fileId, variableId, params)` 関数の実装
  ```typescript
  export async function updateVariable(
    fileId: string,
    variableId: string,
    params: UpdateVariableParams
  ): Promise<FigmaVariable> {
    // パラメータのバリデーション
    validateUpdateParams(params);
    // client.ts を通じて Variables を更新
    return await post(`files/${fileId}/variables/${variableId}`, params);
  }
  ```
- [ ] パラメータのバリデーション関数の実装
  - resolvedType の値チェック
  - value の型チェック（resolvedType と整合性があるか）
- [ ] レスポンスの型付け（戻り値を `FigmaVariable` として返す）

### Phase 3: CLI 統合

#### Task 3.1: CLI コマンドの実装
- [ ] variables 取得コマンドの追加
  ```bash
  bun run src/index.ts get-variables --file-id <FILE_ID>
  ```
  - `variable.ts` の `getFileVariables()` を呼び出し
  - `displayVariables()` で結果を表示
- [ ] variables 設定コマンドの追加
  ```bash
  bun run src/index.ts set-variable --file-id <FILE_ID> --name <NAME> --value <VALUE>
  ```
  - `variable.ts` の `createVariable()` または `updateVariable()` を呼び出し
  - 成功メッセージの表示
- [ ] ヘルプメッセージの更新

#### Task 3.2: 既存コマンドとの整合性確保
- [ ] コマンドライン引数のパース方法を統一
- [ ] エラーメッセージのフォーマットを統一
- [ ] 出力形式の統一（既存の node 取得コマンドと同じスタイル）

### Phase 4: テストと検証

#### Task 4.1: リファクタリング後の動作確認
- [ ] 既存の node 取得機能が正常に動作するか確認
  - 新しい `file.ts` 経由での取得
  - `node.ts` の変更が正しく動作
- [ ] Phase 0 のリファクタリングによる影響範囲の確認

#### Task 4.2: Variables 機能のテスト
- [ ] 実際の Figma ファイルで variables 取得を確認
- [ ] variables 設定が正しく反映されるか確認
- [ ] エラーケースの動作確認
  - 無効な file ID
  - 認証エラー（トークンなし、無効なトークン）
  - ネットワークエラー
  - 存在しない variable の更新

#### Task 4.3: 統合テスト
- [ ] 複数のコマンドを組み合わせた動作確認
  - File 取得 → Node 検索 → Variables 取得の一連の流れ
- [ ] エラーハンドリングの一貫性確認

#### Task 4.4: ドキュメント整備
- [ ] README.md の更新（使用例の追加）
- [ ] 新しいアーキテクチャの説明を追加
- [ ] コード内コメントの追加
- [ ] エラーメッセージの日本語化

## 技術的考慮事項

### レイヤー間の責務分離

#### Infrastructure層（client.ts）
```typescript
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const baseURL = "https://api.figma.com/v1";

export async function get(endpoint: string): Promise<any> {
  if (!FIGMA_ACCESS_TOKEN) {
    console.error("エラー: FIGMA_ACCESS_TOKENが設定されていません");
    process.exit(1);
  }

  const response = await fetch(`${baseURL}/${endpoint}`, {
    headers: {
      "X-Figma-Token": FIGMA_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API エラー: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function post(endpoint: string, body: any): Promise<any> {
  // 同様の実装
}
```

#### Domain層（file.ts, variable.ts）
```typescript
// file.ts
import { get } from './client';

export async function getFile(fileId: string) {
  return await get(`files/${fileId}`);
}

// variable.ts
import { get, post } from './client';

export async function getFileVariables(fileId: string) {
  return await get(`files/${fileId}/variables/local`);
}

export async function createVariable(fileId: string, params: any) {
  return await post(`files/${fileId}/variables`, params);
}
```

### データフローの設計

```
CLI層
  ├─ getFile(fileId)          → file.ts
  ├─ findNodeById(fileData)   → node.ts
  └─ getFileVariables(fileId) → variable.ts
       ↓
Domain層（file.ts, node.ts, variable.ts）
  └─ get(endpoint) / post(endpoint, body) → client.ts
       ↓
Infrastructure層（client.ts）
  └─ Figma API
```

### エラーハンドリング
- **Infrastructure層（client.ts）**: HTTP レベルのエラー（認証、ネットワーク）
- **Domain層**: ビジネスロジックのエラー（存在しないリソース、バリデーション）
- **CLI層**: ユーザーへのフレンドリーなエラーメッセージ表示

### 型定義のベストプラクティス

**基本方針**
- `type` を優先的に使用（`interface` より柔軟で Union Type との親和性が高い）
- 可能な限り具体的な Union Type を使用し、`string` や `any` を避ける
- Figma API のドキュメントから正確な値を抽出する

**Union Type の活用例**
```typescript
// ❌ 悪い例: 曖昧な型定義
type Variable = {
  resolvedType: string;  // どんな文字列でも許容してしまう
  value: any;            // 型チェックが働かない
};

// ✅ 良い例: 厳密な型定義
type FigmaResolvedType = 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
type Variable = {
  resolvedType: FigmaResolvedType;  // 許可された値のみ
  value: boolean | number | string | RGBAColor;  // 具体的な型
};
```

**型安全性のメリット**
- コンパイル時に不正な値を検出
- IDE の自動補完が正確に機能
- リファクタリング時の影響範囲が明確
- 型定義自体がドキュメントとして機能

### 拡張性への配慮
- **HTTPクライアントの抽象化**: 将来的に異なるAPIクライアント（axios等）への切り替えが容易
- **型安全性**: `any` を避け、厳密な型定義を最初から導入
- **テスタビリティ**: client.ts をモック化することで Domain層の単体テストが可能
- **機能追加**: styles, components などの新機能も同じパターンで追加可能
  - それぞれの型定義も Union Type を活用して厳密に定義

## 参考情報

### Figma API ドキュメント
- [Variables REST API](https://www.figma.com/developers/api#variables)
- [Files REST API](https://www.figma.com/developers/api#files)
- [Authentication](https://www.figma.com/developers/api#authentication)

### 関連する既存ファイル
- `src/figma/client.ts`: Infrastructure層 - HTTPクライアント
- `src/figma/node.ts`: Domain層 - Node処理のパターン例
- 新規作成予定:
  - `src/figma/file.ts`: Domain層 - File取得
  - `src/figma/variable.ts`: Domain層 - Variables処理

### アーキテクチャパターン
レイヤードアーキテクチャ（Layered Architecture）を採用：
- **Presentation Layer**: CLI（index.ts等）
- **Domain Layer**: ビジネスロジック（file.ts, node.ts, variable.ts）
- **Infrastructure Layer**: 外部システム連携（client.ts）

## 完了条件

### Phase 0（アーキテクチャリファクタリング）
- [ ] `client.ts` が汎用的なHTTPクライアントとして再設計されている
- [ ] `file.ts` が作成され、File取得機能が実装されている
- [ ] `node.ts` が `file.ts` を使うようにリファクタリングされている
- [ ] 既存のCLIコマンドが正常に動作する
- [ ] PersonalAccessTokenの読み込みが`client.ts`のみで行われている

### Phase 1-2（Variables機能）
- [ ] `variable.ts` が作成され、variables の取得・設定機能が実装されている
- [ ] `client.ts` の `get()`, `post()` メソッドを使用している
- [ ] 型定義が適切に定義されている
  - `type` を使用している（`interface` ではない）
  - `resolvedType` などの固定値が Union Type で定義されている
  - `string` や `any` を可能な限り避けている
  - オプショナルプロパティが `?` で明示されている

### Phase 3（CLI統合）
- [ ] CLI から variables の取得・設定が可能
- [ ] コマンドライン引数のパースが既存パターンと統一されている
- [ ] ヘルプメッセージが更新されている

### Phase 4（テスト・ドキュメント）
- [ ] 既存機能が正常に動作することを確認
- [ ] 実際の Figma ファイルで variables 機能の動作確認が完了
- [ ] エラーハンドリングが適切に実装されている
- [ ] README.md に新しいアーキテクチャと使用例が記載されている

### 全体
- [ ] 新しいアーキテクチャ（レイヤー分離）が実現されている
- [ ] 既存のファイル構成ルール（機能単位での分割）が維持されている
- [ ] 型定義のベストプラクティスが適用されている
  - `type` の使用
  - Union Type の積極的な活用
  - `string` や `any` の最小化
- [ ] 将来の機能拡張（styles, components等）に対応できる設計になっている
  - 同じ型定義パターンを適用可能
