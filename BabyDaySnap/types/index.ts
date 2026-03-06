// ============================================================
// BabyDaySnap - 型定義
// ============================================================

// --- テンプレート ---
export type TemplateId =
    | "tpl_noframe_full"   // フチ無し全面（黒縁取り白文字デフォ）
    | "tpl_frame_full";     // フチあり全面（黒文字）

// --- フォント ---
export type FontId = "font_standard" | "font_soft" | "font_stylish" | "font_cute";

// --- 写真ソース ---
export type PhotoSource = {
    uri: string;
    previewUri?: string; // エディタプレビュー用の軽量画像
    width: number;
    height: number;
    source: "camera" | "import";
    assetId?: string;
    creationTimeMs?: number;
    exifDateTimeOriginalMs?: number;
};

// --- 算出情報 ---
export type ComputedInfo = {
    shotDateISO: string; // "YYYY-MM-DD"
    ageDays: number;     // 生後日数（誕生日当日=0日）
};

// --- エディタオプション ---
export type EditorOptions = {
    templateId: TemplateId;
    dateColorHex: string;
    commentText: string;
    fontId: FontId;
    showDate: boolean;
    showName: boolean;
    showAge: boolean;
};

// --- アプリ内ライブラリアイテム ---
export type AppLibraryItem = {
    id: string; // uuid
    source: "camera" | "import";
    originalFileUri: string; // 再編集用
    renderedFileUri: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    shotDateISO: string;
    ageDays: number;
    templateId: TemplateId;
    dateColorHex: string;
    commentText: string;
    fontId: FontId;
    showDate: boolean;
    showName: boolean;
    showAge: boolean;
    createdAtMs: number;
};

// --- ユーザー設定 ---
export type PolicyUrls = {
    termsUrl: string;
    privacyUrl: string;
    contactUrl: string;
};

export type UserSettings = {
    hasOnboarded: boolean;
    birthDateISO: string | null;
    babyName: string;
    defaultTemplateId: TemplateId;
    defaultFontId: FontId;
    defaultShowDate: boolean;
    defaultShowName: boolean;
    defaultShowAge: boolean;
    lastTemplateId: TemplateId;
    lastFontId: FontId;
    lastDateColorHex: string;
    policyUrls: PolicyUrls;
};

// --- アプリ状態 ---
export type AppState = {
    settings: UserSettings;
    library: AppLibraryItem[];

    currentPhoto: PhotoSource | null;
    computed: ComputedInfo | null;
    editorOptions: EditorOptions;

    renderedUri: string | null;
    editingLibraryId?: string | null;
    loading: boolean;
    error?: string;
};

// --- Action ---
export type AppAction =
    // 設定
    | { type: "SET_ONBOARDED"; payload: boolean }
    | { type: "SET_BIRTHDATE"; payload: string }
    | { type: "SET_BABY_NAME"; payload: string }
    | { type: "SET_DEFAULT_TOGGLES"; payload: { defaultShowDate: boolean; defaultShowName: boolean; defaultShowAge: boolean } }
    | { type: "SET_DEFAULT_PREFS"; payload: { defaultTemplateId?: TemplateId; defaultFontId?: FontId } }
    | { type: "SET_POLICY_URLS"; payload: PolicyUrls }
    | { type: "SET_LAST_EDITOR_PREFS"; payload: { lastTemplateId: TemplateId; lastDateColorHex: string; lastFontId: FontId } }
    // 編集
    | { type: "SET_PHOTO"; payload: PhotoSource }
    | { type: "SET_COMPUTED"; payload: ComputedInfo }
    | { type: "SET_EDITOR_OPTIONS"; payload: Partial<EditorOptions> }
    | { type: "SET_RENDERED_URI"; payload: string | null }
    | { type: "SET_EDITING_LIBRARY_ID"; payload: string | null }
    | { type: "RESET_EDITOR" }
    // ライブラリ
    | { type: "LIBRARY_LOAD"; payload: AppLibraryItem[] }
    | { type: "LIBRARY_ADD"; payload: AppLibraryItem }
    | { type: "LIBRARY_UPDATE"; payload: AppLibraryItem }
    | { type: "LIBRARY_REMOVE"; payload: string }
    // ローディング
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | undefined }
    // 全設定ロード
    | { type: "LOAD_SETTINGS"; payload: UserSettings };

// --- テンプレート定義 ---
export type TemplateConfig = {
    id: TemplateId;
    label: string;
    hasFrame: boolean;
    isSquare: boolean;
    defaultDateColorHex: string;
    /** テキストに縁取り（stroke）を付けるか */
    hasTextStroke: boolean;
};

// --- 日付色パレット ---
export type ColorOption = {
    hex: string;
    label: string;
};

// --- フォントオプション ---
export type FontOption = {
    id: FontId;
    label: string;
    file: any;
};
