'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Plus, Settings2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BracketHeader } from './bracket-header';
import { BracketSidebar } from './bracket-sidebar';
import { BracketSingleElim } from './bracket-single-elim';
import { BracketRoundRobin } from './bracket-round-robin';
import { BracketGroupsThenSE } from './bracket-groups-then-se';
import { AddCategoryModal } from './modals/add-category-modal';
import { BracketSettingsModal } from './modals/bracket-settings-modal';
import { ParticipantSelectorModal } from './modals/participant-selector-modal';
import { toast } from 'sonner';
import type {
    BracketFormat,
    BracketState,
    Category,
    Discipline,
    LocalMatch,
    MatchResult,
    Participant,
    RatingGroup,
    SeedingType,
} from '@/shared/types/bracket';
import {
    createTournamentCategoryAction,
    deleteTournamentCategoryAction,
    saveCategoryBracketAction,
} from '@/app/(main)/tournaments/bracket-actions';
import { DISCIPLINE_LABELS } from '@/shared/lib/tournament/labels';
import {
    buildSingleEliminationBracket,
    buildGroupsThenSE,
    EnginePlayer,
    ExtendedFormat,
} from '@/shared/lib/tournament/bracket-engine';
import { generateMockParticipants } from '@/shared/lib/tournament/demo-data';

