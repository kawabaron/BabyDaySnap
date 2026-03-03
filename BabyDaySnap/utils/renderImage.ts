// ============================================================
// BabyDaySnap - 画像合成（Skia）
// ============================================================
import { Skia, type SkImage, type SkCanvas } from "@shopify/react-native-skia";
import { Paths, File } from "expo-file-system";
import { getTemplateConfig } from "./templates";
import type { TemplateId, ComputedInfo, EditorOptions } from "@/types";

const MARGIN_RATIO = 0.04;
const FONT_SIZE_DATE_RATIO = 0.04;
const FONT_SIZE_COMMENT_RATIO = 0.038;
const INSET_RATIO = 0.06; // フチあり時の余白比率

type RenderParams = {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    editorOptions: EditorOptions;
    computed: ComputedInfo;
};

/**
 * 画像を合成してファイルに書き出す
 * @returns 書き出したファイルのURI
 */
export async function renderCompositeImage(params: RenderParams): Promise<string> {
    const { imageUri, imageWidth, imageHeight, editorOptions, computed } = params;
    const tpl = getTemplateConfig(editorOptions.templateId);

    // 画像読み込み
    const imageData = await Skia.Data.fromURI(imageUri);
    const skImage = Skia.Image.MakeImageFromEncoded(imageData);
    if (!skImage) {
        throw new Error("画像の読み込みに失敗しました");
    }

    // キャンバスサイズ決定
    let canvasW: number;
    let canvasH: number;

    if (tpl.isSquare) {
        const side = Math.min(imageWidth, imageHeight);
        canvasW = side;
        canvasH = side;
    } else {
        canvasW = imageWidth;
        canvasH = imageHeight;
    }

    // サーフェス作成
    const surface = Skia.Surface.Make(canvasW, canvasH);
    if (!surface) {
        throw new Error("サーフェスの作成に失敗しました");
    }

    const canvas = surface.getCanvas();

    // 背景
    if (tpl.hasFrame) {
        canvas.drawColor(Skia.Color("#FFFFFF"));
    }

    // 写真描画
    drawPhoto(canvas, skImage, canvasW, canvasH, tpl.hasFrame, tpl.isSquare, imageWidth, imageHeight);

    // テキスト描画
    drawText(canvas, canvasW, canvasH, editorOptions, computed, tpl.hasFrame, tpl.hasTextStroke);

    // 確定
    surface.flush();
    const snapshot = surface.makeImageSnapshot();
    if (!snapshot) {
        throw new Error("スナップショットの作成に失敗しました");
    }

    // JPEG に書き出し
    const encoded = snapshot.encodeToBytes();
    if (!encoded) {
        throw new Error("画像のエンコードに失敗しました");
    }

    // 新しいexpo-file-system API を使ってファイルに保存
    const outputFile = new File(Paths.cache, `rendered_${Date.now()}.jpg`);
    const base64 = uint8ArrayToBase64(encoded);

    // base64 -> バイナリで書き込み
    outputFile.write(base64, { encoding: "base64" });

    return outputFile.uri;
}

function drawPhoto(
    canvas: SkCanvas,
    image: SkImage,
    canvasW: number,
    canvasH: number,
    hasFrame: boolean,
    isSquare: boolean,
    origW: number,
    origH: number,
) {
    if (!hasFrame) {
        // フチ無し: 全面描画
        const srcRect = Skia.XYWHRect(0, 0, origW, origH);
        const dstRect = Skia.XYWHRect(0, 0, canvasW, canvasH);
        canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
    } else {
        const inset = Math.min(canvasW, canvasH) * INSET_RATIO;

        if (isSquare) {
            // スクエア: center-crop して正方形
            const side = Math.min(origW, origH);
            const sx = (origW - side) / 2;
            const sy = (origH - side) / 2;
            const srcRect = Skia.XYWHRect(sx, sy, side, side);
            const dstRect = Skia.XYWHRect(inset, inset, canvasW - inset * 2, canvasH - inset * 2);
            canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());
        } else {
            // フチあり全面: inset で縮小配置
            const srcRect = Skia.XYWHRect(0, 0, origW, origH);
            const dstRect = Skia.XYWHRect(inset, inset, canvasW - inset * 2, canvasH - inset * 2);
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
) {
    const shortSide = Math.min(canvasW, canvasH);
    const dateFontSize = shortSide * FONT_SIZE_DATE_RATIO;
    const commentFontSize = shortSide * FONT_SIZE_COMMENT_RATIO;
    const margin = shortSide * MARGIN_RATIO;

    const dateText = `${computed.shotDateISO}  生後${computed.ageDays}日`;

    // フォント
    const fontMgr = Skia.FontMgr.System();
    const typeface = fontMgr.matchFamilyStyle("System", { weight: 600 });
    const dateFont = Skia.Font(typeface ?? undefined, dateFontSize);
    const commentFont = Skia.Font(typeface ?? undefined, commentFontSize);

    // 日付テキスト
    const dateWidth = dateFont.measureText(dateText).width;
    const dateX = canvasW - margin - dateWidth;
    let dateY = canvasH - margin;

    // コメントがある場合はその分上にずらす
    const hasComment = options.commentText.trim().length > 0;
    if (hasComment) {
        dateY = canvasH - margin;
        const commentY = dateY - dateFontSize - 4;

        // コメント描画
        const commentWidth = commentFont.measureText(options.commentText).width;
        const commentX = canvasW - margin - commentWidth;

        if (hasStroke) {
            // 縁取り（黒ストローク）
            const strokePaint = Skia.Paint();
            strokePaint.setColor(Skia.Color("#000000"));
            strokePaint.setStyle(1); // Stroke
            strokePaint.setStrokeWidth(Math.max(2, dateFontSize * 0.08));
            canvas.drawText(options.commentText, commentX, commentY, strokePaint, commentFont);
        }

        // 塗り
        const fillPaint = Skia.Paint();
        fillPaint.setColor(Skia.Color(options.dateColorHex));
        fillPaint.setStyle(0); // Fill
        canvas.drawText(options.commentText, commentX, commentY, fillPaint, commentFont);
    }

    // 日付描画
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

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
