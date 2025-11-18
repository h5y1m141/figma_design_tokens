import { get, post } from "./client";

// ============================================
// 型定義
// ============================================

/**
 * Figma Variables の resolvedType
 * ref: https://www.figma.com/developers/api#variables-types
 */
export type FigmaResolvedType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";

/**
 * Variable の値の型（resolvedType に応じて異なる）
 */
export type VariableValue =
  | boolean // BOOLEAN
  | number // FLOAT
  | string // STRING
  | { r: number; g: number; b: number; a: number } // COLOR (RGBA)
  | { type: "VARIABLE_ALIAS"; id: string }; // 他の変数への参照

/**
 * Variable の適用範囲
 */
export type VariableScope =
  | "ALL_SCOPES"
  | "TEXT_CONTENT"
  | "TEXT_FILL"
  | "FRAME_FILL"
  | "SHAPE_FILL"
  | "STROKE_COLOR"
  | "EFFECT_COLOR"
  | "WIDTH_HEIGHT"
  | "GAP"
  | "CORNER_RADIUS";

/**
 * Variable の型定義
 */
export type FigmaVariable = {
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

/**
 * Mode の型定義
 */
export type FigmaMode = {
  modeId: string;
  name: string;
};

/**
 * VariableCollection の型定義
 */
export type FigmaVariableCollection = {
  id: string;
  name: string;
  modes: FigmaMode[];
  defaultModeId: string;
  remote?: boolean;
  hiddenFromPublishing?: boolean;
  variableIds: string[];
};

/**
 * API レスポンスの型定義
 */
export type GetVariablesResponse = {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
};

// ============================================
// 関数
// ============================================

/**
 * Figma File の Variables を取得
 * @param fileId - Figma File ID
 * @returns Variables データ
 */
export async function getFileVariables(
  fileId: string,
): Promise<GetVariablesResponse> {
  return await get(`files/${fileId}/variables/local`);
}

/**
 * Variables の一覧を見やすく表示
 * @param variablesData - getFileVariables() のレスポンス
 */
export function displayVariables(variablesData: GetVariablesResponse): void {
  const { variables, variableCollections } = variablesData.meta;

  console.log("✓ Variables 取得成功\n");

  // Collection ごとにグルーピングして表示
  for (const [collectionId, collection] of Object.entries(
    variableCollections,
  )) {
    console.log(`📁 Collection: ${collection.name} (${collectionId})`);
    console.log(`   Modes: ${collection.modes.map((m) => m.name).join(", ")}`);
    console.log(`   Default Mode: ${collection.defaultModeId}\n`);

    // この Collection に属する Variables を表示
    const collectionVariables = Object.values(variables).filter(
      (v) => v.variableCollectionId === collectionId,
    );

    if (collectionVariables.length === 0) {
      console.log("   (変数なし)\n");
      continue;
    }

    for (const variable of collectionVariables) {
      console.log(`   🔤 ${variable.name}`);
      console.log(`      ID: ${variable.id}`);
      console.log(`      Type: ${variable.resolvedType}`);
      if (variable.description) {
        console.log(`      Description: ${variable.description}`);
      }

      // Mode ごとの値を表示
      console.log("      Values:");
      for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
        const mode = collection.modes.find((m) => m.modeId === modeId);
        const modeName = mode ? mode.name : modeId;
        console.log(`         ${modeName}: ${JSON.stringify(value)}`);
      }
      console.log("");
    }
  }
}

/**
 * Variables の詳細情報を JSON で表示
 * @param variablesData - getFileVariables() のレスポンス
 */
export function displayVariablesJSON(variablesData: GetVariablesResponse): void {
  console.log("=== Variables 詳細情報（JSON） ===");
  console.log(JSON.stringify(variablesData, null, 2));
}
