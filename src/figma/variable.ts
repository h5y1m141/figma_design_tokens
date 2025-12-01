import { get } from "./client";

/** ref: https://www.figma.com/developers/api#variables-types */
export type ResolvedType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";

export type VariableValueType =
  | boolean
  | number
  | string
  | { r: number; g: number; b: number; a: number }
  | { type: "VARIABLE_ALIAS"; id: string };

export type VariableScopeType =
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

export type VariableType = {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: ResolvedType;
  valuesByMode: Record<string, VariableValueType>;
  remote?: boolean;
  description?: string;
  hiddenFromPublishing?: boolean;
  scopes?: VariableScopeType[];
};

export type ModeType = {
  modeId: string;
  name: string;
};

export type VariableCollectionType = {
  id: string;
  name: string;
  modes: ModeType[];
  defaultModeId: string;
  remote?: boolean;
  hiddenFromPublishing?: boolean;
  variableIds: string[];
};

export type VariablesResponseType = {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, VariableType>;
    variableCollections: Record<string, VariableCollectionType>;
  };
};

export async function fetchVariables(
  fileId: string,
): Promise<VariablesResponseType> {
  return await get(`files/${fileId}/variables/local`);
}
