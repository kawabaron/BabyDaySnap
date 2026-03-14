import type { FilterId } from "@/types";

export type FilterOption = {
    id: FilterId;
    labelKey: string;
    color: string;
    opacity: number;
};

export const FILTER_OPTIONS: FilterOption[] = [
    { id: "filter_none", labelKey: "filters.filter_none", color: "transparent", opacity: 0 },
    { id: "filter_milk", labelKey: "filters.filter_milk", color: "#FFF3E8", opacity: 0.24 },
    { id: "filter_blossom", labelKey: "filters.filter_blossom", color: "#FFDCE6", opacity: 0.2 },
    { id: "filter_nap", labelKey: "filters.filter_nap", color: "#F2E4D7", opacity: 0.22 },
    { id: "filter_sparkle", labelKey: "filters.filter_sparkle", color: "#FFF8D6", opacity: 0.16 },
];

export function getFilterOption(filterId?: FilterId): FilterOption {
    return FILTER_OPTIONS.find((option) => option.id === filterId) ?? FILTER_OPTIONS[0];
}