export function BracketBuilder({
                                   tournamentId,
                                   initialCategories = [],
                                   initialParticipants = [],
                                   initialMatches = [],
                                   isDemo = false,
                               }: {
    tournamentId: string;
    initialCategories?: any[];
    initialParticipants?: any[];
    initialMatches?: any[];
    isDemo?: boolean;
}) {
    // Список участников — теперь в стейте, чтобы в демо можно было добавлять новых
    const [participantsList, setParticipantsList] = useState<any[]>(initialParticipants ?? []);

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
        const ready = c.bracket_status === 'ready' || c.bracket_generated === true;

        const actualParticipantCount = participantsList.filter(
            (p: any) => p.category_id === c.id && p.status !== 'withdrawn'
        ).length;

        return {
            id: c.id,
            name: c.category,
            desc: DISCIPLINE_LABELS[c.category] ?? c.category,
            ratingGroup: ['A', 'B', 'C', 'D', 'E'].includes(group) ? group : 'C',
            count: actualParticipantCount,
            status: ready ? 'ready' : 'draft',
            format: c.bracket_format === 'round_robin' ? 'RR' : c.bracket_format === 'single_elim' ? 'SE' : undefined,
        };
    }

    // Восстановление состояния сетки из БД Supabase
    function buildInitialBrackets(): Record<string, BracketState> {
        const result: Record<string, BracketState> = {};
        const cats = (initialCategories ?? []) as Array<{ id: string; bracket_format?: string | null; bracket_settings?: any }>;

        const nameOf = (participantId: string | null): Participant => {
            if (!participantId) return null;
            const p = participantsList.find((x: any) => x.id === participantId);
            if (!p) return null;
            if (p.player2 || p.guest2) {
                const n1 = p.player1?.full_name || p.guest1?.full_name || 'Игрок 1';
                const n2 = p.player2?.full_name || p.guest2?.full_name || 'Игрок 2';
                const r1 = p.player1?.rating_doubles || p.player1?.rating_singles || 0;
                const r2 = p.player2?.rating_doubles || p.player2?.rating_singles || 0;
                const avg = r1 && r2 ? Math.round((r1 + r2) / 2) : r1 || r2 || 0;
                return { id: p.id, name: `${n1.split(' ')[0]} / ${n2.split(' ')[0]}`, rating: avg };
            }
            const name = p.player1?.full_name || p.guest1?.full_name || 'Игрок';
            const rating = p.player1?.rating_singles || p.player1?.rating_doubles || 0;
            return { id: p.id, name, rating };
        };

        for (const cat of cats) {
            let settings = cat.bracket_settings;
            if (typeof settings === 'string') {
                try { settings = JSON.parse(settings); } catch (e) { }
            }

            const catMatches = (initialMatches ?? [])
                .filter((m: any) => m.category_id === cat.id)
                .sort((a: any, b: any) => a.round - b.round || a.position - b.position);

            const matchResults: Record<string, any> = {};
            catMatches.forEach((m: any) => {
                if (m.winner_id) matchResults[m.id] = { winnerId: m.winner_id, scores: m.score || [] };
            });

            const starting = catMatches
                .filter((m: any) => m.round === 1 || m.round === 0)
                .map((m: any, i: number) => ({
                    id: m.id || `m${i}`,
                    p1: m.placeholder_p1 === 'BYE' ? ('BYE' as const) : nameOf(m.participant1_id),
                    p2: m.placeholder_p2 === 'BYE' ? ('BYE' as const) : nameOf(m.participant2_id),
                }));

            if (settings && typeof settings === 'object' && settings.format) {
                result[cat.id] = {
                    ...settings,
                    startingMatches: settings.startingMatches?.length ? settings.startingMatches : starting,
                    matchResults: settings.matchResults && Object.keys(settings.matchResults).length > 0 ? settings.matchResults : matchResults,
                } as BracketState;
                continue;
            }

            if (catMatches.length === 0) continue;

            if (cat.bracket_format === 'round_robin' || cat.bracket_format === 'RR') {
                const players: Participant[] = [];
                const hasPlayer = (id: string) => players.some((x: any) => x && x !== 'BYE' && x.id === id);
                catMatches.forEach((m: any) => {
                    const p1 = nameOf(m.participant1_id);
                    const p2 = nameOf(m.participant2_id);
                    if (p1 && p1 !== 'BYE' && !hasPlayer(p1.id)) players.push(p1);
                    if (p2 && p2 !== 'BYE' && !hasPlayer(p2.id)) players.push(p2);
                });
                result[cat.id] = { format: 'RR', startingMatches: [], rrPlayers: players };
            } else {
                result[cat.id] = {
                    format: (cat.bracket_format as BracketFormat) || 'SE',
                    startingMatches: starting,
                    rrPlayers: [],
                    matchResults,
                };
            }
        }
        return result;
    }

    const handleDeleteEmptyCategories = async () => {
        const emptyCategories = categories.filter((c) => c.count === 0);
        if (emptyCategories.length === 0) {
            toast.info('Нет пустых категорий');
            return;
        }

        if (isDemo) {
            setCategories((prev) => prev.filter((c) => c.count > 0));
            toast.success(`Удалено пустых категорий: ${emptyCategories.length}`);
            return;
        }

        let deletedCount = 0;
        for (const cat of emptyCategories) {
            const res = await deleteTournamentCategoryAction(tournamentId, cat.id);
            if (res.success) deletedCount++;
        }

        toast.success(`Удалено пустых категорий: ${deletedCount}`);
        setCategories((prev) => prev.filter((c) => c.count > 0));
    };

    const handleEditCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveCategory(id);
        setSettingsOpen(true);
    };

    const [categories, setCategories] = useState<Category[]>(
        (initialCategories ?? []).map(mapDbCategory)
    );
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isSaving, startSavingTransition] = useTransition();
    const [brackets, setBrackets] = useState<Record<string, BracketState>>(buildInitialBrackets);

    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState<
        | { type: 'se'; matchIndex: number; slot: 'p1' | 'p2' }
        | { type: 'rr'; index: number }
        | null
    >(null);
    const [isDirty, setIsDirty] = useState(false);

    const currentCat = categories.find((c) => c.id === activeCategory);
    const currentBracket = activeCategory ? brackets[activeCategory] : null;
    const hasBracket = !!currentBracket;

    const availableParticipants = useMemo(() => {
        if (!activeCategory) return [];

        return participantsList
            .filter((p) => p.category_id === activeCategory && p.status !== 'withdrawn')
            .map((p) => {
                if (p.player2 || p.guest2) {
                    const name1 = p.player1?.full_name || p.guest1?.full_name || 'Игрок 1';
                    const name2 = p.player2?.full_name || p.guest2?.full_name || 'Игрок 2';
                    const r1 = p.player1?.rating_doubles || p.player1?.rating_singles || 0;
                    const r2 = p.player2?.rating_doubles || p.player2?.rating_singles || 0;
                    const avgRating = r1 && r2 ? Math.round((r1 + r2) / 2) : (r1 || r2 || 0);
                    return { id: p.id, name: `${name1.split(' ')[0]} / ${name2.split(' ')[0]}`, rating: avgRating };
                }
                const name = p.player1?.full_name || p.guest1?.full_name || 'Игрок';
                const rating = p.player1?.rating_singles || p.player1?.rating_doubles || 0;
                return { id: p.id, name, rating };
            })
            .sort((a, b) => b.rating - a.rating);
    }, [activeCategory, participantsList]);

    const selectedParticipantIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(brackets).forEach((state) => {
            if (!state) return;

            state.startingMatches?.forEach((m) => {
                if (m.p1 && typeof m.p1 === 'object' && 'id' in m.p1) ids.add(m.p1.id);
                if (m.p2 && typeof m.p2 === 'object' && 'id' in m.p2) ids.add(m.p2.id);
            });

            state.rrPlayers?.forEach((p) => {
                if (p && typeof p === 'object' && 'id' in p) ids.add(p.id);
            });
        });
        return ids;
    }, [brackets]);

    const handleScoreSubmit = (matchId: string, result: MatchResult) => {
        if (!activeCategory) return;

        setBrackets((prev) => {
            const current = prev[activeCategory];
            if (!current) return prev;

            const nextResults = {
                ...(current.matchResults || {}),
                [matchId]: result,
            };

            return {
                ...prev,
                [activeCategory]: {
                    ...current,
                    matchResults: nextResults,
                },
            };
        });

        setIsDirty(true);
        toast.success('Результат матча записан');
    };

    // Автосохранение в БД (только в реальном режиме)
    useEffect(() => {
        if (isDemo) return;
        if (!isDirty || !activeCategory || !brackets[activeCategory]) return;

        const timer = setTimeout(async () => {
            const res = await saveCategoryBracketAction(
                tournamentId,
                activeCategory,
                brackets[activeCategory]
            );
            if (res.success) {
                setIsDirty(false);
                toast.success('Автосохранение выполнено', { duration: 2000 });
            }
        }, 12000);

        return () => clearTimeout(timer);
    }, [isDirty, activeCategory, brackets, tournamentId, isDemo]);

    const handleGenerateBracket = (
        format: ExtendedFormat,
        seeding: SeedingType,
        groupCount = 16,
        advanceCount = 2,
        autoSeed = true
    ) => {
        if (!activeCategory || !currentCat) return;

        const mapSlotToParticipant = (p: any): Participant => {
            if (!p) return null;
            if (p === 'BYE') return 'BYE';
            if (typeof p === 'object' && 'id' in p && 'name' in p) {
                return { id: p.id, name: p.name, rating: p.rating ?? 0 };
            }
            return null;
        };

        try {
            const playersToUse: EnginePlayer[] = autoSeed ? availableParticipants : [];

            if (format === 'RR_THEN_SE') {
                const data = buildGroupsThenSE(
                    playersToUse,
                    groupCount,
                    advanceCount,
                    seeding === 'UNIFORM' ? 'UNIFORM' : 'SNAKE'
                );

                setBrackets((prev) => ({
                    ...prev,
                    [activeCategory]: {
                        format: 'RR_THEN_SE',
                        startingMatches: [],
                        rrPlayers: [],
                        seedingType: seeding,
                        groupsThenSE: data,
                    },
                }));
                toast.success(`Схема готова: ${groupCount} групп → плей-офф на ${groupCount * advanceCount} чел.`);
            } else if (format === 'RR' || format === 'ROUND_ROBIN_DOUBLE') {
                const rrSlots: Participant[] = Array.from(
                    { length: Math.max(playersToUse.length, currentCat.count || 4) },
                    (_, i) => {
                        const p = playersToUse[i];
                        return p ? { id: p.id, name: p.name, rating: p.rating } : null;
                    }
                );

                setBrackets((prev) => ({
                    ...prev,
                    [activeCategory]: {
                        format,
                        startingMatches: [],
                        rrPlayers: rrSlots,
                        seedingType: seeding,
                    },
                }));
                toast.success('Круговая схема сгенерирована');
            } else {
                const r1 = buildSingleEliminationBracket(playersToUse);

                const startingMatches: LocalMatch[] = r1.map((m, i) => ({
                    id: m.id || `m${i}`,
                    p1: mapSlotToParticipant(m.p1),
                    p2: mapSlotToParticipant(m.p2),
                }));

                setBrackets((prev) => ({
                    ...prev,
                    [activeCategory]: {
                        format,
                        startingMatches,
                        rrPlayers: [],
                        seedingType: seeding,
                    },
                }));

                const formatNames: Record<string, string> = {
                    SE: 'Олимпийка (Прил. 11)',
                    APP12: 'Олимпийка (Прил. 12)',
                    SWISS: 'Швейцарская система',
                    DOUBLE_ELIM: 'Двойное выбывание',
                    SE_WITH_PLACES: 'Олимпийка + Места',
                };
                toast.success(`${formatNames[format] || 'Схема'} сгенерирована`);
            }

            setSettingsOpen(false);
            setIsDirty(true);
        } catch (err: any) {
            console.error('[Bracket generate error]', err);
            toast.error('Ошибка генерации схемы');
        }
    };

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
            setBrackets((prev) => ({ ...prev, [activeCategory]: { ...state, startingMatches: next } }));
        } else {
            const next = [...state.rrPlayers];
            next[activeSlot.index] = participant;
            setBrackets((prev) => ({ ...prev, [activeCategory]: { ...state, rrPlayers: next } }));
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
        setBrackets((prev) => ({ ...prev, [activeCategory]: { ...state, startingMatches: next } }));
    };

    const handleClearRRSlot = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeCategory) return;
        const state = brackets[activeCategory];
        if (!state) return;
        const next = [...state.rrPlayers];
        next[index] = null;
        setBrackets((prev) => ({ ...prev, [activeCategory]: { ...state, rrPlayers: next } }));
    };

    // ДОБАВЛЕНИЕ КАТЕГОРИИ (работает и в демо, и с реальной БД)
    const handleAddCategory = async (cat: Omit<Category, 'id' | 'status'>) => {
        if (isDemo) {
            const fakeId = `demo-cat-${Date.now()}`;
            const newCat: Category = { ...cat, id: fakeId, status: 'draft' };

            // Автогенерируем демо-игроков для новой категории
            const startingRating = cat.ratingGroup === 'A' ? 950
                : cat.ratingGroup === 'B' ? 820
                    : cat.ratingGroup === 'C' ? 680
                        : cat.ratingGroup === 'D' ? 540 : 420;

            const newMockPlayers = generateMockParticipants(fakeId, cat.count || 8, startingRating);

            setParticipantsList((prev) => [...prev, ...newMockPlayers]);
            setCategories((prev) => [...prev, newCat]);
            setActiveCategory(newCat.id);
            setAddCategoryOpen(false);

            toast.success(`Категория ${cat.name} (${cat.ratingGroup}) создана с ${cat.count} игроками`);
            setTimeout(() => setSettingsOpen(true), 150);
            return;
        }

        const result = await createTournamentCategoryAction(
            tournamentId,
            cat.name,
            cat.ratingGroup,
            cat.count
        );

        if (!result.success || !result.data) {
            toast.error('Ошибка создания категории');
            return;
        }

        const newCat: Category = { ...cat, id: result.data.id, status: 'draft' };
        setCategories((prev) => [...prev, newCat]);
        setActiveCategory(newCat.id);
        setAddCategoryOpen(false);
        setTimeout(() => setSettingsOpen(true), 150);
    };

    // УДАЛЕНИЕ КАТЕГОРИИ (работает и в демо, и с реальной БД)
    const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (isDemo) {
            toast.success('Категория удалена');
            setCategories((prev) => prev.filter((c) => c.id !== id));
            setBrackets((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            setParticipantsList((prev) => prev.filter((p) => p.category_id !== id));
            if (activeCategory === id) setActiveCategory(null);
            return;
        }

        const res = await deleteTournamentCategoryAction(tournamentId, id);
        if (!res.success) {
            toast.error(res.error || 'Ошибка при удалении категории');
            return;
        }

        toast.success('Категория удалена');
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setBrackets((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (activeCategory === id) setActiveCategory(null);
    };

    // СОХРАНЕНИЕ СЕТКИ (работает и в демо, и с реальной БД)
    const handleSaveAll = () => {
        if (!activeCategory || !brackets[activeCategory]) {
            toast.error('Сетка не выбрана');
            return;
        }

        if (isDemo) {
            toast.success('Сетка сохранена (демо-режим)');
            setCategories((prev) =>
                prev.map((c) => (c.id === activeCategory ? { ...c, status: 'ready' } : c))
            );
            setIsDirty(false);
            return;
        }

        startSavingTransition(async () => {
            const res = await saveCategoryBracketAction(
                tournamentId,
                activeCategory,
                brackets[activeCategory]
            );
            if (res.success) {
                toast.success('Сетка сохранена в Supabase');
                setCategories((prev) =>
                    prev.map((c) => (c.id === activeCategory ? { ...c, status: 'ready' } : c))
                );
                setIsDirty(false);
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
                activeCategory={activeCategory}
                onClearBracket={() => {
                    if (!activeCategory) return;
                    setBrackets((prev) => {
                        const next = { ...prev };
                        delete next[activeCategory];
                        return next;
                    });
                }}
                onSave={handleSaveAll}
                onExportPDF={() => toast.info('Экспорт PDF скоро будет доступен')}
                onExportPNG={() => toast.info('Экспорт PNG скоро будет доступен')}
            />

            <div className="flex flex-1 overflow-hidden">
                <BracketSidebar
                    categories={categories}
                    activeCategory={activeCategory}
                    brackets={brackets}
                    onSelectCategory={setActiveCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onEditCategory={handleEditCategory}
                    onDeleteEmptyCategories={handleDeleteEmptyCategories}
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
                            <Button onClick={() => setAddCategoryOpen(true)} className="bg-accent text-accent-foreground font-bold">
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
                                Участников зарегистрировано: {availableParticipants.length}. Нажмите «Настроить», чтобы система авторасставила игроков.
                            </p>
                            <Button onClick={() => setSettingsOpen(true)} className="bg-accent text-accent-foreground font-bold px-8 shadow-lg hover:opacity-90">
                                <Settings2 className="w-4 h-4 mr-2" /> Настроить сетку
                            </Button>
                        </div>
                    )}

                    {currentBracket &&
                        ['SE', 'APP12', 'SWISS', 'DOUBLE_ELIM', 'SE_WITH_PLACES'].includes(currentBracket.format) && (
                            <BracketSingleElim
                                startingMatches={currentBracket.startingMatches}
                                matchResults={currentBracket.matchResults}
                                onSlotClick={handleSlotClick}
                                onSlotClear={handleClearSESlot}
                                onScoreSubmit={handleScoreSubmit}
                            />
                        )}

                    {currentBracket &&
                        ['RR', 'ROUND_ROBIN_DOUBLE'].includes(currentBracket.format) && (
                            <BracketRoundRobin
                                rrPlayers={currentBracket.rrPlayers}
                                matchResults={currentBracket.matchResults}
                                onScoreSubmit={handleScoreSubmit}
                                onSlotClick={handleRRSlotClick}
                                onSlotClear={handleClearRRSlot}
                            />
                        )}

                    {currentBracket?.format === 'RR_THEN_SE' && currentBracket.groupsThenSE && (
                        <BracketGroupsThenSE
                            data={currentBracket.groupsThenSE}
                            matchResults={currentBracket.matchResults}
                            onScoreSubmit={handleScoreSubmit}
                        />
                    )}
                </main>
            </div>

            {addCategoryOpen && (
                <AddCategoryModal onClose={() => setAddCategoryOpen(false)} onCreate={handleAddCategory} />
            )}

            {settingsOpen && currentCat && (
                <BracketSettingsModal
                    category={currentCat}
                    onClose={() => setSettingsOpen(false)}
                    onGenerate={handleGenerateBracket}
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