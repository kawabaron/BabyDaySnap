// ============================================================
// BabyDaySnap - グローバル状態管理（Context + useReducer）
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from "react";
import type { AppState, AppAction, EditorOptions, BabyProfile } from "@/types";
import { loadSettings, saveSettings, loadLibrary, saveLibrary, loadBabies, saveBabies, DEFAULT_SETTINGS } from "@/utils/storage";
import { getTemplateConfig } from "@/utils/templates";
import * as FileSystem from "expo-file-system/legacy";

// --- 初期状態 ---
const initialEditorOptions: EditorOptions = {
    templateId: "tpl_noframe_full",
    dateColorHex: "#FFFFFF",
    commentText: "",
    fontId: "font_standard",
    showDate: true,
    showName: true,
    showAge: true,
};

const initialState: AppState = {
    settings: DEFAULT_SETTINGS,
    babies: [],
    activeBabyId: null,
    targetBabyIds: [],
    library: [],
    currentPhoto: null,
    computed: null,
    editorOptions: initialEditorOptions,
    renderedUri: null,
    editingLibraryId: null,
    loading: true,
    error: undefined,
};

// --- Reducer ---
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        // 設定
        case "LOAD_SETTINGS":
            return {
                ...state,
                settings: action.payload,
            };
        case "SET_ONBOARDED":
            return {
                ...state,
                settings: { ...state.settings, hasOnboarded: action.payload },
            };
        case "SET_BIRTHDATE":
            return {
                ...state,
                settings: { ...state.settings, birthDateISO: action.payload },
            };
        case "SET_BABY_NAME":
            return {
                ...state,
                settings: { ...state.settings, babyName: action.payload },
            };
        case "SET_DEFAULT_TOGGLES":
            return {
                ...state,
                settings: {
                    ...state.settings,
                    defaultShowDate: action.payload.defaultShowDate,
                    defaultShowName: action.payload.defaultShowName,
                    defaultShowAge: action.payload.defaultShowAge,
                },
            };
        case "SET_DEFAULT_PREFS":
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            };
        case "SET_POLICY_URLS":
            return {
                ...state,
                settings: { ...state.settings, policyUrls: action.payload },
            };
        case "SET_LAST_EDITOR_PREFS":
            return {
                ...state,
                settings: {
                    ...state.settings,
                    lastTemplateId: action.payload.lastTemplateId,
                    lastDateColorHex: action.payload.lastDateColorHex,
                    lastFontId: action.payload.lastFontId,
                },
            };

        // 赤ちゃん管理
        case "LOAD_BABIES":
            return {
                ...state,
                babies: action.payload,
                activeBabyId: action.payload.length > 0 ? action.payload[0].id : null,
            };
        case "ADD_BABY":
            return {
                ...state,
                babies: [...state.babies, action.payload],
            };
        case "UPDATE_BABY":
            return {
                ...state,
                babies: state.babies.map((b) =>
                    b.id === action.payload.id ? action.payload : b
                ),
            };
        case "REMOVE_BABY":
            return {
                ...state,
                babies: state.babies.filter((b) => b.id !== action.payload),
                activeBabyId:
                    state.activeBabyId === action.payload
                        ? (state.babies.find((b) => b.id !== action.payload)?.id ?? null)
                        : state.activeBabyId,
            };
        case "SET_ACTIVE_BABY":
            return {
                ...state,
                activeBabyId: action.payload,
                targetBabyIds: [action.payload],
            };
        case "SET_TARGET_BABY_IDS":
            return {
                ...state,
                targetBabyIds: action.payload,
            };

        // 編集
        case "SET_PHOTO":
            return { ...state, currentPhoto: action.payload };
        case "SET_COMPUTED":
            return { ...state, computed: action.payload };
        case "SET_EDITOR_OPTIONS":
            return {
                ...state,
                editorOptions: { ...state.editorOptions, ...action.payload },
            };
        case "SET_RENDERED_URI":
            return { ...state, renderedUri: action.payload };
        case "SET_EDITING_LIBRARY_ID":
            return { ...state, editingLibraryId: action.payload };
        case "RESET_EDITOR": {
            // エディタをリセットする際、現在保持している一時写真をキャッシュから削除してストレージ/メモリ漏れを防ぐ
            if (state.currentPhoto) {
                const { uri, previewUri } = state.currentPhoto;
                // Documents/library/ 内にあるファイル（保存済み原本・レンダリング済み画像）は絶対に消さない
                // カメラやインポート由来のキャッシュファイルのみ削除する
                const isLibraryFile = (path: string) => path.includes('/Documents/library/');
                if (uri && !isLibraryFile(uri)) {
                    try { FileSystem.deleteAsync(uri, { idempotent: true }); } catch (_) { }
                }
                if (previewUri && previewUri !== uri && !isLibraryFile(previewUri)) {
                    try { FileSystem.deleteAsync(previewUri, { idempotent: true }); } catch (_) { }
                }
            }

            const templateId = state.settings.defaultTemplateId || "tpl_noframe_full";
            const tpl = getTemplateConfig(templateId);
            return {
                ...state,
                currentPhoto: null,
                computed: null,
                editorOptions: {
                    templateId,
                    dateColorHex: tpl.defaultDateColorHex,
                    commentText: "",
                    fontId: state.settings.defaultFontId || "font_standard",
                    showDate: state.settings.defaultShowDate,
                    showName: state.settings.defaultShowName,
                    showAge: state.settings.defaultShowAge,
                },
                renderedUri: null,
                editingLibraryId: null,
            };
        }

        // ライブラリ
        case "LIBRARY_LOAD":
            return { ...state, library: action.payload };
        case "LIBRARY_ADD":
            return { ...state, library: [action.payload, ...state.library] };
        case "LIBRARY_UPDATE":
            return {
                ...state,
                library: state.library.map((item) =>
                    item.id === action.payload.id ? action.payload : item
                ),
            };
        case "LIBRARY_REMOVE":
            return {
                ...state,
                library: state.library.filter((item) => item.id !== action.payload),
            };

        // ローディング
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };

        default:
            return state;
    }
}

