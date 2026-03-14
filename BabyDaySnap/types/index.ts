// ============================================================
// BabyDaySnap - 鬯ｮ・ｯ隲幢ｽｷ鬮ｮﾂ髯ｷ螟ｲ・ｽ・ｱ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬮ｯ讓奇ｽｺ蛛・ｽｽ莉｣繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｾ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｩ
// ============================================================

// --- 鬯ｮ・ｫ闖ｫ・ｶ髫ｱ阮吶・繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬯ｪ・ｰ陷茨ｽｷ繝ｻ・ｽ繝ｻ・ｹ髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｺ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｹ髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｫ・ｵ・ｶ髫伜､懶ｽｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｫ ---
export type BabyProfile = {
    id: string;            // uuid
    name: string;
    birthDateISO: string;
    themeColorHex: string; // 鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ髯ｷ・･繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｩ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ (hex)
    createdAtMs: number;
    order: number;         // 鬯ｯ・ｮ繝ｻ・ｯ郢晢ｽｻ繝ｻ・ｦ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｩ驕ｨ繧托ｽｽ・ｼ陞滂ｽｲ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｺ鬯ｯ・ｯ繝ｻ・ｯ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
};

// --- 鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｦ鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｨ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ---
export type TemplateId =
    | "tpl_noframe_full"   // 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｫ豬ｹ鬯･・ｴ隲ｱ・ｷ髮狗ｿｫ・代・・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・｡鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬮ｫ・ｲ繝ｻ・､髫ｲ蟶ｷ・ｿ・ｫ郢晢ｽｻ鬯ｯ・ｯ繝ｻ・ｮ郢晢ｽｻ繝ｻ・ｱ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｨ・ｾ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｯ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｻ鬮ｯ諛ｶ・ｽ・｣郢晢ｽｻ繝ｻ・､驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｸ鬩包ｽｶ闕ｵ諤懃・髯溷供・ｮ・｣・取鱒繝ｻ繝ｻ・ｧ鬯ｯ・ｯ闖ｫ・ｶ繝ｻ・ｳ驕偵・・｣・ｰ郢晢ｽｻ陜咎豪・ｫ荳橸ｽ｣・ｹ郢晢ｽｻ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬮ｯ・ｷ闔ｨ螟ｲ・ｽ・ｽ繝ｻ・ｱ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｧ鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ繝ｻ謳ｨ繝ｻ・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    | "tpl_frame_full"      // 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｫ豬ｹ鬯･・ｴ邵ｺ蜉ｱ繝ｻ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ鬩怜遜・ｽ・ｫ驛｢譎｢・ｽ・ｻ鬮｣雋ｻ・｣・ｰ郢晢ｽｻ繝ｻ・･鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｮ・｣陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｴ鬯ｯ・ｮ繝ｻ・ｮ郢晢ｽｻ繝ｻ・｣驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｼ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    | "tpl_frame_crop";     // 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ竏ｫ豬ｹ鬯･・ｴ邵ｺ蜉ｱ繝ｻ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ鬩怜遜・ｽ・ｫ驛｢譎｢・ｽ・ｻ鬮｣雋ｻ・｣・ｰ郢晢ｽｻ繝ｻ・･鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｮ・ｯ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｿ鬮ｯ・ｷ繝ｻ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ

// --- 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ繝ｻ謳ｨ繝ｻ・ｰ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ---
export type FontId =
    | "font_standard"
    | "font_soft"
    | "font_stylish"
    | "font_cute"
    | "font_calligraphy"
    | "font_scary"
    | "font_round"
    | "font_cool"
    | "font_handwritten";
export type FilterId = "filter_none" | "filter_milk" | "filter_blossom" | "filter_nap" | "filter_sparkle";

// --- 鬯ｮ・ｯ繝ｻ・ｷ繝ｻ縺､ﾂ鬮ｯ・ｷ繝ｻ・･髣包ｽｵ隴会ｽｦ繝ｻ・ｽ郢晢ｽｻ・取鱒繝ｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ ---
export type PhotoSource = {
    uri: string;
    previewUri?: string; // 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｨ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｹ髫ｴ蟇よ・繝ｻ・ｾ繝ｻ・ｭ郢晢ｽｻ陞ｳ闌ｨ・ｽ・､繝ｻ・ｼ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｯ・ｨ繝ｻ・ｾ髯具ｽｹ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｨ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｯ・ｮ繝ｻ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ鬯ｯ・ｯ繝ｻ・ｩ郢晢ｽｻ繝ｻ・･鬮ｯ・ｷ・つ髫ｲ・､隲帛現繝ｻ鬯ｮ・ｯ繝ｻ・ｷ髯句ｹ｢・ｽ・ｵ驛｢譎｢・ｽ・ｻ
    width: number;
    height: number;
    source: "camera" | "import";
    assetId?: string;
    creationTimeMs?: number;
    exifDateTimeOriginalMs?: number;
};

