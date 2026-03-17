import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { CreateBannerAd } from "@/components/ads/CreateBannerAd";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import { useActiveBaby, useAppDispatch, useAppState } from "@/context/AppContext";
import i18n from "@/lib/i18n";
import type { AppLibraryItem } from "@/types";
import { calcAgeDays, formatStyledAgeDisplay } from "@/utils/date";
import { deleteFromAppLibrary, saveToPhotoLibrary } from "@/utils/saveImage";

const MONTH_NAMES = [
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_HORIZONTAL_PADDING = 8;
const GRID_GAP = 2;
const SMALL_TILE_SIZE = (SCREEN_WIDTH - PAGE_HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3;
const HERO_TILE_HEIGHT = Math.round(SCREEN_WIDTH * 1.08);
const MIXED_TILE_WIDTH = SMALL_TILE_SIZE * 2 + GRID_GAP;
const MIXED_TILE_HEIGHT = SMALL_TILE_SIZE * 2 + GRID_GAP;
const LAYOUT_CYCLE_SIZE = 10;

type MonthGroup = {
    key: string;
    year: number;
    month: number;
    monthName: string;
    items: AppLibraryItem[];
    blocks: AppLibraryItem[][];
    heroAgeLabel: string | null;
};

export default function LibraryGridScreen() {
    const { library, babies, activeBabyId } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const activeBaby = useActiveBaby();
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBabyPicker, setShowBabyPicker] = useState(false);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    const monthPagerRef = useRef<FlatList<MonthGroup>>(null);

    const filteredLibrary = useMemo(() => {
        const baseLibrary = activeBabyId
            ? library.filter((item) => item.babyIds.includes(activeBabyId))
            : library;

        return [...baseLibrary].sort((a, b) => {
            if (a.shotDateISO !== b.shotDateISO) {
                return b.shotDateISO.localeCompare(a.shotDateISO);
            }
            return b.createdAtMs - a.createdAtMs;
        });
    }, [activeBabyId, library]);

    const monthGroups = useMemo<MonthGroup[]>(() => {
        const groups = new Map<string, AppLibraryItem[]>();

        for (const item of filteredLibrary) {
            const [yearPart, monthPart] = item.shotDateISO.split("/");
            const key = `${yearPart}-${monthPart}`;
            const existing = groups.get(key);
            if (existing) {
                existing.push(item);
            } else {
                groups.set(key, [item]);
            }
        }

        return Array.from(groups.entries())
            .sort(([leftKey], [rightKey]) => rightKey.localeCompare(leftKey))
            .map(([key, items]) => {
                const [year, month] = key.split("-").map(Number);
                const heroItem = items[0];
                const heroAgeLabel =
                    activeBaby?.birthDateISO && heroItem
                        ? formatStyledAgeDisplay({
                            ageFormat: "years_months",
                            ageDays: calcAgeDays(activeBaby.birthDateISO, heroItem.shotDateISO),
                            birthDateISO: activeBaby.birthDateISO,
                            shotDateISO: heroItem.shotDateISO,
                            displayStyle: "current",
                        })
                        : null;

                const blocks: AppLibraryItem[][] = [];
                for (let index = 0; index < items.length; index += LAYOUT_CYCLE_SIZE) {
                    blocks.push(items.slice(index, index + LAYOUT_CYCLE_SIZE));
                }

                return {
                    key,
                    year,
                    month,
                    monthName: MONTH_NAMES[month - 1] ?? "",
                    items,
                    blocks,
                    heroAgeLabel,
                };
            });
    }, [activeBaby?.birthDateISO, filteredLibrary]);

    useEffect(() => {
        setIsSelectionMode(false);
        setSelectedIds([]);
        setSelectedMonthIndex(0);
        if (monthPagerRef.current) {
            monthPagerRef.current.scrollToOffset({ offset: 0, animated: false });
        }
    }, [activeBabyId]);

    useEffect(() => {
        if (monthGroups.length === 0) {
            setSelectedMonthIndex(0);
            return;
        }

        if (selectedMonthIndex > monthGroups.length - 1) {
            setSelectedMonthIndex(0);
        }
    }, [monthGroups.length, selectedMonthIndex]);

    const currentMonth = monthGroups[selectedMonthIndex] ?? null;

    const toggleSelectionMode = useCallback(() => {
        setIsSelectionMode((previous) => !previous);
        setSelectedIds([]);
    }, []);

    const handlePress = useCallback(
        (item: AppLibraryItem) => {
            if (isSelectionMode) {
                setSelectedIds((previous) =>
                    previous.includes(item.id)
                        ? previous.filter((id) => id !== item.id)
                        : [...previous, item.id],
                );
                return;
            }

            router.push(`/(tabs)/library/${item.id}`);
        },
        [isSelectionMode, router],
    );

    const handleDeleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;

        Alert.alert(
            i18n.t("library.deleteConfirmTitle"),
            i18n.t("library.deleteConfirmMsg", { count: selectedIds.length }),
            [
                { text: i18n.t("library.cancel"), style: "cancel" },
                {
                    text: i18n.t("library.delete"),
                    style: "destructive",
                    onPress: async () => {
                        const itemsToDelete = library.filter((item) => selectedIds.includes(item.id));
                        for (const item of itemsToDelete) {
                            await deleteFromAppLibrary(item);
                            dispatch({ type: "LIBRARY_REMOVE", payload: item.id });
                        }
                        setIsSelectionMode(false);
                        setSelectedIds([]);
                    },
                },
            ],
        );
    }, [dispatch, library, selectedIds]);

    const handleSaveSelected = useCallback(async () => {
        if (selectedIds.length === 0) return;

        const itemsToSave = library.filter((item) => selectedIds.includes(item.id));
        let successCount = 0;

        for (const item of itemsToSave) {
            const success = await saveToPhotoLibrary(item.renderedFileUri);
            if (success) successCount++;
        }

        if (successCount === itemsToSave.length) {
            Alert.alert(i18n.t("library.saveCompleteTitle"), i18n.t("library.saveCompleteMsg", { count: successCount }));
        } else if (successCount > 0) {
            Alert.alert(i18n.t("library.saveCompleteTitle"), i18n.t("library.savePartialMsg", { count: successCount }));
        }

        setIsSelectionMode(false);
        setSelectedIds([]);
    }, [library, selectedIds]);

    const handleSelectBaby = useCallback(
        (babyId: string) => {
            dispatch({ type: "SET_ACTIVE_BABY", payload: babyId });
            setShowBabyPicker(false);
            setIsSelectionMode(false);
            setSelectedIds([]);
        },
        [dispatch],
    );

    const scrollToMonth = useCallback((index: number) => {
        setSelectedMonthIndex(index);
        monthPagerRef.current?.scrollToIndex({ index, animated: true });
    }, []);

    const renderPhotoTile = useCallback(
        (
            item: AppLibraryItem | undefined,
            tileStyle: object,
            options?: {
                tileKey?: string;
                showMonthOverlay?: boolean;
                monthName?: string;
                year?: number;
                ageLabel?: string | null;
            },
        ) => {
            if (!item) {
                return <View key={options?.tileKey} style={[styles.tilePlaceholder, tileStyle]} />;
            }

            const isSelected = selectedIds.includes(item.id);

            return (
                <TouchableOpacity
                    key={options?.tileKey ?? item.id}
                    style={[styles.photoTile, tileStyle]}
                    onPress={() => handlePress(item)}
                    activeOpacity={0.92}
                >
                    <Image source={{ uri: item.renderedFileUri }} style={styles.photoImage} resizeMode="cover" />
                    {options?.showMonthOverlay ? (
                        <>
                            <View style={styles.heroShade} />
                            <View style={styles.heroOverlay}>
                                <Text style={styles.heroMonth}>{options.monthName}</Text>
                                <Text style={styles.heroYear}>{options.year}</Text>
                                {options.ageLabel ? <Text style={styles.heroAge}>{options.ageLabel}</Text> : null}
                            </View>
                        </>
                    ) : null}
                    {isSelectionMode ? (
                        <View style={[styles.selectionOverlay, isSelected && [styles.selectionOverlayActive, { borderColor: theme.accent }]]}>
                            <Ionicons
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={isSelected ? theme.accent : "rgba(255,255,255,0.9)"}
                            />
                        </View>
                    ) : null}
                </TouchableOpacity>
            );
        },
        [handlePress, isSelectionMode, selectedIds, theme.accent],
    );

    const renderThreeUpRow = useCallback(
        (items: Array<AppLibraryItem | undefined>, rowKey: string) => (
            <View style={styles.smallRow} key={rowKey}>
                {items.map((item, index) =>
                    renderPhotoTile(
                        item,
                        { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE },
                        { tileKey: `${rowKey}-${index}` },
                    ),
                )}
            </View>
        ),
        [renderPhotoTile],
    );

    const renderMixedRow = useCallback(
        (items: Array<AppLibraryItem | undefined>, rowKey: string) => {
            const [leftItem, topRightItem, bottomRightItem] = items;
            const hasAnyItem = items.some(Boolean);

            if (!hasAnyItem) {
                return null;
            }

            return (
                <View style={styles.mixedRow} key={rowKey}>
                    {renderPhotoTile(leftItem, { width: MIXED_TILE_WIDTH, height: MIXED_TILE_HEIGHT }, { tileKey: `${rowKey}-left` })}
                    <View style={styles.mixedColumn}>
                        {renderPhotoTile(topRightItem, { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE }, { tileKey: `${rowKey}-top` })}
                        {renderPhotoTile(bottomRightItem, { width: SMALL_TILE_SIZE, height: SMALL_TILE_SIZE }, { tileKey: `${rowKey}-bottom` })}
                    </View>
                </View>
            );
        },
        [renderPhotoTile],
    );

    const renderMonthBlock = useCallback(
        ({ item, index, month }: { item: AppLibraryItem[]; index: number; month: MonthGroup }) => {
            const heroItem = item[0];
            const topRowItems = [item[1], item[2], item[3]];
            const mixedRowItems = [item[4], item[5], item[6]];
            const bottomRowItems = [item[7], item[8], item[9]];

            return (
                <View style={styles.monthBlock}>
                    {renderPhotoTile(heroItem, { width: "100%", height: HERO_TILE_HEIGHT }, {
                        tileKey: `${month.key}-hero-${index}`,
                        ...(index === 0
                            ? {
                                showMonthOverlay: true,
                                monthName: month.monthName,
                                year: month.year,
                                ageLabel: month.heroAgeLabel,
                            }
                            : {}),
                    })}
                    {topRowItems.some(Boolean) ? renderThreeUpRow(topRowItems, `${month.key}-top-${index}`) : null}
                    {renderMixedRow(mixedRowItems, `${month.key}-mixed-${index}`)}
                    {bottomRowItems.some(Boolean) ? renderThreeUpRow(bottomRowItems, `${month.key}-bottom-${index}`) : null}
                </View>
            );
        },
        [renderMixedRow, renderPhotoTile, renderThreeUpRow],
    );

    const renderMonthPage = useCallback(
        ({ item }: { item: MonthGroup }) => (
            <View style={styles.monthPage}>
                <FlatList
                    data={item.blocks}
                    keyExtractor={(_, index) => `${item.key}-${index}`}
                    renderItem={({ item: block, index }) => renderMonthBlock({ item: block, index, month: item })}
                    contentContainerStyle={[
                        styles.monthPageContent,
                        isSelectionMode && styles.monthPageContentWithBottomBar,
                    ]}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    initialNumToRender={3}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                />
            </View>
        ),
        [isSelectionMode, renderMonthBlock],
    );

    const headerLeftSlot = filteredLibrary.length > 0 ? (
        <TouchableOpacity
            onPress={toggleSelectionMode}
            style={[styles.headerButton, styles.selectButton, { backgroundColor: theme.light }]}
            activeOpacity={0.8}
        >
            <Text style={[styles.headerButtonText, { color: theme.accent }]}>
                {isSelectionMode ? i18n.t("library.cancelModeButton") : i18n.t("library.selectModeButton")}
            </Text>
        </TouchableOpacity>
    ) : null;

    const headerRightSlot = activeBaby ? (
        <TouchableOpacity
            style={styles.switchBadge}
            onPress={() => setShowBabyPicker(true)}
            activeOpacity={0.7}
        >
            <View style={[styles.switchBadgeDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.switchBadgeText, { color: theme.accent }]}>
                {activeBaby.name}
            </Text>
            <Ionicons name="chevron-down" size={12} color={theme.accent} style={styles.switchBadgeChevron} />
        </TouchableOpacity>
    ) : null;

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <AppHeader
                title={activeBaby ? activeBaby.name : i18n.t("library.headerTitle")}
                subtitle={i18n.t("library.headerCount", { count: filteredLibrary.length })}
                leftSlot={headerLeftSlot}
                rightSlot={headerRightSlot}
                sideWidth={124}
            />
            <CreateBannerAd />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {babies.length === 0 || monthGroups.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="images-outline" size={64} color="#DDD" />
                        <Text style={styles.emptyTitle}>{i18n.t("library.emptyTitle")}</Text>
                        <Text style={styles.emptySubtitle}>{i18n.t("library.emptySubtitle")}</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.monthHeader}>
                            <Text style={[styles.monthYearLabel, { color: theme.accent }]}>
                                {currentMonth?.year ?? ""}
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.monthTabsContent}
                            >
                                {monthGroups.map((month, index) => {
                                    const isActive = index === selectedMonthIndex;
                                    return (
                                        <TouchableOpacity
                                            key={month.key}
                                            style={styles.monthTab}
                                            onPress={() => scrollToMonth(index)}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.monthTabText,
                                                    isActive && { color: theme.accent, fontWeight: "700" },
                                                ]}
                                            >
                                                {month.month}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.monthTabIndicator,
                                                    isActive && { backgroundColor: theme.accent },
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <FlatList
                            ref={monthPagerRef}
                            horizontal
                            pagingEnabled
                            data={monthGroups}
                            keyExtractor={(item) => item.key}
                            renderItem={renderMonthPage}
                            getItemLayout={(_, index) => ({
                                length: SCREEN_WIDTH,
                                offset: SCREEN_WIDTH * index,
                                index,
                            })}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                if (index !== selectedMonthIndex) {
                                    setSelectedMonthIndex(index);
                                }
                            }}
                            showsHorizontalScrollIndicator={false}
                            onScrollToIndexFailed={() => {
                                monthPagerRef.current?.scrollToOffset({
                                    offset: selectedMonthIndex * SCREEN_WIDTH,
                                    animated: true,
                                });
                            }}
                        />

                        {isSelectionMode ? (
                            <View style={styles.bottomBar}>
                                <TouchableOpacity
                                    style={[styles.bottomButton, styles.deleteButton, selectedIds.length === 0 && styles.buttonDisabled]}
                                    onPress={handleDeleteSelected}
                                    disabled={selectedIds.length === 0}
                                >
                                    <Ionicons name="trash-outline" size={20} color={selectedIds.length === 0 ? "#CCC" : "#FF4444"} />
                                    <Text style={[styles.buttonText, styles.deleteButtonText, selectedIds.length === 0 && styles.buttonTextDisabled]}>
                                        {i18n.t("library.deleteButton", { count: selectedIds.length })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.bottomButton, styles.saveButton, selectedIds.length === 0 && styles.buttonDisabled]}
                                    onPress={handleSaveSelected}
                                    disabled={selectedIds.length === 0}
                                >
                                    <Ionicons name="download-outline" size={20} color={selectedIds.length === 0 ? "#CCC" : "#4CAF50"} />
                                    <Text style={[styles.buttonText, styles.saveButtonText, selectedIds.length === 0 && styles.buttonTextDisabled]}>
                                        {i18n.t("library.saveButton", { count: selectedIds.length })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </>
                )}
            </View>

            <Modal
                visible={showBabyPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBabyPicker(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowBabyPicker(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{i18n.t("camera.switchBabyTitle")}</Text>
                        <ScrollView style={styles.modalList}>
                            {babies.map((baby) => {
                                const babyTheme = getThemePreset(baby.themeColorHex);
                                return (
                                    <TouchableOpacity
                                        key={baby.id}
                                        style={styles.babyOption}
                                        onPress={() => handleSelectBaby(baby.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.babyOptionDot, { backgroundColor: babyTheme.accent }]} />
                                        <Text style={styles.babyOptionText}>{baby.name}</Text>
                                        {activeBabyId === baby.id ? (
                                            <Ionicons name="checkmark" size={20} color={babyTheme.accent} />
                                        ) : null}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    container: {
        flex: 1,
    },
    headerButton: {
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
    },
    selectButton: {
        alignSelf: "flex-start",
        minHeight: 32,
        paddingHorizontal: 10,
        borderRadius: 14,
    },
    headerButtonText: {
        fontSize: 13,
        fontWeight: "600",
    },
    switchBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    switchBadgeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    switchBadgeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    switchBadgeChevron: {
        marginLeft: 2,
    },
    monthHeader: {
        paddingTop: 8,
        paddingBottom: 6,
        backgroundColor: "rgba(255,255,255,0.72)",
    },
    monthYearLabel: {
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    monthTabsContent: {
        paddingHorizontal: 12,
        gap: 18,
    },
    monthTab: {
        alignItems: "center",
        minWidth: 28,
    },
    monthTabText: {
        fontSize: 18,
        fontWeight: "500",
        color: "#7E7A7B",
    },
    monthTabIndicator: {
        marginTop: 8,
        width: "100%",
        height: 3,
        borderRadius: 999,
        backgroundColor: "transparent",
    },
    monthPage: {
        width: SCREEN_WIDTH,
        flex: 1,
    },
    monthPageContent: {
        paddingHorizontal: PAGE_HORIZONTAL_PADDING,
        paddingTop: 6,
        paddingBottom: 24,
    },
    monthPageContentWithBottomBar: {
        paddingBottom: 112,
    },
    monthBlock: {
        marginBottom: GRID_GAP,
        gap: GRID_GAP,
    },
    photoTile: {
        overflow: "hidden",
        borderRadius: 6,
        backgroundColor: "#EDE8EA",
    },
    tilePlaceholder: {
        borderRadius: 6,
        backgroundColor: "transparent",
    },
    photoImage: {
        width: "100%",
        height: "100%",
    },
    heroShade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.16)",
    },
    heroOverlay: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
    },
    heroMonth: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    heroYear: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 18,
        fontWeight: "500",
        marginTop: 2,
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    heroAge: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "700",
        marginTop: 14,
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    smallRow: {
        flexDirection: "row",
        gap: GRID_GAP,
    },
    mixedRow: {
        flexDirection: "row",
        gap: GRID_GAP,
    },
    mixedColumn: {
        gap: GRID_GAP,
    },
    selectionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 6,
    },
    selectionOverlayActive: {
        backgroundColor: "rgba(255,143,163,0.22)",
        borderWidth: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#888",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#BBB",
        textAlign: "center",
        lineHeight: 20,
        marginTop: 8,
    },
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: "#EEE",
        backgroundColor: "#FFF",
    },
    bottomButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    deleteButton: {
        backgroundColor: "#FFEAEA",
    },
    saveButton: {
        backgroundColor: "#E8F5E9",
    },
    buttonDisabled: {
        backgroundColor: "#F5F5F5",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButtonText: {
        color: "#FF4444",
    },
    saveButtonText: {
        color: "#4CAF50",
    },
    buttonTextDisabled: {
        color: "#CCC",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContent: {
        width: "100%",
        maxWidth: 320,
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },
    modalList: {
        maxHeight: 300,
    },
    babyOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        gap: 12,
    },
    babyOptionDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    babyOptionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
});
