// ============================================================
// BabyDaySnap - 鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ・ｷ陷代・・ｽ・ｸ隶捺慣・ｽ・ｲ驍・私・ｽ・ｬ隴ｴ・ｧ髢ｻ・ｸ郢晢ｽｻ繝ｻ・ｼ驛｢譎｢・ｽ・ｻkia驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
// ============================================================
import { Skia, type SkImage, type SkCanvas, type SkTypeface } from "@shopify/react-native-skia";
import { Paths, File } from "expo-file-system";
import { Asset } from "expo-asset";
import { getTemplateConfig, getFontConfig, FONT_OPTIONS } from "./templates";
import type { TemplateId, ComputedInfo, EditorOptions, FontId, FilterId } from "@/types";

const MARGIN_RATIO = 0.04;
const FONT_SIZE_DATE_RATIO = 0.04;
const FONT_SIZE_COMMENT_RATIO = 0.038;
const INSET_RATIO = 0.06; // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫浹鬥ｴ縺励・・ｺ驛｢・ｧ郢晢ｽｻ繝ｻ・ｽ鬯伜∞・ｽ・ｭ陟托ｽｱ繝ｻ繝ｻ・ｹ譎｢・ｽ・ｻ鬮｣蜴・ｽｽ・ｴ髯ｷ・･闕ｳ讓｣・ｰ繝ｻ蟇ｰ髢ｧ・ｲ陜ｮ・ｩ鬩肴得・ｽ・ｫ
const BOTTOM_INSET_RATIO = 0.18; // 鬩幢ｽ｢隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ陷證ｦ・ｽ・ｹ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩幢ｽ｢隴惹ｼ夲ｽｽ・｣繝ｻ・ｯ驛｢譎｢・ｽ・ｻ鬯ｩ蜉ｱ・代・・ｽ繝ｻ・ｮ鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｨ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮｣蛹・ｽｽ・ｳ鬩墓得・ｽ・ｩ繝ｻ荳ｻ・､鬆大牡髯ｷ・･闕ｳ讓｣・ｰ繝ｻ蟇ｰ髢ｧ・ｲ陜ｮ・ｩ鬩肴得・ｽ・ｫ

type RenderParams = {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    editorOptions: EditorOptions;
    computed: ComputedInfo;
    fontId: FontId;
    dateTextLine1: string;
    isMultiBaby: boolean;
};

// 鬮ｯ・ｷ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｺ鬮ｯ・ｷ霑壼遜・ｽ・ｸ繝ｻ・ｷ髯具ｽｻ繝ｻ・､鬮ｯ・ｷ陷代・・ｽ・ｸ驗呻ｽｫ郢晢ｽｻ鬮ｫ・ｴ陝・｢・つ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｧ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｺ (鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｡鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｢鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｪ鬯ｩ蛹・ｽｽ・ｽ繝ｻ縺､ﾂ鬯ｩ蝣ｺ・ｸ鄙ｫ繝ｻ驛｢譎｢・ｽ・ｻ鬩搾ｽｵ繝ｻ・ｺ髮九・竏槭・・ｽ遶擾ｽｬ陝霈斐・繝ｻ・ｶ鬯ｯ・ｮ繝ｻ・ｯ鬮｣髮・莉ｰﾂ驕ｶ謫ｾ・ｽ・ｫ郢晢ｽｻ繝ｻ・ｴ驛｢譎｢・ｽ・ｻ34鬮｣蛹・ｽｽ・ｳ驛｢譎｢・ｽ・ｻ髯具ｽｻ繝ｻ・､鬯ｩ閧ｴ蠕励・・｣繝ｻ・ｰ)
const MAX_OUTPUT_DIMENSION = 2000;

type FilterOverlay = {
    color: string;
    opacity: number;
};

