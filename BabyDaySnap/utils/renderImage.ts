// ============================================================
// BabyDaySnap - 画像合成（Skia）
// ============================================================
import { Skia, type SkImage, type SkCanvas, type SkTypeface } from "@shopify/react-native-skia";
import { Paths, File } from "expo-file-system";
import { getTemplateConfig, getFontConfig } from "./templates";
import type { TemplateId, ComputedInfo, EditorOptions, FontId } from "@/types";

const MARGIN_RATIO = 0.04;
const FONT_SIZE_DATE_RATIO = 0.04;
const FONT_SIZE_COMMENT_RATIO = 0.038;
const INSET_RATIO = 0.06; // フチあり時の余白比率
const BOTTOM_INSET_RATIO = 0.18; // テキスト配置用の下部余白比率

type RenderParams = {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    editorOptions: EditorOptions;
    computed: ComputedInfo;
    typeface: SkTypeface | null;
    babyName: string;
};

// 出力画像の最大辺サイズ (メモリ節約のため制限)
const MAX_OUTPUT_DIMENSION = 3000;

/**
 * 画像を合成してファイルに書き出す
 * @returns 書き出したファイルのURI
 */
export async function renderCompositeImage(params: RenderParams): Promise<string> {
    const { imageUri, imageWidth, imageHeight, editorOptions, computed, typeface, babyName } = params;
    const tpl = getTemplateConfig(editorOptions.templateId);

    // 画像読み込み
    const imageData = await Skia.Data.fromURI(imageUri);
    const skImage = Skia.Image.MakeImageFromEncoded(imageData);
    if (!skImage) {
        imageData.dispose();
        throw new Error("画像の読み込みに失敗しました");
    }

    // キャンバスサイズ決定 (元の比率を維持しつつ最大辺を制限)
    const baseW = imageWidth;
    const baseH = imageHeight;

    // 最大辺サイズでスケール
    const maxSide = Math.max(baseW, baseH);
    const scale = maxSide > MAX_OUTPUT_DIMENSION ? MAX_OUTPUT_DIMENSION / maxSide : 1;
    const canvasW = Math.round(baseW * scale);
    const canvasH = Math.round(baseH * scale);

    // サーフェス作成
    const surface = Skia.Surface.Make(canvasW, canvasH);
    if (!surface) {
        skImage.dispose();
        imageData.dispose();
        throw new Error("サーフェスの作成に失敗しました");
    }

    let outputUri: string;
    try {
        const canvas = surface.getCanvas();

        // 背景
        if (tpl.hasFrame) {
            canvas.drawColor(Skia.Color("#FFFFFF"));
        }

        // 写真描画
        drawPhoto(canvas, skImage, canvasW, canvasH, tpl.hasFrame, imageWidth, imageHeight);

        // テキスト描画
        drawText(canvas, canvasW, canvasH, editorOptions, computed, tpl.hasFrame, tpl.hasTextStroke, typeface, babyName);

        // 確定
        surface.flush();
        const snapshot = surface.makeImageSnapshot();
        if (!snapshot) {
            throw new Error("スナップショットの作成に失敗しました");
        }

        try {
            // JPEG に書き出し（Skia ネイティブで高速化）
            const base64 = snapshot.encodeToBase64(3, 100); // 3 = JPEG, 100 = Quality
            if (!base64) {
                throw new Error("画像のエンコードに失敗しました");
            }

            // 新しいexpo-file-system API を使ってファイルに保存
            const outputFile = new File(Paths.cache, `rendered_${Date.now()}.jpg`);

            // base64 -> バイナリで書き込み
            outputFile.write(base64, { encoding: "base64" });

            outputUri = outputFile.uri;
        } finally {
            snapshot.dispose();
        }
    } finally {
        surface.dispose();
        skImage.dispose();
        imageData.dispose();
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

function drawPhoto(
    canvas: SkCanvas,
    image: SkImage,
    canvasW: number,
    canvasH: number,
    hasFrame: boolean,
    origW: number,
    origH: number,
) {
    if (!hasFrame) {
        // フチ無し: 全面描画
        const srcRect = Skia.XYWHRect(0, 0, origW, origH);
        const dstRect = Skia.XYWHRect(0, 0, canvasW, canvasH);
        canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
    } else {
        const shortSide = Math.min(canvasW, canvasH);
        const inset = shortSide * INSET_RATIO;
        const bottomInset = shortSide * BOTTOM_INSET_RATIO;

        const dstW = canvasW - inset * 2;
        const dstH = canvasH - inset - bottomInset;
        const dstX = inset;
        const dstY = inset;

        const cover = getCoverRect(origW, origH, dstW, dstH);
        const srcRect = Skia.XYWHRect(cover.x, cover.y, cover.w, cover.h);
        const dstRect = Skia.XYWHRect(dstX, dstY, dstW, dstH);

        canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
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
    babyName: string,
) {
    const shortSide = Math.min(canvasW, canvasH);
    const dateFontSize = shortSide * FONT_SIZE_DATE_RATIO;
    const commentFontSize = shortSide * FONT_SIZE_COMMENT_RATIO;
    const margin = shortSide * MARGIN_RATIO;
    const gap = shortSide * 0.015;

    const dateText = [
        options.showDate ? computed.shotDateISO : null,
        options.showName && babyName ? babyName : null,
        options.showAge ? `生後${computed.ageDays}日` : null
    ].filter(Boolean).join("  ");

    const hasDateText = dateText.length > 0;

    // フォント生成
    const dateFont = Skia.Font(typeface || undefined, dateFontSize);
    const commentFont = Skia.Font(typeface || undefined, commentFontSize);

    // 幅とX位置
    const dateWidth = hasDateText ? dateFont.measureText(dateText).width : 0;
    const dateX = canvasW - margin - dateWidth;

    let dateY = 0;
    let commentY = 0;
    const hasComment = options.commentText.trim().length > 0;

    if (hasFrame) {
        // フチあり: 写真の下端を基準に上詰め配置
        const bottomInset = shortSide * 0.18; // renderImageの定数
        const photoBottom = canvasH - bottomInset;

        dateY = photoBottom + gap + dateFontSize; // text baseline
        if (hasComment) {
            commentY = dateY + gap + commentFontSize;
        }
    } else {
        // フチなし: キャンバスの下端を基準に下詰め配置
        if (hasComment) {
            commentY = canvasH - margin;
            dateY = commentY - commentFontSize - gap;
        } else {
            dateY = canvasH - margin;
        }
    }

    if (hasComment) {
        // コメント描画
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

    // 日付描画
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

