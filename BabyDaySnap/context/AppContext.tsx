// ============================================================
// BabyDaySnap - 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ蟇ゅ・郢晢ｽｻ郢晢ｽｻ陷ｿ髢繝ｻ郢晢ｽｻ繝ｻ・ｿ郢晢ｽｻ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｶ鬯ｮ・ｫ繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｷ鬮ｴ謇假ｽｽ・｢髫ｴ莨夲ｽｽ・ｦ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｮ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｯ・ｨ繝ｻ・ｾ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｼ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻontext + useReducer鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from "react";
import type { AppState, AppAction, EditorOptions, BabyProfile } from "@/types";
import { loadSettings, saveSettings, loadLibrary, saveLibrary, loadBabies, saveBabies, DEFAULT_SETTINGS } from "@/utils/storage";
import { getTemplateConfig } from "@/utils/templates";
import * as FileSystem from "expo-file-system/legacy";

// --- 鬯ｮ・ｯ陷茨ｽｷ繝ｻ・ｽ繝ｻ・ｻ鬮ｫ・ｴ陟托ｽｱ郢晢ｽｻ郢晢ｽｻ郢晢ｽｻ隲ｱ繝ｻ繝ｻ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｶ鬯ｮ・ｫ繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｷ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ---
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
        // 鬯ｯ・ｮ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｪ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｮ・ｯ隶厄ｽｸ繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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

        // 鬯ｮ・ｫ闖ｫ・ｶ髫ｱ阮吶・繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬯ｯ・･繝ｻ・ｴ郢晢ｽｻ郢ｧ繝ｻ繝ｻ郢晢ｽｻ繝ｻ・｡鬯ｯ・ｨ繝ｻ・ｾ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
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

        // 鬯ｯ・ｩ隰ｳ・ｾ繝ｻ・ｽ繝ｻ・ｱ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｯ繝ｻ・ｮ郢晢ｽｻ繝ｻ・ｮ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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
            // 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬮ｯ蜿･・ｹ・｢繝ｻ・ｽ繝ｻ・ｵ郢晢ｽｻ陷ｿ謔ｶ貂夂ｹ晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｨ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｯ・ｷ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｶ驛｢譎｢・ｽ・ｻ鬩墓得・ｽ・ｩ郢晢ｽｻ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｫ鬮ｯ譎｢・ｽ・ｶ髯ｷ髮√＠・つ鬩包ｽｶ隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｫ鬮ｫ・ｶ隰撰ｽｺ繝ｻ・ｺ繝ｻ・ｯ鬮｣髮・ｽｳ・ｨ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｨ鬯ｮ・｣陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｫ鬮ｫ・ｴ陟托ｽｱ郢晢ｽｻ髣費｣ｰ隲橸ｽｺ邵ｺ蜉ｱ繝ｻ繝ｻ・ｺ鬮ｯ・ｷ闔ｨ螟ｲ・ｽ・ｽ繝ｻ・ｱ鬩包ｽｯ繝ｻ・ｶ郢晢ｽｻ繝ｻ・ｻ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬩阪・鞫ｩ陋ｻ譏ｴ繝ｻ邵ｺ・､・つ鬯ｮ・ｫ繝ｻ・ｴ髯滓汚・ｽ・ｱ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｹ隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｯ・ｨ繝ｻ・ｾ郢晢ｽｻ繝ｻ・ｵ鬮ｮ荵昴・遶乗ｧｭ繝ｻ繝ｻ・ｽ髯懶ｽ｣繝ｻ・､郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｣鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ髯ｷ・･隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮｣蛹・ｽｽ・ｵ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ鬮｣繝ｻ・ｽ・ｽ髫ｲ・ｱ郢晢ｽｻ髢・ｳ驕ｶ荵怜・繝ｻ・ｱ郢ｧ荵晢ｼ郢晢ｽｻ繝ｻ・ｺ鬮ｯ・ｷ闔ｨ螟ｲ・ｽ・ｽ繝ｻ・ｱ鬩包ｽｯ繝ｻ・ｶ郢晢ｽｻ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ鬯ｩ蟷｢・ｽ・｢髫ｴ荳ｻ繝ｻ隶捺ｺ倥・陷ｿ蜴・ｽｽ・ｨ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｸ/鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ鬯ｮ・ｮ陷ｿ・･繝ｻ・ｰ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｸ髯槭ｅ繝ｻ繝ｻ・ｽ繝ｻ・ｽ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ鬮ｯ譎｢・ｽ・ｶ髫ｴ荵励・繝ｻ・ｽ繝ｻ・ｺ髮九・・ｽ・ｽ郢晢ｽｻ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
            if (state.currentPhoto) {
                const { uri, previewUri } = state.currentPhoto;
                // Documents/library/ 鬯ｮ・ｯ繝ｻ・ｷ繝ｻ縺､ﾂ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩包ｽｶ闔ｨ竏ｬ・ｱ・ｪ郢晢ｽｻ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ髴托ｽ｢隴会ｽｦ繝ｻ・ｽ繝ｻ・ｹ髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｵ閻ｸ繝ｻ・ｼ隲橸ｽｺ・取鱒繝ｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｫ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬮｣雋ｻ・｣・ｰ髯具ｽｹ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｴ陷ｿ髢・ｾ蜉ｱ繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬮｣蜴・ｽｽ・ｫ郢晢ｽｻ繝ｻ・ｶ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｸ鬮ｯ蜈ｷ・ｽ・ｹ郢晢ｽｻ繝ｻ・ｻ鬩包ｽｶ隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｩ鬯ｮ・ｯ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｴ鬮ｮ遏ｩ・ｰ驢崎｢夜し・ｺ雋翫・遒托ｽｭ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｬ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢髫ｰ・ｨ鬲托ｽｴ・つ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ鬯ｮ・ｮ闕ｵ譎｢・ｽ繝ｻ・ｿ・ｴ繝ｻ・ｾ鬩包ｽｶ隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｩ鬯ｯ・ｨ繝ｻ・ｾ髯具ｽｹ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｻ鬯ｮ・ｯ繝ｻ・ｷ髯ｷ・ｻ闔・･繝ｻ・ｾ陷会ｽｱ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｼ鬮ｯ譎｢・ｽ・ｲ郢晢ｽｻ繝ｻ・ｨ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｯ・ｩ隰ｳ・ｾ繝ｻ・ｽ繝ｻ・ｨ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｶ鬯ｮ・ｯ隴擾ｽｴ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｾ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｫ鬯ｮ・ｮ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｸ鬮ｯ蜈ｷ・ｽ・ｹ郢晢ｽｻ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｪ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
                // 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｫ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｩ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｺ繝ｻ・｢鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢髫ｴ蟇ゅ・繝ｻ繝ｻ・ｩ蜉ｱ・代・・ｽ繝ｻ・ｰ鬯ｮ・ｫ繝ｻ・ｴ髯樊ｻゑｽｽ・ｲ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｣鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ髯ｷ・･隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｵ閻ｸ繝ｻ・ｼ隲橸ｽｺ・取鱒繝ｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｫ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｯ繝ｻ・ｷ髯ｷ・ｿ繝ｻ・ｰ郢晢ｽｻ繝ｻ・ｼ驕ｶ荵怜・繝ｻ・ｱ郢ｧ荵晢ｼ郢晢ｽｻ繝ｻ・ｺ鬮ｯ・ｷ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｶ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
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

        // 鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｩ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ・ゑｽｧ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ
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

        // 鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ
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

    // 鬯ｮ・ｫ闖ｫ・ｶ髫ｱ阮吶・繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｷ鬯ｮ・ｯ繝ｻ・ｷ髫ｶ荳ｻ・･繝ｻ・ｽ・ｽ繝ｻ・｢髴難ｽ｣陋滂ｽ･郢晢ｽｻ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｫ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ
    useEffect(() => {
        (async () => {
            try {
                const [settings, library, babies] = await Promise.all([
                    loadSettings(),
                    loadLibrary(),
                    loadBabies(),
                ]);
                dispatch({ type: "LOAD_SETTINGS", payload: settings });

                // 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｬ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｷ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｧ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ: babies 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｫ・ｶ陷ｻ・ｵ繝ｻ・ｶ繝ｻ・｣郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｩ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｺ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｧ鬯ｮ・ｫ繝ｻ・ｴ鬯ｲ繝ｻ・ｼ螟ｲ・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｢鬯ｮ・ｯ隴擾ｽｴ郢晢ｽｻ繝ｻ縺､ﾂ郢晢ｽｻ繝ｻ・･鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ babyName/birthDateISO 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｯ貅ｷ萓帙・・ｨ繝ｻ・ｯ髫ｴ魃会ｽｽ・ｺ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬮ｯ・ｷ繝ｻ・ｿ郢晢ｽｻ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｴ鬯ｮ・ｯ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｷ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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

                    // 鬯ｮ・ｫ繝ｻ・ｴ鬯ｲ繝ｻ・ｼ螟ｲ・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｢鬯ｮ・ｯ隴擾ｽｴ郢晢ｽｻ繝ｻ縺､ﾂ郢晢ｽｻ繝ｻ・･郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ・ゑｽｧ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｰ繝ｻ・､郢晢ｽｻ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｫ babyId 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬮ｯ・ｷ闔会ｽ｣郢晢ｽｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｻ鬮ｯ蛹ｺ・ｺ蛟･繝ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｸ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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

    // settings 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｫ・ｰ騾搾ｽｲ繝ｻ・ｻ郢ｧ謇假ｽｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ譎｢・ｽ・ｲ郢晢ｽｻ繝ｻ・ｩ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬯ｮ・ｴ鬩帙・・ｽ・ｲ繝ｻ・ｻ郢晢ｽｻ繝ｻ・ｽ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ鬮ｮ荵昴・遶乗ｧｭ繝ｻ繝ｻ・ｽ鬮ｯ蜈ｷ・ｽ・ｾ髫ｴ荳橸ｽｼ・ｱ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｪ鬯ｮ・ｯ繝ｻ・ｷ髯ｷ・･繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｩ驛｢・ｧ隰・∞・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｴ陷ｿ髢・ｾ蜉ｱ繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    useEffect(() => {
        if (!state.loading) {
            saveSettings(state.settings);
        }
    }, [state.settings, state.loading]);

    // library 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｫ・ｰ騾搾ｽｲ繝ｻ・ｻ郢ｧ謇假ｽｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ譎｢・ｽ・ｲ郢晢ｽｻ繝ｻ・ｩ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬯ｮ・ｴ鬩帙・・ｽ・ｲ繝ｻ・ｻ郢晢ｽｻ繝ｻ・ｽ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ鬮ｮ荵昴・遶乗ｧｭ繝ｻ繝ｻ・ｽ鬮ｯ蜈ｷ・ｽ・ｾ髫ｴ荳橸ｽｼ・ｱ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｪ鬯ｮ・ｯ繝ｻ・ｷ髯ｷ・･繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｩ驛｢・ｧ隰・∞・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｴ陷ｿ髢・ｾ蜉ｱ繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    useEffect(() => {
        if (!state.loading) {
            saveLibrary(state.library);
        }
    }, [state.library, state.loading]);

    // babies 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｫ・ｰ騾搾ｽｲ繝ｻ・ｻ郢ｧ謇假ｽｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ譎｢・ｽ・ｲ郢晢ｽｻ繝ｻ・ｩ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬯ｮ・ｴ鬩帙・・ｽ・ｲ繝ｻ・ｻ郢晢ｽｻ繝ｻ・ｽ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ鬮ｮ荵昴・遶乗ｧｭ繝ｻ繝ｻ・ｽ鬮ｯ蜈ｷ・ｽ・ｾ髫ｴ荳橸ｽｼ・ｱ郢晢ｽｻ郢晢ｽｻ繝ｻ・ｪ鬯ｮ・ｯ繝ｻ・ｷ髯ｷ・･繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｩ驛｢・ｧ隰・∞・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｴ陷ｿ髢・ｾ蜉ｱ繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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

/** 鬯ｮ・ｴ隰・∞・ｽ・ｽ繝ｻ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｾ鬯ｮ・ｯ隲幢ｽｶ繝ｻ・ｽ繝ｻ・ｨ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｯ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ髫ｴ蠑ｱ繝ｻ・ゑｽｧ鬩包ｽｶ闔ｨ繝ｻ・ｽ・｡鬲・ｼ夲ｽｽ・ｽ繝ｻ・･髫ｰ・ｳ繝ｻ・ｾ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬯ｪ・ｰ陷茨ｽｷ繝ｻ・ｽ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｺ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｹ髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｫ・ｵ・ｶ髫伜､懶ｽｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｫ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬮ｯ讖ｸ・ｽ・ｳ髯樊ｻゑｽｽ・ｲ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｴ遶擾ｽｫ繝ｻ・ｵ繝ｻ・ｶ驛｢譎｢・ｽ・ｻ */
export function useActiveBaby(): BabyProfile | null {
    const { babies, activeBabyId } = useAppState();
    return useMemo(
        () => babies.find((b) => b.id === activeBabyId) ?? null,
        [babies, activeBabyId]
    );
}
