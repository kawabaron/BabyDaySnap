// ============================================================
// BabyDaySnap - グローバル状態管理（Context + useReducer）
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import type { AppState, AppAction, EditorOptions } from "@/types";
import { loadSettings, saveSettings, loadLibrary, saveLibrary, DEFAULT_SETTINGS } from "@/utils/storage";

// --- 初期状態 ---
const initialEditorOptions: EditorOptions = {
    templateId: "tpl_noframe_full",
    dateColorHex: "#FFFFFF",
    commentText: "",
};

const initialState: AppState = {
    settings: DEFAULT_SETTINGS,
    library: [],
    currentPhoto: null,
    computed: null,
    editorOptions: initialEditorOptions,
    renderedUri: null,
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
                },
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
        case "RESET_EDITOR":
            return {
                ...state,
                currentPhoto: null,
                computed: null,
                editorOptions: initialEditorOptions,
                renderedUri: null,
            };

        // ライブラリ
        case "LIBRARY_LOAD":
            return { ...state, library: action.payload };
        case "LIBRARY_ADD":
            return { ...state, library: [action.payload, ...state.library] };
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
                const [settings, library] = await Promise.all([
                    loadSettings(),
                    loadLibrary(),
                ]);
                dispatch({ type: "LOAD_SETTINGS", payload: settings });
                dispatch({ type: "LIBRARY_LOAD", payload: library });
            } catch (e) {
                console.warn("Initial load error:", e);
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
