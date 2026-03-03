// ============================================================
// BabyDaySnap - 日付ユーティリティ
// ============================================================

/**
 * 生後日数を計算
 * birthDateISO と shotDateISO をローカル日付として扱い、
 * 両方を「その日の00:00」に丸めて差分を取る。
 * 誕生日当日 = 生後0日
 */
export function calcAgeDays(birthDateISO: string, shotDateISO: string): number {
    const birth = parseLocalDate(birthDateISO);
    const shot = parseLocalDate(shotDateISO);
    const diffMs = shot.getTime() - birth.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * "YYYY-MM-DD" をローカル日付の00:00としてパースする
 * new Date("YYYY-MM-DD") は UTC 扱いになるため、手動パース
 */
function parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Date を "YYYY-MM-DD" にフォーマット
 */
export function formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * タイムスタンプ(ms) → "YYYY-MM-DD"
 */
export function msToDateISO(ms: number): string {
    return formatDateISO(new Date(ms));
}

/**
 * 日付表示用フォーマット: "YYYY年M月D日"
 */
export function formatDateDisplay(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}年${m}月${d}日`;
}

/**
 * PhotoSourceから撮影日ISOを取得
 */
export function getShotDateISO(
    source: "camera" | "import",
    creationTimeMs?: number,
): string {
    if (source === "camera") {
        return formatDateISO(new Date());
    }
    if (creationTimeMs) {
        return msToDateISO(creationTimeMs);
    }
    // フォールバック: 現在日時
    return formatDateISO(new Date());
}
