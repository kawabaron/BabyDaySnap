// ============================================================
// BabyDaySnap - 郢ｧ・ｰ郢晢ｽｭ郢晢ｽｼ郢晁・ﾎ晁ｿ･・ｶ隲ｷ迢暦ｽｮ・｡騾・・・ｼ繝ｻontext + useReducer繝ｻ繝ｻ
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from "react";
import type { AppState, AppAction, EditorOptions, BabyProfile } from "@/types";
import { loadSettings, saveSettings, loadLibrary, saveLibrary, loadBabies, saveBabies, DEFAULT_SETTINGS } from "@/utils/storage";
import { getTemplateConfig } from "@/utils/templates";
import * as FileSystem from "expo-file-system/legacy";

// --- 陋ｻ譎・ｄ霑･・ｶ隲ｷ繝ｻ---
const initialEditorOptions: EditorOptions = {
    templateId: "tpl_noframe_full",
    dateColorHex: "#FFFFFF",
    commentText: "",
    fontId: "font_standard",
    showDate: true,
    showName: true,
    showAge: true,
    ageFormat: "days",
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
        // 髫ｪ・ｭ陞ｳ繝ｻ
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
                    defaultAgeFormat: action.payload.defaultAgeFormat,
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

        // 隘搾ｽ､邵ｺ・｡郢ｧ繝ｻ・馴ｂ・｡騾・・
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

        // 驍ｱ・ｨ鬮ｮ繝ｻ
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
            // 郢ｧ・ｨ郢昴・縺・ｹｧ・ｿ郢ｧ蛛ｵﾎ懃ｹｧ・ｻ郢昴・繝ｨ邵ｺ蜷ｶ・矩ｫｫ蟶卍竏ｫ讓溯舉・ｨ闖ｫ譎・亜邵ｺ蜉ｱ窶ｻ邵ｺ繝ｻ・玖叉ﾂ隴弱ｇ繝ｻ騾ｵ貅假ｽ堤ｹｧ・ｭ郢晢ｽ｣郢昴・縺咏ｹ晢ｽ･邵ｺ荵晢ｽ芽恆莨∝求邵ｺ蜉ｱ窶ｻ郢ｧ・ｹ郢晏現ﾎ樒ｹ晢ｽｼ郢ｧ・ｸ/郢晢ｽ｡郢晢ｽ｢郢晢ｽｪ雋堺ｸ奇ｽ檎ｹｧ蟶昜ｺ溽ｸｺ繝ｻ
            if (state.currentPhoto) {
                const { uri, previewUri } = state.currentPhoto;
                // Documents/library/ 陷繝ｻ竊鍋ｸｺ繧・ｽ狗ｹ晁ｼ斐＜郢ｧ・､郢晢ｽｫ繝ｻ莠包ｽｿ譎擾ｽｭ菫ｶ・ｸ蛹ｻ竏ｩ陷ｴ貊捺た郢晢ｽｻ郢晢ｽｬ郢晢ｽｳ郢敖郢晢ｽｪ郢晢ｽｳ郢ｧ・ｰ雋ょ現竏ｩ騾包ｽｻ陷呈得・ｼ蟲ｨ繝ｻ驍ｨ・ｶ陝・ｽｾ邵ｺ・ｫ雎ｸ蛹ｻ・・ｸｺ・ｪ邵ｺ繝ｻ
                // 郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ郢ｧ繝ｻ縺・ｹ晢ｽｳ郢晄亢繝ｻ郢晁ご鄂ｰ隴夲ｽ･邵ｺ・ｮ郢ｧ・ｭ郢晢ｽ｣郢昴・縺咏ｹ晢ｽ･郢晁ｼ斐＜郢ｧ・､郢晢ｽｫ邵ｺ・ｮ邵ｺ・ｿ陷台ｼ∝求邵ｺ蜷ｶ・・
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
                    ageFormat: state.settings.defaultAgeFormat || "days",
                },
                renderedUri: null,
                editingLibraryId: null,
            };
        }

        // 郢晢ｽｩ郢ｧ・､郢晄じﾎ帷ｹ晢ｽｪ
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

        // 郢晢ｽｭ郢晢ｽｼ郢昴・縺・ｹ晢ｽｳ郢ｧ・ｰ
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

    // 隘搾ｽｷ陷榊｢灘・邵ｺ・ｫ郢昴・繝ｻ郢ｧ・ｿ郢晢ｽｭ郢晢ｽｼ郢昴・
    useEffect(() => {
        (async () => {
            try {
                const [settings, library, babies] = await Promise.all([
                    loadSettings(),
                    loadLibrary(),
                    loadBabies(),
                ]);
                dispatch({ type: "LOAD_SETTINGS", payload: settings });

                // 郢晄ｧｭ縺・ｹｧ・ｰ郢晢ｽｬ郢晢ｽｼ郢ｧ・ｷ郢晢ｽｧ郢晢ｽｳ: babies 邵ｺ讙趣ｽｩ・ｺ邵ｺ・ｧ隴鯉ｽ｢陝・･繝ｻ babyName/birthDateISO 邵ｺ蠕娯旺郢ｧ蜿･・ｰ・ｴ陷ｷ繝ｻ
                let resolvedBabies = babies;
                if (babies.length === 0 && settings.birthDateISO) {
                    const migratedBaby: BabyProfile = {
                        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                        name: settings.babyName || "隘搾ｽ､邵ｺ・｡郢ｧ繝ｻ・・,
                        birthDateISO: settings.birthDateISO,
                        themeColorHex: "#FFB5C2",
                        createdAtMs: Date.now(),
                        order: 0,
                    };
                    resolvedBabies = [migratedBaby];

                    // 隴鯉ｽ｢陝・･ﾎ帷ｹｧ・､郢晄じﾎ帷ｹ晢ｽｪ郢ｧ・｢郢ｧ・､郢昴・ﾎ堤ｸｺ・ｫ babyId 郢ｧ蜑・ｽｻ蛟・ｽｸ繝ｻ
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

    // settings 邵ｺ謔滂ｽ､逕ｻ蟲ｩ邵ｺ霈費ｽ檎ｸｺ貅假ｽ蛾明・ｪ陷咲ｩゑｽｿ譎擾ｽｭ繝ｻ
    useEffect(() => {
        if (!state.loading) {
            saveSettings(state.settings);
        }
    }, [state.settings, state.loading]);

    // library 邵ｺ謔滂ｽ､逕ｻ蟲ｩ邵ｺ霈費ｽ檎ｸｺ貅假ｽ蛾明・ｪ陷咲ｩゑｽｿ譎擾ｽｭ繝ｻ
    useEffect(() => {
        if (!state.loading) {
            saveLibrary(state.library);
        }
    }, [state.library, state.loading]);

    // babies 邵ｺ謔滂ｽ､逕ｻ蟲ｩ邵ｺ霈費ｽ檎ｸｺ貅假ｽ蛾明・ｪ陷咲ｩゑｽｿ譎擾ｽｭ繝ｻ
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

/** 霑ｴ・ｾ陜ｨ・ｨ郢ｧ・｢郢ｧ・ｯ郢昴・縺・ｹ晄じ竊題･搾ｽ､邵ｺ・｡郢ｧ繝ｻ・鍋ｸｺ・ｮ郢晏干ﾎ溽ｹ晁ｼ斐≦郢晢ｽｼ郢晢ｽｫ郢ｧ螳夲ｽｿ譁絶・ */
export function useActiveBaby(): BabyProfile | null {
    const { babies, activeBabyId } = useAppState();
    return useMemo(
        () => babies.find((b) => b.id === activeBabyId) ?? null,
        [babies, activeBabyId]
    );
}
