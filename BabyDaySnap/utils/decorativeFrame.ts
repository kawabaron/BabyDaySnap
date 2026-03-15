export const BERRY_SAKURA_TEMPLATE_ID = "tpl_frame_berry_sakura" as const;
export const BERRY_SAKURA_LAYOUT_SEED = "berry_sakura_layout_v1";

export type DecorativePresetId = "berry_sakura";
export type DecorativeSheetId = "strawberry_sakura_1" | "strawberry_sakura_2";

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type DecorationPlacement = {
    sheetId: DecorativeSheetId;
    source: Rect;
    frame: Rect;
    rotation: number;
};

export type DecorationSeedSource = {
    decorationSeed?: string;
    source?: "camera" | "import";
    width: number;
    height: number;
    assetId?: string;
    creationTimeMs?: number;
    exifDateTimeOriginalMs?: number;
    shotDateISO?: string;
};

type DecorationSprite = {
    kind: "strawberry" | "flower" | "sakura";
    sheetId: DecorativeSheetId;
    source: Rect;
};

type Anchor = {
    xRatio: number;
    yRatio: number;
    minSizeRatio: number;
    maxSizeRatio: number;
    baseRotation: number;
    rotationJitter: number;
    jitterRatio: number;
    preferredKind?: DecorationSprite["kind"];
};

export const DECORATIVE_FRAME_BACKGROUND_COLOR = "#FFF5FA";
export const DECORATIVE_FRAME_LINE_COLOR = "#FF7BC5";
export const DECORATIVE_FRAME_LINE_WIDTH_RATIO = 0.003;

export const DECORATIVE_SHEET_SOURCES: Record<DecorativeSheetId, number> = {
    strawberry_sakura_1: require("../assets/images/strawberry_sakura_1.png"),
    strawberry_sakura_2: require("../assets/images/strawberry_sakura_2.png"),
};

export const DECORATIVE_SHEET_SIZES: Record<DecorativeSheetId, { width: number; height: number }> = {
    strawberry_sakura_1: { width: 459, height: 483 },
    strawberry_sakura_2: { width: 382, height: 413 },
};

const DECORATIVE_SPRITES: DecorationSprite[] = [
    { kind: "sakura", sheetId: "strawberry_sakura_1", source: { x: 4, y: 11, width: 186, height: 184 } },
    { kind: "sakura", sheetId: "strawberry_sakura_1", source: { x: 369, y: 34, width: 86, height: 87 } },
    { kind: "strawberry", sheetId: "strawberry_sakura_1", source: { x: 253, y: 125, width: 106, height: 139 } },
    { kind: "sakura", sheetId: "strawberry_sakura_1", source: { x: 94, y: 224, width: 97, height: 100 } },
    { kind: "sakura", sheetId: "strawberry_sakura_1", source: { x: 294, y: 297, width: 157, height: 154 } },
    { kind: "strawberry", sheetId: "strawberry_sakura_1", source: { x: 18, y: 346, width: 114, height: 127 } },
    { kind: "strawberry", sheetId: "strawberry_sakura_2", source: { x: 259, y: 9, width: 113, height: 106 } },
    { kind: "flower", sheetId: "strawberry_sakura_2", source: { x: 11, y: 12, width: 53, height: 47 } },
    { kind: "strawberry", sheetId: "strawberry_sakura_2", source: { x: 74, y: 18, width: 93, height: 103 } },
    { kind: "flower", sheetId: "strawberry_sakura_2", source: { x: 192, y: 27, width: 45, height: 42 } },
    { kind: "flower", sheetId: "strawberry_sakura_2", source: { x: 305, y: 129, width: 60, height: 55 } },
    { kind: "strawberry", sheetId: "strawberry_sakura_2", source: { x: 257, y: 192, width: 103, height: 119 } },
    { kind: "flower", sheetId: "strawberry_sakura_2", source: { x: 310, y: 349, width: 62, height: 61 } },
];

const FRAME_INSET_RATIO = 0.06;
const FRAME_BOTTOM_INSET_RATIO = 0.18;

const ANCHORS: Anchor[] = [
    { xRatio: 0.05, yRatio: 0.035, minSizeRatio: 0.12, maxSizeRatio: 0.18, baseRotation: -14, rotationJitter: 12, jitterRatio: 0.02 },
    { xRatio: 0.15, yRatio: 0.018, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: -10, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.26, yRatio: 0.02, minSizeRatio: 0.09, maxSizeRatio: 0.15, baseRotation: -8, rotationJitter: 14, jitterRatio: 0.018, preferredKind: "strawberry" },
    { xRatio: 0.4, yRatio: 0.018, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: -3, rotationJitter: 12, jitterRatio: 0.016 },
    { xRatio: 0.56, yRatio: 0.02, minSizeRatio: 0.08, maxSizeRatio: 0.13, baseRotation: 0, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.72, yRatio: 0.02, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: 4, rotationJitter: 12, jitterRatio: 0.016 },
    { xRatio: 0.88, yRatio: 0.035, minSizeRatio: 0.11, maxSizeRatio: 0.17, baseRotation: 10, rotationJitter: 16, jitterRatio: 0.02, preferredKind: "strawberry" },
    { xRatio: 0.985, yRatio: 0.14, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: 10, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.98, yRatio: 0.28, minSizeRatio: 0.08, maxSizeRatio: 0.13, baseRotation: 8, rotationJitter: 16, jitterRatio: 0.018, preferredKind: "strawberry" },
    { xRatio: 0.02, yRatio: 0.52, minSizeRatio: 0.09, maxSizeRatio: 0.14, baseRotation: -10, rotationJitter: 16, jitterRatio: 0.018 },
    { xRatio: 0.985, yRatio: 0.7, minSizeRatio: 0.08, maxSizeRatio: 0.13, baseRotation: 10, rotationJitter: 16, jitterRatio: 0.018 },
    { xRatio: 0.98, yRatio: 0.52, minSizeRatio: 0.09, maxSizeRatio: 0.15, baseRotation: 12, rotationJitter: 16, jitterRatio: 0.018 },
    { xRatio: 0.02, yRatio: 0.76, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: -8, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.05, yRatio: 0.95, minSizeRatio: 0.11, maxSizeRatio: 0.17, baseRotation: -12, rotationJitter: 18, jitterRatio: 0.02, preferredKind: "strawberry" },
    { xRatio: 0.2, yRatio: 0.99, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: -8, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.34, yRatio: 0.99, minSizeRatio: 0.08, maxSizeRatio: 0.13, baseRotation: -4, rotationJitter: 16, jitterRatio: 0.016 },
    { xRatio: 0.52, yRatio: 0.99, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: 2, rotationJitter: 14, jitterRatio: 0.016 },
    { xRatio: 0.68, yRatio: 0.98, minSizeRatio: 0.08, maxSizeRatio: 0.14, baseRotation: 6, rotationJitter: 16, jitterRatio: 0.016, preferredKind: "strawberry" },
    { xRatio: 0.84, yRatio: 0.985, minSizeRatio: 0.07, maxSizeRatio: 0.12, baseRotation: 8, rotationJitter: 14, jitterRatio: 0.016 },
];