function getFilterOverlay(filterId?: FilterId): FilterOverlay | null {
    switch (filterId) {
        case "filter_milk":
            return { color: "#FFF3E8", opacity: 0.24 };
        case "filter_blossom":
            return { color: "#FFDCE6", opacity: 0.2 };
        case "filter_nap":
            return { color: "#F2E4D7", opacity: 0.22 };
        case "filter_sparkle":
            return { color: "#FFF8D6", opacity: 0.16 };
        default:
            return null;
    }
}

/**
 * 鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ・ｷ陷代・・ｽ・ｸ陞ゅ・・ｽ・ｽ陞ｳ螢ｽ繝ｻ髯懈瑳・ｺ蛟･繝ｻ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ驕ｯ・ｶ繝ｻ・ｻ鬩幢ｽ｢隴弱・・ｽ・ｼ隴∵腸・ｼ諞ｺﾎ斐・・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｫ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｫ・ｴ陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｸ鬩搾ｽｵ繝ｻ・ｺ髫ｶ螳茨ｽｿ・ｫ郢晢ｽｻ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ
 * @returns 鬮ｫ・ｴ陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｸ鬩搾ｽｵ繝ｻ・ｺ髫ｶ螳茨ｽｿ・ｫ郢晢ｽｻ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ繝ｻ・ｹ隴弱・・ｽ・ｼ隴∵腸・ｼ諞ｺﾎ斐・・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｫ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮURI
 */
