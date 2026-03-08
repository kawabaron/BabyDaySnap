// ============================================================
// BabyDaySnap - 日付ユーティリティ
// ============================================================
import i18n from '@/lib/i18n';

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
 * 生後を「nヶ月n日」で計算
 * 誕生日当日 = 生後0日
 * 撮影日が誕生日より前の場合はマイナスの総日数を返す扱いとし、（既存挙動との互換のため）
 * その場合の表示用フォーマットは `calcAgeDays` と同じようにマイナス日数を返す方針にします。
 */
export function calcAgeMonthsAndDays(birthDateISO: string, shotDateISO: string): { months: number; days: number; totalDays: number } {
    const totalDays = calcAgeDays(birthDateISO, shotDateISO);

    if (totalDays < 0) {
        return { months: 0, days: totalDays, totalDays };
    }

    const birth = parseLocalDate(birthDateISO);
    const shot = parseLocalDate(shotDateISO);

    let months = (shot.getFullYear() - birth.getFullYear()) * 12 + (shot.getMonth() - birth.getMonth());
    let days = shot.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        // 前月の末日を取得して日数を補正
        const prevMonth = new Date(shot.getFullYear(), shot.getMonth(), 0);
        days += prevMonth.getDate();
    }

    return { months, days, totalDays };
}

/**
 * "YYYY/MM/DD" 等をローカル日付の00:00としてパースする
 * new Date("YYYY-MM-DD") は UTC 扱いになるため、手動パース
 */
function parseLocalDate(dateStr: string): Date {
    const cleanStr = dateStr.replace(/-/g, "/");
    const [y, m, d] = cleanStr.split("/").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Date を "YYYY/MM/DD" にフォーマット
 */
export function formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
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
export function formatDateDisplay(dateStr: string): string {
    const cleanStr = dateStr.replace(/-/g, "/");
    const [y, m, d] = cleanStr.split("/").map(Number);
    return i18n.t("editor.dateDisplay", { year: y, month: m, day: d });
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