// --- 鬯ｯ・ｩ鬮ｦ・ｪ繝ｻ闌ｨ・ｾ縺､ﾂ髫ｲ蟶ｷ・ｿ・ｫ郢晢ｽｻ鬯ｮ・ｫ繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｱ ---
export type ComputedInfo = {
    shotDateISO: string; // "YYYY-MM-DD"
    ageDays: number;     // 鬯ｯ・ｨ繝ｻ・ｾ髯溘・螻ｮ繝ｻ・ｽ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｷ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｾ鬮ｫ・ｴ繝ｻ・ｴ郢晢ｽｻ繝ｻ・ｧ鬮ｯ貊薙・闔荵昴・繝ｻ・ｬ郢晢ｽｻ繝ｻ・ｨ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｯ・ｩ陝ｶ蜷ｶ繝ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ鬮ｫ・ｲ繝ｻ・ｷ髯ｷ閧ｴ・ｺ蛟･繝ｻ鬯ｮ・ｫ繝ｻ・ｴ鬯ｲ繝ｻ・ｼ螟ｲ・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬯ｮ・ｯ雋・ｽｷ隰梧ｺｯ・ｿ・ｹ繝ｻ・ｳ鬮ｯ貅ｯ・ｼ譁舌・0鬯ｮ・ｫ繝ｻ・ｴ鬯ｲ繝ｻ・ｼ螟ｲ・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
};

// --- 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｪ鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ鬩搾ｽｵ繝ｻ・ｺ髯ｷ・･隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｧ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ ---
export type AgeFormat = "days" | "months_days" | "years_months";

export type EditorOptions = {
    templateId: TemplateId;
    dateColorHex: string;
    commentText: string;
    fontId: FontId;
    filterId: FilterId;
    showDate: boolean;
    showName: boolean;
    showAge: boolean;
    ageFormat: AgeFormat;
};

// --- 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ謔ｶ蜀髫ｲ・､陷･謫ｾ・ｽ・ｹ隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ・ゑｽｧ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ陟托ｽｱ郢晢ｽｻ---
export type AppLibraryItem = {
    id: string; // uuid
    babyIds: string[]; // 鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ鬯ｮ・ｦ繝ｻ・ｮ髯ｷ・ｷ繝ｻ・ｶ驛｢譎｢・ｽ・ｻ鬯ｮ・ｯ繝ｻ・ｷ繝ｻ縺､ﾂ鬮ｯ・ｷ繝ｻ・･髣包ｽｵ隴会ｽｦ繝ｻ・ｽ郢晢ｽｻ邵ｺ蜉ｱ繝ｻ繝ｻ・ｺ鬮ｫ・ｰ騾搾ｽｲ繝ｻ・ｻ郢ｧ謇假ｽｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｱ鬮ｫ・ｶ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｭ鬮ｫ・ｨ陋滂ｽ･郢晢ｽｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ鬯ｩ髦ｪ繝ｻ驕倪・繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｵ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬯ｪ・ｰ陷茨ｽｷ繝ｻ・ｽ繝ｻ・ｸ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮID鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｯ・ｩ陝ｶ蜷ｶ繝ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬮ｴ蜿厄ｽｺ・ｷ繝ｻ・､鬯・ｯ帶ｵｮ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｯ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    source: "camera" | "import";
    originalFileUri: string; // 鬯ｮ・ｯ繝ｻ・ｷ繝ｻ縺､ﾂ鬮ｯ・ｷ繝ｻ・･郢晢ｽｻ繝ｻ・ｲ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｷ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｯ繝ｻ・ｮ郢晢ｽｻ繝ｻ・ｮ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｨ・ｾ繝ｻ・｡驛｢譎｢・ｽ・ｻ
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
    filterId: FilterId;
    showDate: boolean;
    showName: boolean;
    showAge: boolean;
    ageFormat: AgeFormat;
    createdAtMs: number;
};