// --- Contexts ---
const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<React.Dispatch<AppAction>>(() => { });

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 起動時にデータロード
    useEffect(() => {
        (async () => {
            try {
                const [settings, library, babies] = await Promise.all([
                    loadSettings(),
                    loadLibrary(),
                    loadBabies(),
                ]);
                dispatch({ type: "LOAD_SETTINGS", payload: settings });

                // マイグレーション: babies が空で既存の babyName/birthDateISO がある場合
                let resolvedBabies = babies;
                if (babies.length === 0 && settings.birthDateISO) {
                    const migratedBaby: BabyProfile = {
                        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                        name: settings.babyName || "赤ちゃん",
                        birthDateISO: settings.birthDateISO,
                        themeColorHex: "#FFB5C2",
                        createdAtMs: Date.now(),
                        order: 0,
                    };
                    resolvedBabies = [migratedBaby];

                    // 既存ライブラリアイテムに babyId を付与
                    const migratedLibrary = library.map((item) => ({
                        ...item,
                        babyIds: item.babyIds.length === 0 ? [migratedBaby.id] : item.babyIds,
                    }));
                    dispatch({ type: "LIBRARY_LOAD", payload: migratedLibrary });
                } else {
                    dispatch({ type: "LIBRARY_LOAD", payload: library });
                }

                dispatch({ type: "LOAD_BABIES", payload: resolvedBabies });
            } catch {
            } finally {
                dispatch({ type: "SET_LOADING", payload: false });
            }
        })();
    }, []);

    // settings が変更されたら自動保存
    useEffect(() => {
        if (!state.loading) {
            saveSettings(state.settings);
        }
    }, [state.settings, state.loading]);

    // library が変更されたら自動保存
    useEffect(() => {
        if (!state.loading) {
            saveLibrary(state.library);
        }
    }, [state.library, state.loading]);

    // babies が変更されたら自動保存
    useEffect(() => {
        if (!state.loading) {
            saveBabies(state.babies);
        }
    }, [state.babies, state.loading]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
}

// --- Hooks ---
export function useAppState(): AppState {
    return useContext(AppStateContext);
}

export function useAppDispatch(): React.Dispatch<AppAction> {
    return useContext(AppDispatchContext);
}

/** 現在アクティブな赤ちゃんのプロフィールを返す */
export function useActiveBaby(): BabyProfile | null {
    const { babies, activeBabyId } = useAppState();
    return useMemo(
        () => babies.find((b) => b.id === activeBabyId) ?? null,
        [babies, activeBabyId]
    );
}