function hashSeed(seed: string) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createRng(seed: string) {
    let state = hashSeed(seed) || 1;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function intersects(a: Rect, b: Rect) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function expandRect(rect: Rect, by: number): Rect {
    return {
        x: rect.x - by,
        y: rect.y - by,
        width: rect.width + by * 2,
        height: rect.height + by * 2,
    };
}

function pickSprite(rng: () => number, preferredKind?: DecorationSprite["kind"]) {
    const pool = preferredKind
        ? DECORATIVE_SPRITES.filter((sprite) => sprite.kind === preferredKind)
        : DECORATIVE_SPRITES;
    const candidates = pool.length > 0 ? pool : DECORATIVE_SPRITES;
    return candidates[Math.floor(rng() * candidates.length)];
}

export function resolveDecorationSeed(source: DecorationSeedSource) {
    if (source.decorationSeed) {
        return source.decorationSeed;
    }

    return [
        source.source ?? "unknown",
        source.assetId ?? "",
        source.creationTimeMs ?? "",
        source.exifDateTimeOriginalMs ?? "",
        source.shotDateISO ?? "",
        source.width,
        source.height,
    ].join(":");
}

export function getFramedPhotoRect(canvasW: number, canvasH: number): Rect {
    const shortSide = Math.min(canvasW, canvasH);
    const inset = shortSide * FRAME_INSET_RATIO;
    const bottomInset = shortSide * FRAME_BOTTOM_INSET_RATIO;

    return {
        x: inset,
        y: inset,
        width: canvasW - inset * 2,
        height: canvasH - inset - bottomInset,
    };
}

export function getFramedTextSafeRect(canvasW: number, canvasH: number, hasComment: boolean): Rect {
    const photoRect = getFramedPhotoRect(canvasW, canvasH);
    const shortSide = Math.min(canvasW, canvasH);
    const gap = shortSide * 0.015;
    const textHeight = shortSide * (hasComment ? 0.11 : 0.065);
    const top = photoRect.y + photoRect.height + gap * 0.5;

    return {
        x: canvasW * 0.35,
        y: top,
        width: canvasW * 0.61,
        height: Math.max(textHeight, canvasH - top - shortSide * 0.02),
    };
}

export function getBerrySakuraPlacements(
    canvasW: number,
    canvasH: number,
    options: { seed: string; hasComment: boolean },
): DecorationPlacement[] {
    const rng = createRng(options.seed);
    const shortSide = Math.min(canvasW, canvasH);
    const photoSafeRect = expandRect(getFramedPhotoRect(canvasW, canvasH), -shortSide * 0.01);
    const textSafeRect = expandRect(getFramedTextSafeRect(canvasW, canvasH, options.hasComment), shortSide * 0.02);
    const placements: DecorationPlacement[] = [];

    for (let index = 0; index < ANCHORS.length; index += 1) {
        const anchor = ANCHORS[index];
        let placed: DecorationPlacement | null = null;

        for (let attempt = 0; attempt < 10; attempt += 1) {
            const sprite = pickSprite(rng, anchor.preferredKind);
            const sizeRatio = anchor.minSizeRatio + (anchor.maxSizeRatio - anchor.minSizeRatio) * rng();
            const width = shortSide * sizeRatio;
            const height = width * (sprite.source.height / sprite.source.width);
            const jitter = shortSide * anchor.jitterRatio;
            const minX = -width * 0.45;
            const maxX = canvasW - width * 0.55;
            const minY = -height * 0.45;
            const maxY = canvasH - height * 0.55;
            const x = clamp(
                canvasW * anchor.xRatio - width / 2 + (rng() - 0.5) * jitter * 2,
                minX,
                Math.max(maxX, minX),
            );
            const y = clamp(
                canvasH * anchor.yRatio - height / 2 + (rng() - 0.5) * jitter * 2,
                minY,
                Math.max(maxY, minY),
            );
            const frame = { x, y, width, height };

            if (intersects(frame, photoSafeRect) || intersects(frame, textSafeRect)) {
                continue;
            }

            placed = {
                sheetId: sprite.sheetId,
                source: sprite.source,
                frame,
                rotation: anchor.baseRotation + (rng() - 0.5) * anchor.rotationJitter * 2,
            };
            break;
        }

        if (placed) {
            placements.push(placed);
        }
    }

    return placements;
}
