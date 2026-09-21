'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Trophy, GitBranch, Repeat, Layers, AlertTriangle, Sparkles, Check, Ban, AlertCircle, TrendingUp, Users } from 'lucide-react';
import type { Category, SeedingType } from '@/shared/types/bracket';
import {
    checkFormatAvailability,
    validateGroupSetup,
    calculateOptimalGroups,
    FORMAT_RULES,
    ExtendedFormat,
    GroupValidation,
    calculateBracketConfig,
    assessQualifyingRoundBalance,
} from '@/shared/lib/tournament/bracket-engine';

interface Props {
    category: Category;
    onClose: () => void;
    onGenerate: (
        format: ExtendedFormat,
        seeding: SeedingType,
        groupCount: number,
        advanceCount: number,
        autoSeed: boolean
    ) => void;
}

export function BracketSettingsModal({ category, onClose, onGenerate }: Props) {
    const playerCount = category.count || 8;

    const optimalOptions = useMemo(() => calculateOptimalGroups(playerCount, 4), [playerCount]);
    const defaultRec = optimalOptions[0] || { groupCount: 16, advancePerGroup: 2 };

    const [format, setFormat] = useState<ExtendedFormat>(playerCount > 24 ? 'RR_THEN_SE' : 'SE');
    const [seeding, setSeeding] = useState<SeedingType>('SNAKE');
    const [groupCount, setGroupCount] = useState<number>(defaultRec.groupCount);
    const [advanceCount, setAdvanceCount] = useState<number>(defaultRec.advancePerGroup);
    const [autoSeed, setAutoSeed] = useState<boolean>(true);

    // Уровень 1: доступность формата
    const level1Check = useMemo(() => checkFormatAvailability(format, playerCount), [format, playerCount]);

    // Уровень 2: валидация групп
    const level2Check: GroupValidation = useMemo(() => {
        if (format !== 'RR_THEN_SE') {
            return {
                status: 'OK',
                messages: [],
                suggestedGroupCount: undefined,
                suggestedAdvance: undefined,
                matchEstimate: { groupStage: 0, playoff: 0, total: 0, estimatedHours: 0 },
            };
        }
        return validateGroupSetup(playerCount, groupCount, advanceCount, format, 4);
    }, [playerCount, groupCount, advanceCount, format]);

    // 🎯 ДЛЯ ОЛИМПИЙКИ: показываем ИНФО о квалификации
    const seBracketInfo = useMemo(() => {
        if (format !== 'SE' && format !== 'APP12') return null;
        const config = calculateBracketConfig(playerCount);
        const balance = assessQualifyingRoundBalance(config);
        return { config, balance };
    }, [format, playerCount]);

    const canSubmit = level1Check.status !== 'BLOCKED' && level2Check.status !== 'ERROR';

    const applyRecommendation = () => {
        if (level2Check.suggestedGroupCount) setGroupCount(level2Check.suggestedGroupCount);
        if (level2Check.suggestedAdvance) setAdvanceCount(level2Check.suggestedAdvance);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-card w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto scrollbar-thin">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-muted hover:text-strong rounded-lg hover:bg-hover transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-strong">Настройка схемы турнира</h2>
                        <p className="text-xs text-muted">
                            {category.name} · Группа {category.ratingGroup} ({playerCount} зарегистрировано)
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* УРОВЕНЬ 1: МАТРИЦА ФОРМАТОВ */}
                    <div>
                        <label className="text-xs font-bold text-dim uppercase tracking-wider block mb-2">
                            Уровень 1: Схема проведения
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {FORMAT_RULES.map((item) => {
                                const avail = checkFormatAvailability(item.format, playerCount);
                                const isSelected = format === item.format;
                                const isBlocked = avail.status === 'BLOCKED';
                                const isWarn = avail.status === 'WARNING';

                                return (
                                    <button
                                        key={item.format}
                                        type="button"
                                        onClick={() => setFormat(item.format)}
                                        disabled={isBlocked}
                                        className={`flex flex-col p-3 rounded-xl border text-left transition-all relative ${
                                            isSelected
                                                ? 'border-accent bg-accent/10 shadow-sm'
                                                : isBlocked
                                                    ? 'border-subtle bg-subtle/10 opacity-50 cursor-not-allowed'
                                                    : 'border-subtle bg-subtle/30 hover:bg-subtle'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-accent' : isBlocked ? 'text-dim' : 'text-strong'}`}>
                                                {item.label}
                                            </span>

                                            {isBlocked && (
                                                <span className="text-[9px] font-bold bg-danger/20 text-danger border border-danger/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Ban className="w-2.5 h-2.5" /> Заблокирован
                                                </span>
                                            )}
                                            {isWarn && !isBlocked && (
                                                <span className="text-[9px] font-bold bg-warning/20 text-warning border border-warning/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <AlertCircle className="w-2.5 h-2.5" /> Нюансы
                                                </span>
                                            )}
                                            {!isBlocked && !isWarn && (
                                                <span className="text-[9px] font-bold bg-success/20 text-success border border-success/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Check className="w-2.5 h-2.5" /> Идеально
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[10px] text-dim">{item.desc}</span>

                                        {isBlocked && avail.reason && (
                                            <span className="text-[9px] text-danger mt-1.5 font-medium leading-tight block">
                                                {avail.reason}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {level1Check.status === 'WARNING' && level1Check.reason && (
                        <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-warning text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{level1Check.reason}</span>
                        </div>
                    )}

                    {/* 🎯 ИНФО О КВАЛИФИКАЦИОННОМ РАУНДЕ ДЛЯ SE / APP12 */}
                    {seBracketInfo && (
                        <div className="p-4 bg-subtle/30 border border-subtle rounded-xl space-y-3">
                            <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Структура сетки (Квалификация + Основная)
                            </label>

                            {seBracketInfo.config.hasQualifyingRound ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-2">
                                            <p className="text-dim font-bold uppercase text-[9px] tracking-wider mb-0.5">Квалификация</p>
                                            <p className="text-accent font-black text-sm">
                                                {seBracketInfo.config.qualifyingMatches} матчей
                                            </p>
                                            <p className="text-[9px] text-dim">
                                                Играют {seBracketInfo.config.qualifyingPlayerCount} чел.
                                            </p>
                                        </div>
                                        <div className="bg-subtle/40 rounded-lg p-2">
                                            <p className="text-dim font-bold uppercase text-[9px] tracking-wider mb-0.5">Основная сетка</p>
                                            <p className="text-strong font-black text-sm">
                                                {seBracketInfo.config.mainBracketSize} слотов
                                            </p>
                                            <p className="text-[9px] text-dim">
                                                BYE: {seBracketInfo.config.byePlayerCount} чел.
                                            </p>
                                        </div>
                                    </div>

                                    {seBracketInfo.balance.status !== 'OK' && (
                                        <div
                                            className={`text-[11px] p-2 rounded ${
                                                seBracketInfo.balance.status === 'STRONG_WARNING'
                                                    ? 'bg-danger/10 text-danger'
                                                    : 'bg-warning/10 text-warning'
                                            }`}
                                        >
                                            {seBracketInfo.balance.message}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[11px] text-muted bg-success/10 border border-success/20 rounded-lg p-2 text-success">
                                    ✅ N = {playerCount} — уже степень 2, квалификация не нужна.
                                </div>
                            )}
                        </div>
                    )}

                    {/* УРОВЕНЬ 2: RR_THEN_SE */}
                    {format === 'RR_THEN_SE' && (
                        <div className="p-4 bg-subtle/30 border border-subtle rounded-xl space-y-4">
                            <label className="text-xs font-bold text-accent uppercase tracking-wider block">
                                Уровень 2: Конфигурация групп
                            </label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-strong">Количество групп:</span>
                                    <div className="flex items-center gap-1.5">
                                        {[4, 8, 13, 16, 21].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setGroupCount(num)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                    groupCount === num
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'bg-subtle text-muted hover:text-strong'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-strong">Выходят в олимпийку:</span>
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setAdvanceCount(num)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                    advanceCount === num
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'bg-subtle text-muted hover:text-strong'
                                                }`}
                                            >
                                                Топ-{num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {level2Check.messages.length > 0 && (
                                <div
                                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                        level2Check.status === 'ERROR'
                                            ? 'bg-danger/10 border-danger/30 text-danger'
                                            : level2Check.status === 'WARNING'
                                                ? 'bg-warning/10 border-warning/30 text-warning'
                                                : 'bg-success/10 border-success/30 text-success'
                                    }`}
                                >
                                    {level2Check.messages.map((msg, idx) => (
                                        <p key={idx} className="text-[11px] leading-relaxed font-medium">
                                            {msg}
                                        </p>
                                    ))}

                                    {(level2Check.status === 'ERROR' || level2Check.status === 'WARNING') && (
                                        <Button
                                            type="button"
                                            onClick={applyRecommendation}
                                            className="w-full mt-2 h-9 bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-1.5"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Применить рекомендацию BWF
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🎯 АЛГОРИТМ ПОСЕВА (с описанием разницы) */}
                    <div>
                        <label className="text-xs font-bold text-dim uppercase tracking-wider block mb-2">
                            Алгоритм посева
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    id: 'SNAKE',
                                    label: 'Змейка 🐍',
                                    desc: 'Равные по силе группы (стандарт B4U)',
                                    stats: 'Балансирует суммы рейтингов групп',
                                },
                                {
                                    id: 'UNIFORM',
                                    label: 'Равномерный 📊',
                                    desc: 'По слоям рейтинга (быстрее)',
                                    stats: 'Группа A всегда сильнейшая',
                                },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSeeding(s.id as SeedingType)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        seeding === s.id
                                            ? 'border-accent bg-accent/10'
                                            : 'border-subtle bg-subtle/20 hover:bg-subtle/40'
                                    }`}
                                >
                                    <p className={`text-xs font-bold ${seeding === s.id ? 'text-accent' : 'text-strong'}`}>
                                        {s.label}
                                    </p>
                                    <p className="text-[10px] text-muted mt-1">{s.desc}</p>
                                    <p className="text-[9px] text-dim italic mt-1">{s.stats}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        disabled={!canSubmit}
                        onClick={() => onGenerate(format, seeding, groupCount, advanceCount, autoSeed)}
                        className="w-full h-11 bg-accent text-accent-foreground font-bold hover:opacity-90 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {canSubmit ? 'Сгенерировать схему' : 'Запрещено (Исправьте ошибку)'}
                    </Button>
                </div>
            </div>
        </div>
    );
}