'use client';

import {useMemo, useState, useTransition} from 'react';
import {Plus, Settings2, Trophy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {BracketHeader} from './bracket-header';
import {BracketSidebar} from './bracket-sidebar';
import {BracketSingleElim} from './bracket-single-elim';
import {BracketRoundRobin} from './bracket-round-robin';
import {AddCategoryModal} from './modals/add-category-modal';
import {BracketSettingsModal} from './modals/bracket-settings-modal';
import {ParticipantSelectorModal} from './modals/participant-selector-modal';
import {toast} from 'sonner';
import type {
    BracketState,
    Category,
    Discipline,
    LocalMatch,
    Participant,
    RatingGroup,
    SeedingType,
} from '@/shared/types/bracket';
import {createTournamentCategoryAction, saveCategoryBracketAction} from "@/app/(main)/tournaments/bracket-actions";
import {DISCIPLINE_LABELS} from "@/shared/lib/tournament/labels";

export function BracketBuilder({
                                   tournamentId,
                                   initialCategories = [],
                                   initialParticipants = [],
                                   initialMatches = [],
                               }: {
    tournamentId: string;
    initialCategories?: any[];
    initialParticipants?: any[];
    initialMatches?: any[];
}) {
    function mapDbCategory(c: {
        id: string;
        category: Discipline;
        age_group?: string | null;
        rating_group?: string | null;
        max_pairs?: number | null;
        bracket_status?: string;
        bracket_format?: string | null;
        bracket_generated?: boolean | null;
    }): Category {
        const group =
            (c.rating_group as RatingGroup) ||
            (c.age_group?.replace(/^Группа\s+/i, '') as RatingGroup) ||
            'C';
        const ready =
            c.bracket_status === 'ready' || c.bracket_generated === true;

        return {
            id: c.id, // UUID из БД
            name: c.category,
            desc: DISCIPLINE_LABELS[c.category] ?? c.category,
            ratingGroup: ['A', 'B', 'C', 'D', 'E'].includes(group) ? group : 'C',
            count: c.max_pairs ?? 8,
            status: ready ? 'ready' : 'draft',
            format: c.bracket_format === 'round_robin' ? 'RR' : c.bracket_format === 'single_elim' ? 'SE' : undefined
        };
    }


    // ранее сохранённые сетки из БД (initialMatches)
    function buildInitialBrackets(): Record<string, BracketState> {
        const result: Record<string, BracketState> = {};
        const cats = (initialCategories ?? []) as Array<{
            id: string;
            bracket_format?: string | null;
            max_pairs?: number | null;
        }>;

        const nameOf = (participantId: string | null): Participant => {
            if (!participantId) return null;
            const p = (initialParticipants ?? []).find((x: any) => x.id === participantId);
            if (!p) return null;
            if (p.player2 || p.guest2) {
                const n1 = p.player1?.full_name || p.guest1?.full_name || 'Игрок 1';
                const n2 = p.player2?.full_name || p.guest2?.full_name || 'Игрок 2';
                const r1 = p.player1?.rating_doubles || 0;
                const r2 = p.player2?.rating_doubles || 0;
                const avg = r1 && r2 ? Math.round((r1 + r2) / 2) : r1 || r2 || 0;
                return { id: p.id, name: `${n1.split(' ')[0]} / ${n2.split(' ')[0]}`, rating: avg };
            }
            const name = p.player1?.full_name || p.guest1?.full_name || 'Игрок';
            return { id: p.id, name, rating: p.player1?.rating_singles || 0 };
        };

        for (const cat of cats) {
            const catMatches = (initialMatches ?? [])
                .filter((m: any) => m.category_id === cat.id)
                .sort((a: any, b: any) => a.round - b.round || a.position - b.position);
            if (catMatches.length === 0) continue;

            if (cat.bracket_format === 'round_robin') {
                const players: Participant[] = [];
                const hasPlayer = (id: string) =>
                    players.some((x): x is { id: string; name: string; rating: number } =>
                        !!x && x !== 'BYE' && x.id === id
                    );
                catMatches.forEach((m: any) => {
                    const p1 = nameOf(m.participant1_id);
                    const p2 = nameOf(m.participant2_id);
                    if (p1 && p1 !== 'BYE' && !hasPlayer(p1.id)) players.push(p1);
                    if (p2 && p2 !== 'BYE' && !hasPlayer(p2.id)) players.push(p2);
                });
                result[cat.id] = { format: 'RR', startingMatches: [], rrPlayers: players };
            } else {
                const starting = catMatches
                    .filter((m: any) => m.round === 1)
                    .map((m: any, i: number) => ({
                        id: `m${i}`,
                        p1: m.placeholder_p1 === 'BYE' ? ('BYE' as const) : nameOf(m.participant1_id),
                        p2: m.placeholder_p2 === 'BYE' ? ('BYE' as const) : nameOf(m.participant2_id),
                    }));
                result[cat.id] = {
                    format: 'SE',
                    startingMatches: starting,
                    rrPlayers: [],
                    seedingType: 'SNAKE',
                };
            }
        }
        return result;
    }


    const [categories, setCategories] = useState<Category[]>(
        (initialCategories ?? []).map(mapDbCategory)
    );

    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const [isSaving, startSavingTransition] = useTransition();

    const [brackets, setBrackets] = useState<Record<string, BracketState>>(buildInitialBrackets);

    // Модалки
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<
        | { type: 'se'; matchIndex: number; slot: 'p1' | 'p2' }
        | { type: 'rr'; index: number }
        | null
    >(null);

    const currentCat = categories.find((c) => c.id === activeCategory);
    const currentBracket = activeCategory ? brackets[activeCategory] : null;
    const hasBracket = !!currentBracket;

    // Собираем занятые ID со ВСЕХ категорий (глобальная защита от дублей)
    const selectedParticipantIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(brackets).forEach((state) => {
            state.startingMatches.forEach((m) => {
                if (m.p1 && m.p1 !== 'BYE') ids.add(m.p1.id);
                if (m.p2 && m.p2 !== 'BYE') ids.add(m.p2.id);
            });
            state.rrPlayers.forEach((p) => {
                if (p && p !== 'BYE') ids.add(p.id);
            });
        });
        return ids;
    }, [brackets]);



    const availableParticipants = useMemo(() => {
        if (!activeCategory || !initialParticipants) return [];

        return initialParticipants
            .filter(p => p.category_id === activeCategory && p.status === 'confirmed')
            .map(p => {
                // Для парных
                if (p.player2 || p.guest2) {
                    const name1 = p.player1?.full_name || p.guest1?.full_name || 'Игрок 1';
                    const name2 = p.player2?.full_name || p.guest2?.full_name || 'Игрок 2';

                    const r1 = p.player1?.rating_doubles || 0;
                    const r2 = p.player2?.rating_doubles || 0;
                    const avgRating = r1 && r2 ? Math.round((r1 + r2) / 2) : (r1 || r2 || 0);

                    return { id: p.id, name: `${name1.split(' ')[0]} / ${name2.split(' ')[0]}`, rating: avgRating };
                }

                // Для одиночек
                const name = p.player1?.full_name || p.guest1?.full_name || 'Игрок';
                return { id: p.id, name: name, rating: p.player1?.rating_singles || 0 };
            })
            .sort((a, b) => b.rating - a.rating);
    }, [activeCategory, initialParticipants]);








    // === Генерация Олимпийки ===
    const generateSingleElimination = (participantCount: number, seeding: SeedingType) => {
        let bracketSize = 1;
        while (bracketSize < participantCount) bracketSize *= 2;
        const byesCount = bracketSize - participantCount;
        const matchCount = bracketSize / 2;

        const newMatches: LocalMatch[] = Array.from({ length: matchCount }, (_, i) => ({
            id: `m${i}`,
            p1: null,
            p2: null,
        }));

        const byePositions = [
            0,
            matchCount - 1,
            Math.floor(matchCount / 2),
            Math.floor(matchCount / 2) - 1,
            1,
            matchCount - 2,
        ];
        for (let i = 0; i < byesCount; i++) {
            const idx = byePositions[i % byePositions.length];
            if (newMatches[idx] && !newMatches[idx].p2) {
                newMatches[idx].p2 = 'BYE';
            }
        }

        if (activeCategory) {
            setBrackets((prev) => ({
                ...prev,
                [activeCategory]: {
                    format: 'SE',
                    startingMatches: newMatches,
                    rrPlayers: [],
                    seedingType: seeding,
                },
            }));
        }
        setSettingsOpen(false);
    };

    const generateRoundRobin = (participantCount: number) => {
        const slots: Participant[] = Array.from({ length: participantCount }, () => null);
        if (activeCategory) {
            setBrackets((prev) => ({
                ...prev,
                [activeCategory]: {
                    format: 'RR',
                    startingMatches: [],
                    rrPlayers: slots,
                },
            }));
        }
        setSettingsOpen(false);
    };

    // === Управление слотами ===
    const handleSlotClick = (matchIndex: number, slot: 'p1' | 'p2') => {
        setActiveSlot({ type: 'se', matchIndex, slot });
        setSelectorOpen(true);
    };

    const handleRRSlotClick = (index: number) => {
        setActiveSlot({ type: 'rr', index });
        setSelectorOpen(true);
    };

    const handleSelectParticipant = (participant: { id: string; name: string; rating: number }) => {
        if (!activeSlot || !activeCategory) return;
        const state = brackets[activeCategory];
        if (!state) return;

        if (activeSlot.type === 'se') {
            const next = [...state.startingMatches];
            next[activeSlot.matchIndex][activeSlot.slot] = participant;
            setBrackets((prev) => ({
                ...prev,
                [activeCategory]: { ...state, startingMatches: next },
            }));
        } else {
            const next = [...state.rrPlayers];
            next[activeSlot.index] = participant;
            setBrackets((prev) => ({
                ...prev,
                [activeCategory]: { ...state, rrPlayers: next },
            }));
        }

        setSelectorOpen(false);
        setActiveSlot(null);
    };

    const handleClearSESlot = (matchIndex: number, slot: 'p1' | 'p2', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeCategory) return;
        const state = brackets[activeCategory];
        if (!state) return;
        const next = [...state.startingMatches];
        next[matchIndex][slot] = null;
        setBrackets((prev) => ({
            ...prev,
            [activeCategory]: { ...state, startingMatches: next },
        }));
    };

    const handleClearRRSlot = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeCategory) return;
        const state = brackets[activeCategory];
        if (!state) return;
        const next = [...state.rrPlayers];
        next[index] = null;
        setBrackets((prev) => ({
            ...prev,
            [activeCategory]: { ...state, rrPlayers: next },
        }));
    };

    // === Категории ===
    const handleAddCategory = async (cat: Omit<Category, 'id' | 'status'>) => {
        const result = await createTournamentCategoryAction(
            tournamentId,
            cat.name, // Discipline
            cat.ratingGroup, // RatingGroup
            cat.count
        );

        if (!result.success || !result.data) {
            toast.error('Ошибка создания категории');
            return;
        }

        const newCat: Category = {
            ...cat,
            id: result.data.id,
            status: 'draft',
        };
        setCategories((prev) => [...prev, newCat]);
        setActiveCategory(newCat.id);
        setAddCategoryOpen(false);
        setTimeout(() => setSettingsOpen(true), 150);
    };

    const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setBrackets((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (activeCategory === id) setActiveCategory(null);
    };

    // === Экспорт (Заглушки, реализуем позже с html-to-image и jsPDF) ===
    const handleExportPDF = () => {
        toast.info('Экспорт в PDF будет доступен после сохранения сетки в БД');
    };
    const handleExportPNG = () => {
        toast.info('Экспорт в PNG будет доступен после сохранения сетки в БД');
    };

    const clearCurrentBracket = () => {
        if (!activeCategory) return;
        setBrackets((prev) => {
            const next = { ...prev };
            delete next[activeCategory];
            return next;
        });
    };


    const handleSaveAll = () => {
        if (!tournamentId) {
            toast.error('Нет ID турнира');
            return;
        }
        if (!activeCategory || !brackets[activeCategory]) {
            toast.error('Сетка не создана');
            return;
        }

        // Не сохраняем фейковые id вида c1789...
        if (!/^[0-9a-f-]{36}$/i.test(activeCategory)) {
            toast.error('Сначала создайте категорию через «Добавить категорию» (нужен UUID из БД)');
            return;
        }

        startSavingTransition(async () => {
            const res = await saveCategoryBracketAction(
                tournamentId,
                activeCategory,
                brackets[activeCategory]
            );
            if (res.success) {
                toast.success('Сетка сохранена');
                setCategories((prev) =>
                    prev.map((c) =>
                        c.id === activeCategory ? { ...c, status: 'ready' } : c
                    )
                );
            } else {
                toast.error(res.error || 'Ошибка сохранения');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-app overflow-hidden font-sans">
            <BracketHeader
                tournamentId={tournamentId}
                hasBracket={hasBracket}
                onClearBracket={clearCurrentBracket}
                onSave={handleSaveAll}
                onExportPDF={handleExportPDF}
                onExportPNG={handleExportPNG}
            />

            <div className="flex flex-1 overflow-hidden">
                <BracketSidebar
                    categories={categories}
                    activeCategory={activeCategory}
                    brackets={brackets}
                    onSelectCategory={setActiveCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddCategory={() => setAddCategoryOpen(true)}
                />

                <main className="flex-1 bg-app overflow-auto relative">
                    {!activeCategory && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <Trophy className="w-12 h-12 text-muted mb-4" />
                            <h2 className="text-xl font-bold text-strong mb-2">Выберите или создайте категорию</h2>
                            <p className="text-sm text-muted max-w-sm mb-6">
                                Добавьте категорию слева, чтобы начать построение сетки.
                            </p>
                            <Button
                                onClick={() => setAddCategoryOpen(true)}
                                className="bg-accent text-accent-foreground font-bold"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Добавить категорию
                            </Button>
                        </div>
                    )}

                    {activeCategory && !hasBracket && currentCat && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
                            <div className="w-20 h-20 bg-card border border-subtle rounded-full flex items-center justify-center mb-6 shadow-lg">
                                <Trophy className="w-10 h-10 text-muted" />
                            </div>
                            <h2 className="text-xl font-bold text-strong mb-2">
                                Сетка {currentCat.name} (Группа {currentCat.ratingGroup}) не создана
                            </h2>
                            <p className="text-sm text-muted max-w-sm mb-8 leading-relaxed">
                                В категории {currentCat.count} участников. Настройте формат — система сгенерирует структуру автоматически.
                            </p>
                            <Button
                                onClick={() => setSettingsOpen(true)}
                                className="bg-accent text-accent-foreground font-bold px-8 shadow-lg hover:opacity-90"
                            >
                                <Settings2 className="w-4 h-4 mr-2" /> Настроить сетку
                            </Button>
                        </div>
                    )}

                    {currentBracket?.format === 'SE' && (
                        <BracketSingleElim
                            startingMatches={currentBracket.startingMatches}
                            onSlotClick={handleSlotClick}
                            onSlotClear={handleClearSESlot}
                        />
                    )}

                    {currentBracket?.format === 'RR' && (
                        <BracketRoundRobin
                            rrPlayers={currentBracket.rrPlayers}
                            onSlotClick={handleRRSlotClick}
                            onSlotClear={handleClearRRSlot}
                        />
                    )}
                </main>
            </div>

            {addCategoryOpen && (
                <AddCategoryModal
                    onClose={() => setAddCategoryOpen(false)}
                    onCreate={handleAddCategory}
                />
            )}

            {settingsOpen && currentCat && (
                <BracketSettingsModal
                    category={currentCat}
                    onClose={() => setSettingsOpen(false)}
                    onGenerate={(format, seeding) => {
                        if (format === 'SE') generateSingleElimination(currentCat.count, seeding);
                        else generateRoundRobin(currentCat.count);
                    }}
                />
            )}

            {selectorOpen && (
                <ParticipantSelectorModal
                    participants={availableParticipants}
                    selectedIds={selectedParticipantIds}
                    onClose={() => setSelectorOpen(false)}
                    onSelect={handleSelectParticipant}
                />
            )}
        </div>
    );
}