// --- 鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｦ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｶ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｯ・ｮ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｪ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｮ・ｯ隶厄ｽｸ繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ---
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
    defaultFilterId: FilterId;
    defaultShowDate: boolean;
    defaultShowName: boolean;
    defaultShowAge: boolean;
    defaultAgeFormat: AgeFormat;
    lastTemplateId: TemplateId;
    lastFontId: FontId;
    lastDateColorHex: string;
    policyUrls: PolicyUrls;
};

// --- 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｢鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ謔ｶ蜀郢晢ｽｻ繝ｻ・ｿ郢晢ｽｻ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｶ鬯ｮ・ｫ繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｷ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ---
export type AppState = {
    settings: UserSettings;
    babies: BabyProfile[];
    activeBabyId: string | null;   // 鬯ｮ・ｴ隰・∞・ｽ・ｽ繝ｻ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｾ鬯ｮ・ｯ隲幢ｽｶ繝ｻ・ｽ繝ｻ・ｨ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｯ繝ｻ・ｩ髯具ｽｹ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｸ鬯ｮ・ｫ繝ｻ・ｰ髯橸ｽ｢繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｨ鬮ｮ蜈ｷ・ｽ・ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｸ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｮ・ｫ闖ｫ・ｶ髫ｱ阮吶・繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
    targetBabyIds: string[];       // 鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｿ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｧ鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬯ｮ・｣陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｫ鬮ｫ・ｴ陷ｿ髢・ｾ蜉ｱ繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬮｣雋ｻ・ｽ・ｨ髫ｲ蟶ｷ・ｿ・ｫ郢晢ｽｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬯ｯ・ｩ陝ｶ蜷ｶ繝ｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬮ｴ蜿厄ｽｺ・ｷ繝ｻ・､鬯・ｯ帶ｵｮ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｯ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
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
    // 鬯ｯ・ｮ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｪ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｮ・ｯ隶厄ｽｸ繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    | { type: "SET_ONBOARDED"; payload: boolean }
    | { type: "SET_BIRTHDATE"; payload: string }
    | { type: "SET_BABY_NAME"; payload: string }
    | { type: "SET_DEFAULT_TOGGLES"; payload: { defaultShowDate: boolean; defaultShowName: boolean; defaultShowAge: boolean; defaultAgeFormat: AgeFormat } }
    | { type: "SET_DEFAULT_PREFS"; payload: { defaultTemplateId?: TemplateId; defaultFontId?: FontId; defaultFilterId?: FilterId } }
    | { type: "SET_POLICY_URLS"; payload: PolicyUrls }
    | { type: "SET_LAST_EDITOR_PREFS"; payload: { lastTemplateId: TemplateId; lastDateColorHex: string; lastFontId: FontId } }
    // 鬯ｯ・ｩ隰ｳ・ｾ繝ｻ・ｽ繝ｻ・ｱ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｯ繝ｻ・ｮ郢晢ｽｻ繝ｻ・ｮ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ
    | { type: "SET_PHOTO"; payload: PhotoSource }
    | { type: "SET_COMPUTED"; payload: ComputedInfo }
    | { type: "SET_EDITOR_OPTIONS"; payload: Partial<EditorOptions> }
    | { type: "SET_RENDERED_URI"; payload: string | null }
    | { type: "SET_EDITING_LIBRARY_ID"; payload: string | null }
    | { type: "RESET_EDITOR" }
    // 鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｩ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・､鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ・ゑｽｧ郢晢ｽｻ闕ｳ・ｻ繝ｻ・ｸ繝ｻ・ｷ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｪ
    | { type: "LIBRARY_LOAD"; payload: AppLibraryItem[] }
    | { type: "LIBRARY_ADD"; payload: AppLibraryItem }
    | { type: "LIBRARY_UPDATE"; payload: AppLibraryItem }
    | { type: "LIBRARY_REMOVE"; payload: string }
    // 鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｭ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | undefined }
    // 鬯ｮ・ｯ繝ｻ・ｷ鬮｣魃会ｽｽ・ｨ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｨ鬯ｯ・ｮ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｪ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｭ鬯ｮ・ｯ隶厄ｽｸ繝ｻ・ｽ繝ｻ・ｳ鬮ｯ讖ｸ・ｽ・｢郢晢ｽｻ繝ｻ・ｹ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｺ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ
    | { type: "LOAD_SETTINGS"; payload: UserSettings }
    // 鬯ｮ・ｫ闖ｫ・ｶ髫ｱ阮吶・繝ｻ・ｽ郢晢ｽｻ繝ｻ・､鬯ｩ謳ｾ・ｽ・ｵ郢晢ｽｻ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ驛｢譎｢・ｽ・ｻ鬯ｯ・･繝ｻ・ｴ郢晢ｽｻ郢ｧ繝ｻ繝ｻ郢晢ｽｻ繝ｻ・｡鬯ｯ・ｨ繝ｻ・ｾ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
    | { type: "LOAD_BABIES"; payload: BabyProfile[] }
    | { type: "ADD_BABY"; payload: BabyProfile }
    | { type: "UPDATE_BABY"; payload: BabyProfile }
    | { type: "REMOVE_BABY"; payload: string }
    | { type: "SET_ACTIVE_BABY"; payload: string }
    | { type: "SET_TARGET_BABY_IDS"; payload: string[] };

// --- 鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ郢晢ｽｻ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｦ鬯ｩ蟷｢・ｽ・｢髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ郢晢ｽｻ陷ｿ蜴・ｽｽ・ｨ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬯ｩ蟷｢・ｽ・｢髫ｴ荵励・繝ｻ・ｽ繝ｻ・ｺ郢晢ｽｻ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｮ鬮ｯ讓奇ｽｺ蛛・ｽｽ莉｣繝ｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｾ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｩ ---
export type TemplateConfig = {
    id: TemplateId;
    label: string;
    hasFrame: boolean;
    isSquare: boolean;
    defaultDateColorHex: string;
    /** 鬯ｩ蟷｢・ｽ・｢髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ髯ｷﾂ隴会ｽｦ繝ｻ・ｽ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｹ鬯ｩ蟷｢・ｽ・｢髫ｴ荳ｻ繝ｻ隶捺ｻ・・闔ｨ繝ｻ・ｽ・ｦ繝ｻ・ｴ驍ｵ・ｺ驕会ｽｼ繝ｻ・ｫ闕ｵ諤懃・髯溷供・ｮ・｣・取鱒繝ｻ繝ｻ・ｧ鬮ｯ讒ｭ・・ｹ晢ｽｻ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｼ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻtroke鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｻ鬮ｯ譎｢・ｽ・ｲ郢晢ｽｻ繝ｻ・ｨ驛｢譎｢・ｽ・ｻ髯橸ｽｳ陞溯ｲｫﾂ鬮ｯ蛹ｺ・ｻ繧托ｽｽ・ｽ繝ｻ・･驛｢譎｢・ｽ・ｻ郢晢ｽｻ繝ｻ・ｰ鬯ｩ蟷｢・ｽ・｢郢晢ｽｻ繝ｻ・ｧ鬮｣蛹・ｽｽ・ｵ髫ｰ・ｨ陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｰ */
    hasTextStroke: boolean;
};

// --- 鬯ｮ・ｫ繝ｻ・ｴ鬯ｲ繝ｻ・ｼ螟ｲ・ｽ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・･鬯ｮ・｣騾ｧ・ｮ騾包ｽ･繝ｻ縺､ﾂ郢晢ｽｻ繝ｻ・ｩ鬮ｴ螟ｧ・､・ｲ繝ｻ・ｽ繝ｻ・｡鬯ｩ蟷｢・ｽ・｢髫ｴ荵励・繝ｻ・ｽ繝ｻ・ｻ郢晢ｽｻ繝ｻ・｣郢晢ｽｻ陷ｿ蜴・ｽｽ・ｨ隰夲ｽｵ繝ｻ・ｽ繝ｻ・ｹ髫ｴ謫ｾ・ｽ・ｴ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｨ ---
export type ColorOption = {
    hex: string;
    label: string;
};

// --- 鬯ｩ蟷｢・ｽ・｢髫ｴ蠑ｱ繝ｻ繝ｻ・ｽ繝ｻ・ｼ髫ｴ繝ｻ謳ｨ繝ｻ・ｰ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ鬯ｩ蟷｢・ｽ・｢髫ｴ荳ｻ繝ｻ隶捺ｻ・＠繝ｻ・ｺ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｹ髫ｴ諠ｹ・ｸ讖ｸ・ｽ・ｹ繝ｻ・ｲ鬩搾ｽｵ繝ｻ・ｺ髯ｷ・･隰ｫ・ｾ繝ｻ・ｽ繝ｻ・ｹ髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｧ鬯ｩ蟷｢・ｽ・｢髫ｴ雜｣・ｽ・｢郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｳ ---
export type FontOption = {
    id: FontId;
    label: string;
    file: any;
};
