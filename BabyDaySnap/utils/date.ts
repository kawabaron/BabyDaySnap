// ============================================================
// BabyDaySnap - 日付ユーティリティ
// ============================================================
import i18n from '@/lib/i18n';
import type { AgeFormat, DisplayStyle } from "@/types";

const ENGLISH_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const ENGLISH_MONTHS_LONG = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

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
 * 生後を「n年nヶ月n日」で計算
 * 誕生日当日 = 生後0日
 * 撮影日が誕生日より前の場合はマイナスの総日数を返す扱いとし、（既存挙動との互換のため）
 * その場合の表示用フォーマットは `calcAgeDays` と同じようにマイナス日数を返す方針にします。
 */
export function calcAgeMonthsAndDays(birthDateISO: string, shotDateISO: string): { years: number; months: number; days: number; totalDays: number } {
    const totalDays = calcAgeDays(birthDateISO, shotDateISO);

    if (totalDays < 0) {
        return { years: 0, months: 0, days: totalDays, totalDays };
    }

    const birth = parseLocalDate(birthDateISO);
    const shot = parseLocalDate(shotDateISO);

    let years = shot.getFullYear() - birth.getFullYear();
    let months = shot.getMonth() - birth.getMonth();
    let days = shot.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        // 前月の末日を取得して日数を補正
        const prevMonth = new Date(shot.getFullYear(), shot.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days, totalDays };
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

export function formatStyledDateDisplay(dateStr: string, displayStyle: DisplayStyle): string {
    if (displayStyle === "current") {
        return formatDateDisplay(dateStr);
    }

    const cleanStr = dateStr.replace(/-/g, "/");
    const [y, m, d] = cleanStr.split("/").map(Number);
    const monthNames = displayStyle === "soft_english" ? ENGLISH_MONTHS_SHORT : ENGLISH_MONTHS_LONG;

    return `${monthNames[m - 1]} ${d}, ${y}`;
}

export function formatStyledAgeDisplay(params: {
    ageFormat: AgeFormat;
    ageDays: number;
    birthDateISO?: string | null;
    shotDateISO: string;
    displayStyle: DisplayStyle;
}): string {
    const { ageFormat, ageDays, birthDateISO, shotDateISO, displayStyle } = params;

    if (displayStyle === "current") {
        return formatCurrentAgeDisplay(ageFormat, ageDays, birthDateISO, shotDateISO);
    }

    if (ageDays < 0 || !birthDateISO || ageFormat === "days") {
        return formatEnglishDays(ageDays, displayStyle);
    }

    const { years, months, days } = calcAgeMonthsAndDays(birthDateISO, shotDateISO);

    if (ageFormat === "years_months") {
        if (years === 0) {
            if (months === 0) return formatEnglishDays(days, displayStyle);
            return formatEnglishParts([{ value: months, shortLabel: "mo", singular: "month", plural: "months" }], displayStyle);
        }

        const parts = [{ value: years, shortLabel: "yr", singular: "year", plural: "years" }];
        if (months > 0) {
            parts.push({ value: months, shortLabel: "mo", singular: "month", plural: "months" });
        }
        return formatEnglishParts(parts, displayStyle);
    }

    const totalMonths = years * 12 + months;
    if (totalMonths === 0) return formatEnglishDays(days, displayStyle);

    const parts = [{ value: totalMonths, shortLabel: "mo", singular: "month", plural: "months" }];
    if (days > 0) {
        parts.push({ value: days, shortLabel: "d", singular: "day", plural: "days" });
    }
    return formatEnglishParts(parts, displayStyle);
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

function formatCurrentAgeDisplay(
    ageFormat: AgeFormat,
    ageDays: number,
    birthDateISO: string | null | undefined,
    shotDateISO: string,
): string {
    if (ageDays < 0) {
        return i18n.t("editor.ageTextDays", { days: ageDays });
    }

    if (!birthDateISO || ageFormat === "days") {
        return i18n.t("editor.ageTextDays", { days: ageDays });
    }

    const { years, months, days } = calcAgeMonthsAndDays(birthDateISO, shotDateISO);

    if (ageFormat === "years_months") {
        if (years === 0) {
            if (months === 0) return i18n.t("editor.ageTextDays", { days });
            return i18n.t("editor.ageTextMonths", { months });
        }

        if (months === 0) return i18n.t("editor.ageTextYears", { years });
        return i18n.t("editor.ageTextYearsMonths", { years, months });
    }

    const totalMonths = years * 12 + months;
    if (totalMonths === 0) return i18n.t("editor.ageTextDays", { days });
    if (days === 0) return i18n.t("editor.ageTextMonths", { months: totalMonths });
    return i18n.t("editor.ageTextMonthsDays", { months: totalMonths, days });
}

function formatEnglishDays(days: number, displayStyle: DisplayStyle): string {
    if (displayStyle === "soft_english") {
        return `Day ${days}`;
    }

    const label = Math.abs(days) === 1 ? "day" : "days";
    const text = `${days} ${label}`;
    return displayStyle === "keepsake_english" ? toTitleCase(text) : text;
}

function formatEnglishParts(
    parts: Array<{ value: number; shortLabel: string; singular: string; plural: string }>,
    displayStyle: DisplayStyle,
): string {
    if (displayStyle === "soft_english") {
        return parts.map((part) => `${part.value} ${part.shortLabel}`).join(" ");
    }

    const separator = displayStyle === "keepsake_english" ? ", " : " ";
    const text = parts
        .map((part) => `${part.value} ${part.value === 1 ? part.singular : part.plural}`)
        .join(separator);

    return displayStyle === "keepsake_english" ? toTitleCase(text) : text;
}

function toTitleCase(text: string): string {
    return text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
