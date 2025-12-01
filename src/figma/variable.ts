import { get } from "./client";

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