export async function renderCompositeImage(params: RenderParams): Promise<string> {
    const { imageUri, imageWidth, imageHeight, editorOptions, computed, fontId, dateTextLine1, isMultiBaby } = params;
    const tpl = getTemplateConfig(editorOptions.templateId);

    // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴・搨・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴取ｧｭﾎ鍋ｹ晢ｽｻ繝ｻ・ｪ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ (鬮ｯ・ｷ髢ｧ・ｴ郢晢ｽｻ髯懆ｶ｣・ｽ・ｪ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬯ｮ・ｫ繝ｻ・ｱ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢繝ｻ・ｧ鬮ｦ・ｮ陷ｷ・ｶ・つ陞ｳ螢ｽ蜑ｲ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ髫ｴ荳槭・繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｦ鬩幢ｽ｢繝ｻ・ｧ髣包ｽｵ隴趣ｽ｢繝ｻ・ｼ郢晢ｽｻ繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｨ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｧuseFont鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｡鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｢鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｪ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｪ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｯ鬩幢ｽ｢繝ｻ・ｧ髯晢ｽｶ隴乗・・ｽ・ｺ雋・ｽｯ繝ｻ・ｱ郢晢ｽｻ繝ｻ・ｽ繝ｻ・｢)
    const fontConfig = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
    const [{ localUri }] = await Asset.loadAsync(fontConfig.file);
    if (!localUri) throw new Error("鬩幢ｽ｢隴弱・・ｽ・ｼ隴・搨・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴主・讓滄Δ譎｢・ｽ・ｻ鬯ｮ・ｫ繝ｻ・ｱ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);

    // EXPO鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮFile System鬩幢ｽ｢繝ｻ・ｧ髯ｷ莉｣繝ｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・｣鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｦarrayBuffer鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｨ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ驕ｯ・ｶ繝ｻ・ｻ鬯ｮ・ｫ繝ｻ・ｱ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢繝ｻ・ｧ繝ｻ縺､ﾂ
    const fontData = await Skia.Data.fromURI(localUri);
    const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(fontData);
    fontData.dispose();

    if (!typeface) throw new Error("鬩幢ｽ｢隴弱・・ｽ・ｼ隴・搨・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴主・讓滄Δ譎｢・ｽ・ｻ鬩幢ｽ｢隴乗・・ｽ・ｻ繝ｻ・｣驛｢譎｢・ｽ・ｻ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);

    // 鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ・ｷ髮区ｫ√冠郢晢ｽｻ繝ｻ・ｪ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ
    const imageData = await Skia.Data.fromURI(imageUri);
    const skImage = Skia.Image.MakeImageFromEncoded(imageData);
    if (!skImage) {
        imageData.dispose();
        throw new Error("鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ・ｷ陷代・・ｽ・ｸ驗呻ｽｫ郢晢ｽｻ鬯ｮ・ｫ繝ｻ・ｱ郢晢ｽｻ繝ｻ・ｭ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｼ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);
    }

    // 鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｭ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｣鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴寂・繝ｻ驍ｵ・ｺ陝ｶ・ｷ繝ｻ・ｹ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｺ鬮ｮ謇具ｽｶ・｣繝ｻ・ｽ繝ｻ・ｺ鬮ｯ讖ｸ・ｽ・ｳ驛｢譎｢・ｽ・ｻ(鬮ｯ・ｷ陋ｹ・ｻ郢晢ｽｻ驛｢譎｢・ｽ・ｻ鬮ｮ謇九＃陜ｮ・ｩ鬩肴得・ｽ・ｫ鬩幢ｽ｢繝ｻ・ｧ髯懶ｽ｣繝ｻ・､郢晢ｽｻ繝ｻ・ｶ郢晢ｽｻ繝ｻ・ｭ鬮ｫ・ｰ陜荳翫・郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・､鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・､鬮ｫ・ｴ陝・｢・つ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｧ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ鬮ｮ蛹ｺ・ｧ・ｫ繝ｻ・ｮ陝ｷ繝ｻ・ｽ・ｫ繝ｻ・ｯ驛｢譎｢・ｽ・ｻ
    const baseW = imageWidth;
    const baseH = imageHeight;

    // 鬮ｫ・ｴ陝・｢・つ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｧ鬯ｮ・ｴ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｺ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｺ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｧ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｱ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｫ
    const maxSide = Math.max(baseW, baseH);
    const scale = maxSide > MAX_OUTPUT_DIMENSION ? MAX_OUTPUT_DIMENSION / maxSide : 1;
    const canvasW = Math.round(baseW * scale);
    const canvasH = Math.round(baseH * scale);

    // 鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫ｵｶ蜃ｾ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬮｣蜴・ｽｽ・ｴ髫ｲ蟶帷樟郢晢ｽｻ
    const surface = Skia.Surface.Make(canvasW, canvasH);
    if (!surface) {
        skImage.dispose();
        imageData.dispose();
        throw new Error("鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫ｵｶ蜃ｾ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮｣蜴・ｽｽ・ｴ髫ｲ蟶帷樟郢晢ｽｻ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);
    }

    let outputUri: string;
    try {
        const canvas = surface.getCanvas();

        // 鬯ｮ・｢繝ｻ・ｭ髫ｴ・ｴ繝ｻ・ｧ髯ｷ謳ｾ・ｽ・ｹ
        if (tpl.hasFrame) {
            canvas.drawColor(Skia.Color("#FFFFFF"));
        }

        // 鬮ｯ・ｷ・つ髯ｷ・･闕ｵ證ｦ・ｽ繝ｻ蝙医・・ｰ髯ｷﾂ隲､諛医・
        drawPhoto(canvas, skImage, canvasW, canvasH, editorOptions.templateId, tpl.hasFrame, imageWidth, imageHeight);
        drawFilterOverlay(canvas, canvasW, canvasH, (editorOptions as any).filterId, editorOptions.templateId, tpl.hasFrame);

        // 鬩幢ｽ｢隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ陷證ｦ・ｽ・ｹ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩幢ｽ｢隴惹ｹ暦ｽｲ・ｺ鬩搾ｽｱ陝ｶ謨鳴陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ
        drawText(canvas, canvasW, canvasH, editorOptions, computed, tpl.hasFrame, tpl.hasTextStroke, typeface, dateTextLine1, isMultiBaby);

        // 鬮ｫ・ｴ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｰ鬯ｩ謳ｾ・ｽ・ｱ髯橸ｽ｢繝ｻ・ｽ鬩搾ｽｱ陝ｶ謨鳴陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｯ鬮ｯ譎上・郢晢ｽｻ郢晢ｽｻ繝ｻ・ｭ郢晢ｽｻ繝ｻ・｢驛｢譎｢・ｽ・ｻ髯具ｽｹ繝ｻ・ｻ繝ｻ荳ｻﾂ・｡繝ｻ・ｹ隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｶ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬯ｮ・ｫ髯ｬ諛域｡ｶ髫ｰ豕瑚ｪｿ繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬩幢ｽ｢繝ｻ・ｧ髯具ｽｹ繝ｻ・ｻ郢晢ｽｻ鬯倩ｲｻ・ｽ・ｸ繝ｻ・ｲ驕ｶ謫ｾ・ｽ・ｫ髯ｷ迺ｰﾂ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｵ鬩幢ｽ｢隴擾ｽｶ郢晢ｽｻ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢隴主・蜃ｽ驛｢譎｢・ｽ・ｻ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ鬮ｫ・ｹ繝ｻ・ｿ髣包ｽｵ隴擾ｽｶ郢晢ｽｻ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ

        // 鬯ｩ蠅捺・繝ｻ・ｽ繝ｻ・ｺ鬮ｯ讖ｸ・ｽ・ｳ驛｢譎｢・ｽ・ｻ
        surface.flush();
        const snapshot = surface.makeImageSnapshot();
        if (!snapshot) {
            throw new Error("鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｹ鬩幢ｽ｢隴惹ｼ夲ｽｽ・ｿ繝ｻ・ｫ驛｢譎｢・ｽ・｣鬩幢ｽ｢隴惹ｸ橸ｽｹ・ｲ驍ｵ・ｺ陷･謫ｾ・ｽ・ｹ隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｧ鬩幢ｽ｢隴擾ｽｴ郢晢ｽｻ驛｢譎｢・ｽ・ｨ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮｣蜴・ｽｽ・ｴ髫ｲ蟶帷樟郢晢ｽｻ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);
        }

        try {
            // JPEG 鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮ｫ・ｴ陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｸ鬩搾ｽｵ繝ｻ・ｺ髫ｶ螳茨ｽｿ・ｫ郢晢ｽｻ鬩搾ｽｵ繝ｻ・ｺ髫ｴ莨夲ｽｽ・ｦ郢晢ｽｻ繝ｻ・ｼ驛｢譎｢・ｽ・ｻkia 鬩幢ｽ｢隴取ｨ費ｽｺ繧会ｽｸ・ｺ郢晢ｽｻ繝ｻ・ｹ隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｹ隴弱・ﾂｧ驍ｵ・ｲ陝ｶ譎｢・ｽ・ｬ繝ｻ・ｮ髯区ｻゑｽｽ・ｬ繝ｻ縺､ﾂ髮九・・ｽ・ｷ髯懈ｻゑｽｽ・ｧ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ
            const base64 = snapshot.encodeToBase64(3, 95); // 3 = JPEG, 95 = Quality (鬯ｮ・ｫ驕ｨ繧托ｽｽ・ｹ隴擾ｽｶ髯橸ｽｺ鬯ｨ・ｾ繝ｻ・ｶ郢晢ｽｻ繝ｻ・ｮ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｯ100鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｨ鬮ｯ・ｷ繝ｻ・ｷ髫ｶ蜻ｵ・ｶ・｣繝ｻ・ｽ繝ｻ・ｭ髯晢ｽｲ繝ｻ・ｨ繝ｻ縺､ﾂ驕ｶ荳橸ｽ｣・ｹ・趣ｽｨ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・｡鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｫ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｵ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｺ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｯ40%鬮ｯ・ｷ魄・ｽｹ繝ｻ・ｰ隰・∞・ｽ・ｽ繝ｻ・ｸ驛｢譎｢・ｽ・ｻ
            if (!base64) {
                throw new Error("鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ鬮ｯ・ｷ陷代・・ｽ・ｸ驗呻ｽｫ郢晢ｽｻ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｨ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｳ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｼ鬩幢ｽ｢隴取得・ｽ・ｳ繝ｻ・ｨ驕ｶ鬆托ｽ･・｢隴ｽ譁舌・繝ｻ・ｱ鬮ｫ・ｰ繝ｻ・ｨ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｾ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ髫ｨ・ｳ郢晢ｽｻ);
            }

            // 鬮ｫ・ｴ郢晢ｽｻ繝ｻ・ｽ繝ｻ・ｰ鬩搾ｽｵ繝ｻ・ｺ髯ｷ莨夲ｽｽ・ｱ郢晢ｽｻ隴ｫ・｡xpo-file-system API 鬩幢ｽ｢繝ｻ・ｧ髯ｷ莉｣繝ｻ繝ｻ・ｽ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・｣鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｦ鬩幢ｽ｢隴弱・・ｽ・ｼ隴∵腸・ｼ諞ｺﾎ斐・・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｫ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｫ鬮｣蜴・ｽｽ・ｫ髫ｴ蜿門ｾ励・・ｽ繝ｻ・ｭ驛｢譎｢・ｽ・ｻ
            const outputFile = new File(Paths.cache, `rendered_${Date.now()}.jpg`);

            // base64 -> 鬩幢ｽ｢隴寂・繝ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｹ隴惹ｼ夲ｽｽ・ｿ繝ｻ・ｫ繝ｻ蜿悶渚繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｧ鬮ｫ・ｴ陷ｴ繝ｻ・ｽ・ｽ繝ｻ・ｸ鬩搾ｽｵ繝ｻ・ｺ髯晢｣ｰ髮懶ｽ｣繝ｻ・ｽ繝ｻ・ｾ郢晢ｽｻ繝ｻ・ｼ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｿ
            outputFile.write(base64, { encoding: "base64" });

            outputUri = outputFile.uri;
        } finally {
            snapshot.dispose();
        }
    } finally {
        surface.dispose();
        skImage.dispose();
        imageData.dispose();
        typeface.dispose(); // 鬮｣蜴・ｽｽ・ｴ郢晢ｽｻ繝ｻ・ｿ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ髫ｴ荳槭・繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｦ鬩搾ｽｵ繝ｻ・ｺ鬯ｯ・ｯ繝ｻ・ｱypeface鬩幢ｽ｢繝ｻ・ｧ髯ｷ・ｻ陋ｹ・ｻ郢晢ｽｻ鬯ｩ遨ゑｽｼ螟ｲ・ｽ・ｽ繝ｻ・ｺ鬯ｨ・ｾ繝ｻ・ｧ驛｢譎｢・ｽ・ｻ驕ｶ莨・ｽｦ・ｴ繝ｻ繝ｻ繝ｻ繝ｻ・ｴ鬮ｫ・ｴ繝ｻ・ｽ驛｢譎｢・ｽ・ｻ
    }

    return outputUri;
}

function getCoverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
    const srcAspect = srcW / srcH;
    const dstAspect = dstW / dstH;

    let sW = srcW;
    let sH = srcH;
    let sX = 0;
    let sY = 0;

    if (srcAspect > dstAspect) {
        sW = srcH * dstAspect;
        sX = (srcW - sW) / 2;
    } else {
        sH = srcW / dstAspect;
        sY = (srcH - sH) / 2;
    }
    return { x: sX, y: sY, w: sW, h: sH };
}

function getContainRect(srcW: number, srcH: number, dstW: number, dstH: number) {
    const srcAspect = srcW / srcH;
    const dstAspect = dstW / dstH;

    let dW = dstW;
    let dH = dstH;
    let dX = 0;
    let dY = 0;

    if (srcAspect > dstAspect) {
        dH = dstW / srcAspect;
        dY = (dstH - dH) / 2;
    } else {
        dW = dstH * srcAspect;
        dX = (dstW - dW) / 2;
    }
    return { x: dX, y: dY, w: dW, h: dH };
}

function drawPhoto(
    canvas: SkCanvas,
    image: SkImage,
    canvasW: number,
    canvasH: number,
    templateId: TemplateId,
    hasFrame: boolean,
    origW: number,
    origH: number,
) {
    if (!hasFrame) {
        // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫浹鬥ｴ諱ｷ雋翫ｑ・ｽ・ｽ繝ｻ・｡鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ 鬮ｯ・ｷ髣鯉ｽｨ繝ｻ・ｽ繝ｻ・ｨ鬯ｯ・ｮ繝ｻ・ｱ郢晢ｽｻ繝ｻ・｢鬮ｫ・ｰ繝ｻ・ｰ髯ｷﾂ隲､諛医・
        const srcRect = Skia.XYWHRect(0, 0, origW, origH);
        const dstRect = Skia.XYWHRect(0, 0, canvasW, canvasH);
        canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
    } else {
        const shortSide = Math.min(canvasW, canvasH);
        const inset = shortSide * INSET_RATIO;
        const bottomInset = shortSide * BOTTOM_INSET_RATIO;

        const containerW = canvasW - inset * 2;
        const containerH = canvasH - inset - bottomInset;
        const containerX = inset;
        const containerY = inset;

        if (templateId === "tpl_frame_full") {
            const contain = getContainRect(origW, origH, containerW, containerH);
            const srcRect = Skia.XYWHRect(0, 0, origW, origH);
            const dstRect = Skia.XYWHRect(containerX + contain.x, containerY + contain.y, contain.w, contain.h);
            canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
        } else {
            // tpl_frame_crop or others: cover
            const cover = getCoverRect(origW, origH, containerW, containerH);
            const srcRect = Skia.XYWHRect(cover.x, cover.y, cover.w, cover.h);
            const dstRect = Skia.XYWHRect(containerX, containerY, containerW, containerH);
            canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
        }
    }
}

function drawText(
    canvas: SkCanvas,
    canvasW: number,
    canvasH: number,
    options: EditorOptions,
    computed: ComputedInfo,
    hasFrame: boolean,
    hasStroke: boolean,
    typeface: SkTypeface | null,
    dateTextLine1: string,
    isMultiBaby: boolean,
) {
    const shortSide = Math.min(canvasW, canvasH);
    const baseDateFontSize = shortSide * FONT_SIZE_DATE_RATIO * (isMultiBaby ? 0.75 : 1);
    const baseCommentFontSize = shortSide * FONT_SIZE_COMMENT_RATIO;
    const margin = shortSide * (hasFrame ? 0.08 : 0.04);
    const gap = shortSide * 0.015;

    const dateText = dateTextLine1;
    const hasDateText = dateText.length > 0;
    const hasComment = options.commentText.trim().length > 0;

    // 鬮ｯ蜈ｷ・ｽ・ｻ郢晢ｽｻ繝ｻ・ｩ鬯ｨ・ｾ陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｨ鬮ｯ・ｷ繝ｻ・ｿ郢晢ｽｻ繝ｻ・ｯ鬯ｮ・｢繝ｻ・ｭ郢晢ｽｻ繝ｻ・ｽ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｪ鬮ｫ・ｴ陝・｢・つ鬮ｯ讓奇ｽｻ繧托ｽｽ・ｽ繝ｻ・ｧ鬮ｯ譎｢・ｽ・ｷ驛｢譎｢・ｽ・ｻ
    const maxWidth = canvasW - margin * 2;

    // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴・搨・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴主・讓滄し・ｺ驕会ｽｼ繝ｻ・ｹ繝ｻ・ｧ郢晢ｽｻ繝ｻ・､鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｺ鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮ｮ謇具ｽｶ・｣繝ｻ・ｽ繝ｻ・ｺ鬮ｯ讖ｸ・ｽ・ｳ髯橸ｽ｢繝ｻ・ｹ繝ｻ蜿厄ｽｺ・ｽ繝ｻ・ｹ繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｸ鬩幢ｽ｢隴擾ｽｴ郢晢ｽｻ驍ｵ・ｺ郢晢ｽｻ
    const getAdjustedFontSize = (text: string, baseSize: number) => {
        let size = baseSize;
        const font = Skia.Font(typeface || undefined, size);
        const textWidth = font.measureText(text).width;
        if (textWidth > maxWidth) {
            size = (maxWidth / textWidth) * baseSize;
        }
        return size;
    };

    const dateFontSize = hasDateText ? getAdjustedFontSize(dateText, baseDateFontSize) : baseDateFontSize;
    const commentFontSize = hasComment ? getAdjustedFontSize(options.commentText, baseCommentFontSize) : baseCommentFontSize;

    // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴・搨・ｰ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴寂・・・匚繝ｻ・ｽ・ｽ鬮ｫ・ｰ陟募ｾ後・
    const dateFont = Skia.Font(typeface || undefined, dateFontSize);
    const commentFont = Skia.Font(typeface || undefined, commentFontSize);

    // 鬮ｯ譎｢・ｽ・ｷ驛｢譎｢・ｽ・ｻ驕ｶ鬆托ｽｹ蟷・亊繝ｻ・ｴ髯ｷ・･繝ｻ・ｲ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｮ
    const dateWidth = hasDateText ? dateFont.measureText(dateText).width : 0;
    const dateX = canvasW - margin - dateWidth;

    let dateY = 0;
    let commentY = 0;

    if (hasFrame) {
        // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫浹鬥ｴ縺励・・ｺ驛｢・ｧ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ 鬮ｯ・ｷ・つ髯ｷ・･闕ｵ證ｦ・ｽ繝ｻ縺励・・ｺ郢晢ｽｻ繝ｻ・ｮ鬮｣蛹・ｽｽ・ｳ髴托ｽ｢隴会ｽｦ繝ｻ・ｽ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｯ鬩幢ｽ｢繝ｻ・ｧ鬮ｮ蛹ｺ・ｨ螂・ｽｽ・ｸ隰悟･・ｽｽ・ｲ郢晢ｽｻ邵ｺ蛟｡・ｫ鬆托ｽ･・｢陷ｿ陋ｾ・ｬ莨懌・繝ｻ・ｽ繝ｻ・ｩ郢晢ｽｻ繝ｻ・ｰ鬩幢ｽ｢繝ｻ・ｧ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ鬯ｩ蜉ｱ・代・・ｽ繝ｻ・ｮ
        const bottomInset = shortSide * 0.18; // renderImage鬩搾ｽｵ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮ｯ讖ｸ・ｽ・ｳ髯橸ｽ｢繝ｻ・ｽ髴取ｺ倥・
        const photoBottom = canvasH - bottomInset;

        dateY = photoBottom + gap + dateFontSize; // text baseline
        if (hasComment) {
            commentY = dateY + gap + commentFontSize;
        }
    } else {
        // 鬩幢ｽ｢隴弱・・ｽ・ｼ隴∫浹鬥ｴ縺励・・ｺ郢晢ｽｻ繝ｻ・ｪ鬩搾ｽｵ繝ｻ・ｺ驛｢譎｢・ｽ・ｻ 鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｭ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｣鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴寂・繝ｻ驍ｵ・ｺ陝ｶ・ｷ繝ｻ・ｸ繝ｻ・ｺ郢晢ｽｻ繝ｻ・ｮ鬮｣蛹・ｽｽ・ｳ髴托ｽ｢隴会ｽｦ繝ｻ・ｽ繝ｻ・ｫ郢晢ｽｻ繝ｻ・ｯ鬩幢ｽ｢繝ｻ・ｧ鬮ｮ蛹ｺ・ｨ螂・ｽｽ・ｸ隰悟･・ｽｽ・ｲ郢晢ｽｻ邵ｺ蛟｡・ｫ鬆托ｽ･・｢陷ｿ陋ｾ・・惷繝ｻ・ｽ・ｽ繝ｻ・ｩ郢晢ｽｻ繝ｻ・ｰ鬩幢ｽ｢繝ｻ・ｧ驛｢譎｢・ｽ・ｻ驛｢譎｢・ｽ・ｻ鬯ｩ蜉ｱ・代・・ｽ繝ｻ・ｮ
        if (hasComment) {
            commentY = canvasH - margin;
            dateY = commentY - commentFontSize - gap;
        } else {
            dateY = canvasH - margin;
        }
    }

    if (hasComment) {
        // 鬩幢ｽ｢繝ｻ・ｧ郢晢ｽｻ繝ｻ・ｳ鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・｡鬩幢ｽ｢隴趣ｽ｢繝ｻ・ｽ繝ｻ・ｳ鬩幢ｽ｢隴惹ｹ暦ｽｲ・ｺ鬩搾ｽｱ陝ｶ謨鳴陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ
        const commentWidth = commentFont.measureText(options.commentText).width;
        const commentX = canvasW - margin - commentWidth;

        if (hasStroke) {
            const strokePaint = Skia.Paint();
            strokePaint.setColor(Skia.Color("#000000"));
            strokePaint.setStyle(1); // Stroke
            strokePaint.setStrokeWidth(Math.max(2, commentFontSize * 0.08));
            canvas.drawText(options.commentText, commentX, commentY, strokePaint, commentFont);
        }

        const fillPaint = Skia.Paint();
        fillPaint.setColor(Skia.Color(options.dateColorHex));
        fillPaint.setStyle(0); // Fill
        canvas.drawText(options.commentText, commentX, commentY, fillPaint, commentFont);
    }

    // 鬮ｫ・ｴ鬲・ｼ夲ｽｽ・ｽ繝ｻ・･鬮｣逍ｲ繝ｻ繝ｻ・ｿ繝ｻ・ｶ鬩搾ｽｱ陝ｶ謨鳴陋ｹ繝ｻ・ｽ・ｽ繝ｻ・ｻ
    if (hasDateText) {
        if (hasStroke) {
            const strokePaint = Skia.Paint();
            strokePaint.setColor(Skia.Color("#000000"));
            strokePaint.setStyle(1); // Stroke
            strokePaint.setStrokeWidth(Math.max(2, dateFontSize * 0.08));
            canvas.drawText(dateText, dateX, dateY, strokePaint, dateFont);
        }

        const fillPaint = Skia.Paint();
        fillPaint.setColor(Skia.Color(options.dateColorHex));
        fillPaint.setStyle(0); // Fill
        canvas.drawText(dateText, dateX, dateY, fillPaint, dateFont);
    }
}


function drawFilterOverlay(
    canvas: SkCanvas,
    canvasW: number,
    canvasH: number,
    filterId: FilterId,
    templateId: TemplateId,
    hasFrame: boolean,
) {
    const overlay = getFilterOverlay(filterId);
    if (!overlay) return;

    const paint = Skia.Paint();
    paint.setColor(Skia.Color(overlay.color));
    paint.setAlphaf(overlay.opacity);

    if (!hasFrame) {
        canvas.drawRect(Skia.XYWHRect(0, 0, canvasW, canvasH), paint);
        return;
    }

    const shortSide = Math.min(canvasW, canvasH);
    const inset = shortSide * INSET_RATIO;
    const bottomInset = shortSide * BOTTOM_INSET_RATIO;
    const containerW = canvasW - inset * 2;
    const containerH = canvasH - inset - bottomInset;

    if (templateId === "tpl_frame_full") {
        canvas.drawRect(Skia.XYWHRect(inset, inset, containerW, containerH), paint);
        return;
    }

    canvas.drawRect(Skia.XYWHRect(inset, inset, containerW, containerH), paint);
}