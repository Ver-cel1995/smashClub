// shared/lib/tournament/bracket-engine.ts

import type { BracketFormat, SeedingType } from '@/shared/types/bracket';

// ============================================================
// БАЗОВЫЕ ИНТЕРФЕЙСЫ
// ============================================================
export interface EnginePlayer {
    id: string;
    name: string;
    rating: number;
}

export interface GroupStage {
    index: number;
    label: string;
    players: EnginePlayer[];
}

export interface EngineMatch {
    id: string;
    round: number;
    position: number;
    p1: EnginePlayer | 'BYE' | { placeholder: string } | null;
    p2: EnginePlayer | 'BYE' | { placeholder: string } | null;
}

export interface BracketRound {
    roundIndex: number;
    name: string;
    matchCount: number;
    matches: EngineMatch[];
}

export type ExtendedFormat = BracketFormat;

// ============================================================
// 🎯 1. КВАЛИФИКАЦИОННЫЙ РАУНД (Preliminary Round)
// ============================================================
export interface BracketConfig {
    totalPlayers: number;
    mainBracketSize: number;
    qualifyingMatches: number;
    byePlayerCount: number;
    qualifyingPlayerCount: number;
    hasQualifyingRound: boolean;
    totalRoundsMain: number;
}

export function calculateBracketConfig(playerCount: number): BracketConfig {
    if (playerCount <= 2) {
        return {
            totalPlayers: playerCount,
            mainBracketSize: 2,
            qualifyingMatches: 0,
            byePlayerCount: playerCount,
            qualifyingPlayerCount: 0,
            hasQualifyingRound: false,
            totalRoundsMain: 1,
        };
    }

    const mainBracketSize = Math.pow(2, Math.floor(Math.log2(playerCount)));

    if (mainBracketSize === playerCount) {
        return {
            totalPlayers: playerCount,
            mainBracketSize,
            qualifyingMatches: 0,
            byePlayerCount: playerCount,
            qualifyingPlayerCount: 0,
            hasQualifyingRound: false,
            totalRoundsMain: Math.log2(mainBracketSize),
        };
    }

    const excess = playerCount - mainBracketSize;
    const qualifyingMatches = excess;
    const qualifyingPlayerCount = excess * 2;
    const byePlayerCount = playerCount - qualifyingPlayerCount;

    return {
        totalPlayers: playerCount,
        mainBracketSize,
        qualifyingMatches,
        byePlayerCount,
        qualifyingPlayerCount,
        hasQualifyingRound: true,
        totalRoundsMain: Math.log2(mainBracketSize),
    };
}

export interface QualifyingBalance {
    status: 'OK' | 'WARNING' | 'STRONG_WARNING';
    message: string;
    ratio: number;
}

export function assessQualifyingRoundBalance(config: BracketConfig): QualifyingBalance {
    if (!config.hasQualifyingRound) {
        return {
            status: 'OK',
            message: 'Квалификация не нужна — количество участников уже равно степени 2.',
            ratio: 0,
        };
    }

    const ratio = config.qualifyingMatches / config.mainBracketSize;
    const playedInQualifyingPct = Math.round(
        (config.qualifyingPlayerCount / config.totalPlayers) * 100
    );

    if (ratio <= 0.25) {
        return {
            status: 'OK',
            message: `Квалификация: ${config.qualifyingMatches} матчей (${config.qualifyingPlayerCount} из ${config.totalPlayers} игроков играют). Сбалансировано.`,
            ratio,
        };
    }

    if (ratio <= 0.5) {
        return {
            status: 'WARNING',
            message: `⚠️ Квалификация: ${config.qualifyingMatches} матчей — ${playedInQualifyingPct}% игроков играют доп. раунд. Рассмотрите Группы + Сетка.`,
            ratio,
        };
    }

    return {
        status: 'STRONG_WARNING',
        message: `🔴 Квалификация: ${config.qualifyingMatches} матчей — больше половины основной сетки! Настоятельно рекомендуем формат Группы + Сетка.`,
        ratio,
    };
}

export function generateQualifyingRound(players: EnginePlayer[]): EngineMatch[] {
    const config = calculateBracketConfig(players.length);
    if (!config.hasQualifyingRound) return [];

    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const matches: EngineMatch[] = [];

    const byeCount = config.byePlayerCount;
    const qualCount = config.qualifyingMatches;

    for (let i = 0; i < qualCount; i++) {
        const strongSeedIndex = byeCount + i;
        const weakSeedIndex = config.totalPlayers - 1 - i;

        matches.push({
            id: `qual_m${i + 1}`,
            round: 0,
            position: i + 1,
            p1: sorted[strongSeedIndex],
            p2: sorted[weakSeedIndex],
        });
    }

    return matches;
}

export function generateMainBracketAfterQualifying(players: EnginePlayer[]): EngineMatch[] {
    const config = calculateBracketConfig(players.length);
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    const mainParticipants: (EnginePlayer | { placeholder: string })[] = [];

    for (let i = 0; i < config.byePlayerCount; i++) {
        mainParticipants.push(sorted[i]);
    }

    for (let i = 0; i < config.qualifyingMatches; i++) {
        mainParticipants.push({
            placeholder: `Победитель Q${i + 1}`,
        });
    }

    const slots = generateSEBracketSlots(config.mainBracketSize);
    const matches: EngineMatch[] = [];

    for (let i = 0; i < slots.length; i += 2) {
        const s1 = slots[i];
        const s2 = slots[i + 1];

        matches.push({
            id: `main_r1_m${Math.floor(i / 2) + 1}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            p1: mainParticipants[s1 - 1] || null,
            p2: mainParticipants[s2 - 1] || null,
        });
    }

    return matches;
}

// ============================================================
// 🎯 2. АЛГОРИТМЫ ПОСЕВА со статистикой (Snake vs Uniform)
// ============================================================
export interface SeedingStats {
    groupSums: number[];
    groupAverages: number[];
    maxSumDifference: number;
    maxIntraGroupSpread: number;
    balanceScore: 'PERFECT' | 'GOOD' | 'MODERATE' | 'POOR';
}

export interface SeedingResult {
    groups: GroupStage[];
    stats: SeedingStats;
}

export function seedPlayers(
    players: EnginePlayer[],
    groupCount: number,
    mode: SeedingType
): SeedingResult {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    const groups: GroupStage[] = Array.from({ length: groupCount }, (_, i) => ({
        index: i,
        label: getGroupLabel(i),
        players: [],
    }));

    sorted.forEach((player, i) => {
        const round = Math.floor(i / groupCount);
        const posInRound = i % groupCount;

        let groupIndex: number;

        if (mode === 'SNAKE' || mode === 'RATING') {
            groupIndex = round % 2 === 0 ? posInRound : groupCount - 1 - posInRound;
        } else if (mode === 'RANDOM') {
            groupIndex = Math.floor(Math.random() * groupCount);
        } else {
            groupIndex = posInRound; // UNIFORM
        }

        groups[groupIndex].players.push(player);
    });

    const groupSums = groups.map((g) =>
        g.players.reduce((sum, p) => sum + p.rating, 0)
    );

    const groupAverages = groups.map((g, i) =>
        g.players.length > 0 ? Math.round(groupSums[i] / g.players.length) : 0
    );

    const maxSumDifference = Math.max(...groupSums) - Math.min(...groupSums);

    const intraGroupSpreads = groups.map((g) => {
        if (g.players.length < 2) return 0;
        const ratings = g.players.map((p) => p.rating);
        return Math.max(...ratings) - Math.min(...ratings);
    });
    const maxIntraGroupSpread = Math.max(...intraGroupSpreads);

    const avgRating = sorted.reduce((s, p) => s + p.rating, 0) / (sorted.length || 1);
    const balancePct = maxSumDifference / (avgRating * (groups[0]?.players.length || 1));

    let balanceScore: SeedingStats['balanceScore'];
    if (balancePct < 0.05) balanceScore = 'PERFECT';
    else if (balancePct < 0.15) balanceScore = 'GOOD';
    else if (balancePct < 0.30) balanceScore = 'MODERATE';
    else balanceScore = 'POOR';

    return {
        groups,
        stats: { groupSums, groupAverages, maxSumDifference, maxIntraGroupSpread, balanceScore },
    };
}

export function snakeSeeding(players: EnginePlayer[], groupCount: number): GroupStage[] {
    return seedPlayers(players, groupCount, 'SNAKE').groups;
}

export function uniformSeeding(players: EnginePlayer[], groupCount: number): GroupStage[] {
    return seedPlayers(players, groupCount, 'UNIFORM').groups;
}

function getGroupLabel(index: number): string {
    if (index < 26) return String.fromCharCode(65 + index);
    return `G${index + 1}`;
}

// ============================================================
// 3. МАТРИЦА ФОРМАТОВ (2 УРОВНЯ ВАЛИДАЦИИ)
// ============================================================
export type AvailabilityStatus = 'ALLOWED' | 'WARNING' | 'BLOCKED';

export interface FormatAvailability {
    status: AvailabilityStatus;
    reason?: string;
    suggestion?: ExtendedFormat;
}

export interface FormatRule {
    format: ExtendedFormat;
    label: string;
    desc: string;
    minPlayers: number;
    maxPlayers: number;
    warnAbove: number;
    suggestion?: ExtendedFormat;
}

export const FORMAT_RULES: FormatRule[] = [
    { format: 'RR_THEN_SE', label: 'Группы → Сетка', desc: 'Разминка в группах + Плей-офф', minPlayers: 6, maxPlayers: 256, warnAbove: 128 },
    { format: 'SE', label: 'Олимпийка (Прил. 11)', desc: 'С квалификационным раундом', minPlayers: 4, maxPlayers: 256, warnAbove: 128, suggestion: 'RR_THEN_SE' },
    { format: 'APP12', label: 'Олимпийка (Прил. 12)', desc: 'С нижней сеткой за 3-е место', minPlayers: 4, maxPlayers: 128, warnAbove: 64, suggestion: 'RR_THEN_SE' },
    { format: 'SWISS', label: 'Швейцарская система', desc: 'Все играют равное количество раундов', minPlayers: 8, maxPlayers: 256, warnAbove: 128, suggestion: 'RR_THEN_SE' },
    { format: 'SE_WITH_PLACES', label: 'Олимпийка + Места', desc: 'Разыгрывание всех мест с 1 по N', minPlayers: 4, maxPlayers: 64, warnAbove: 32, suggestion: 'RR_THEN_SE' },
    { format: 'DOUBLE_ELIM', label: 'Двойное выбывание', desc: 'Вылет после 2 поражений', minPlayers: 4, maxPlayers: 32, warnAbove: 16, suggestion: 'RR_THEN_SE' },
    { format: 'RR', label: 'Круговая (1 круг)', desc: 'Каждый с каждым', minPlayers: 3, maxPlayers: 12, warnAbove: 8, suggestion: 'RR_THEN_SE' },
    { format: 'ROUND_ROBIN_DOUBLE', label: 'Круговая (2 круга)', desc: 'Каждый с каждым дважды', minPlayers: 3, maxPlayers: 8, warnAbove: 6, suggestion: 'RR' },
];

export function checkFormatAvailability(format: ExtendedFormat, playerCount: number): FormatAvailability {
    const rule = FORMAT_RULES.find((r) => r.format === format);
    if (!rule) return { status: 'ALLOWED' };

    if (playerCount < rule.minPlayers) {
        return { status: 'BLOCKED', reason: `Минимум ${rule.minPlayers} участников`, suggestion: rule.suggestion };
    }

    if (playerCount > rule.maxPlayers) {
        let reason = `Максимум ${rule.maxPlayers} участников для данного формата.`;
        if (format === 'RR' || format === 'ROUND_ROBIN_DOUBLE') {
            reason = `Круговая на ${playerCount} чел. = ${(playerCount * (playerCount - 1)) / 2} матчей! Максимум ${rule.maxPlayers} участников.`;
        }
        return { status: 'BLOCKED', reason, suggestion: rule.suggestion };
    }

    if (playerCount > rule.warnAbove) {
        let reason = `При ${playerCount} участниках этот формат может затянуться.`;
        if (format === 'SE') {
            const config = calculateBracketConfig(playerCount);
            const balance = assessQualifyingRoundBalance(config);
            if (balance.status !== 'OK') reason = balance.message;
        }
        return { status: 'WARNING', reason, suggestion: rule.suggestion };
    }

    return { status: 'ALLOWED' };
}

export const GROUP_SIZE_LIMITS: Record<string, { min: number; max: number; recommended: number; hardMax: number }> = {
    RR_THEN_SE: { min: 3, max: 6, recommended: 4, hardMax: 8 },
    RR: { min: 3, max: 8, recommended: 6, hardMax: 12 },
};

export interface GroupValidation {
    status: 'OK' | 'WARNING' | 'ERROR';
    messages: string[];
    suggestedGroupCount?: number;
    suggestedAdvance?: number;
    matchEstimate: { groupStage: number; playoff: number; total: number; estimatedHours: number };
}

export function validateGroupSetup(
    playerCount: number, groupCount: number, advancePerGroup: number,
    format: ExtendedFormat, courtCount: number = 4, tGroupMinutes: number = 12, tPlayoffMinutes: number = 22
): GroupValidation {
    const limits = GROUP_SIZE_LIMITS[format] || { min: 3, max: 6, recommended: 4, hardMax: 8 };
    const messages: string[] = [];
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';

    const baseSize = Math.floor(playerCount / groupCount);
    const remainder = playerCount % groupCount;
    const maxGroupSize = remainder > 0 ? baseSize + 1 : baseSize;
    const minGroupSize = baseSize;

    let groupMatches = 0;
    for (let i = 0; i < groupCount; i++) {
        const size = i < remainder ? baseSize + 1 : baseSize;
        groupMatches += (size * (size - 1)) / 2;
    }

    const playoffSlots = groupCount * advancePerGroup;
    const playoffSize = calcBracketSize(playoffSlots);
    const playoffMatches = playoffSize - 1;
    const totalMatches = groupMatches + playoffMatches;

    const hours = Math.round(((groupMatches * tGroupMinutes + playoffMatches * tPlayoffMinutes) / courtCount / 60) * 10) / 10;

    if (maxGroupSize > limits.hardMax) {
        status = 'ERROR';
        messages.push(`❌ Группа из ${maxGroupSize} чел. недопустима (макс. ${limits.hardMax}).`);
    }
    if (minGroupSize < limits.min) {
        status = 'ERROR';
        messages.push(`❌ Группа из ${minGroupSize} чел. слишком мала (мин. ${limits.min}).`);
    }
    if (advancePerGroup >= minGroupSize) {
        status = 'ERROR';
        messages.push(`❌ Выходит ${advancePerGroup} чел. при размере группы ${minGroupSize}. Должно быть меньше.`);
    }

    if (status !== 'ERROR' && maxGroupSize > limits.max) {
        status = 'WARNING';
        messages.push(`⚠️ Группа из ${maxGroupSize} чел. больше рекомендованных ${limits.max}.`);
    }

    let suggestedGroupCount: number | undefined;
    let suggestedAdvance: number | undefined = advancePerGroup;

    if (status === 'ERROR' || maxGroupSize > limits.recommended) {
        const optimalOptions = calculateOptimalGroups(playerCount, courtCount);
        if (optimalOptions.length > 0) {
            suggestedGroupCount = optimalOptions[0].groupCount;
            suggestedAdvance = optimalOptions[0].advancePerGroup;
            messages.push(`💡 Рекомендация BWF: ${suggestedGroupCount} групп → Топ-${suggestedAdvance}.`);
        }
    }

    if (status === 'OK') messages.push(`✅ Конфигурация корректна: ${groupCount} групп, ${totalMatches} матчей (~${hours}ч на ${courtCount} кортах).`);

    return { status, messages, suggestedGroupCount, suggestedAdvance, matchEstimate: { groupStage: groupMatches, playoff: playoffMatches, total: totalMatches, estimatedHours: hours } };
}

export interface GroupConfigRecommendation {
    groupCount: number;
    playersPerGroup: number[];
    advancePerGroup: number;
    totalGroupMatches: number;
    playoffSlots: number;
    playoffSize: number;
    estimatedHours: number;
}

export function calculateOptimalGroups(playerCount: number, courtCount: number = 4): GroupConfigRecommendation[] {
    const options: GroupConfigRecommendation[] = [];

    for (const targetSize of [4, 5, 3, 6]) {
        for (const advance of [2, 1, 3]) {
            const groupCount = Math.ceil(playerCount / targetSize);
            const baseSize = Math.floor(playerCount / groupCount);
            const remainder = playerCount % groupCount;

            if (baseSize < 3 || baseSize + (remainder > 0 ? 1 : 0) > 8) continue;

            const playersPerGroup = Array.from({ length: groupCount }, (_, i) => i < remainder ? baseSize + 1 : baseSize);
            const totalGroupMatches = playersPerGroup.reduce((sum, n) => sum + (n * (n - 1)) / 2, 0);

            const playoffSlots = groupCount * advance;
            const playoffSize = calcBracketSize(playoffSlots);
            const playoffMatches = playoffSize - 1;

            const hours = Math.round(((totalGroupMatches * 12 + playoffMatches * 22) / courtCount / 60) * 10) / 10;

            options.push({ groupCount, playersPerGroup, advancePerGroup: advance, totalGroupMatches, playoffSlots, playoffSize, estimatedHours: hours });
        }
    }

    return options.sort((a, b) => {
        const aPow2 = (a.playoffSlots & (a.playoffSlots - 1)) === 0;
        const bPow2 = (b.playoffSlots & (b.playoffSlots - 1)) === 0;
        if (aPow2 !== bPow2) return aPow2 ? -1 : 1;
        return a.estimatedHours - b.estimatedHours;
    });
}

export function calcBracketSize(n: number): number {
    let b = 1;
    while (b < Math.max(n, 2)) b *= 2;
    return b;
}

export function generateSEBracketSlots(size: number): number[] {
    if (size <= 1) return [1];
    if (size === 2) return [1, 2];
    const prev = generateSEBracketSlots(size / 2);
    const result: number[] = [];
    for (const seed of prev) {
        result.push(seed);
        result.push(size + 1 - seed);
    }
    return result;
}

// ============================================================
// 4. ГЕНЕРАТОРЫ СЕТОК И СВЯЗЕЙ (Продвижение победителей)
// ============================================================
export interface GroupsThenSEData {
    groups: GroupStage[];
    advanceCount: number;
    playoffRounds: BracketRound[];
    seedingStats?: SeedingStats;
    seedingMode?: SeedingType;
}

export function buildGroupsThenSE(
    players: EnginePlayer[],
    groupCount: number,
    advanceCount: number,
    seedingMode: SeedingType = 'SNAKE'
): GroupsThenSEData {
    const seedingResult = seedPlayers(players, groupCount, seedingMode);
    const groups = seedingResult.groups;

    const playoffSlots = groupCount * advanceCount;
    const bracketSize = calcBracketSize(playoffSlots);
    const slots = generateSEBracketSlots(bracketSize);

    const seedsList: string[] = [];
    for (let g = 0; g < groupCount; g++) seedsList.push(`1${groups[g].label}`);
    if (advanceCount >= 2) {
        for (let g = groupCount - 1; g >= 0; g--) seedsList.push(`2${groups[g].label}`);
    }
    if (advanceCount >= 3) {
        for (let g = 0; g < groupCount; g++) seedsList.push(`3${groups[g].label}`);
    }

    const r1Matches: EngineMatch[] = [];
    for (let i = 0; i < slots.length; i += 2) {
        const s1 = slots[i];
        const s2 = slots[i + 1];
        const label1 = seedsList[s1 - 1] ?? 'BYE';
        const label2 = seedsList[s2 - 1] ?? 'BYE';

        r1Matches.push({
            id: `po_r1_m${Math.floor(i / 2) + 1}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            p1: label1 === 'BYE' ? 'BYE' : ({ id: label1, name: label1, rating: 0 } as any),
            p2: label2 === 'BYE' ? 'BYE' : ({ id: label2, name: label2, rating: 0 } as any),
        });
    }

    const totalRounds = Math.log2(bracketSize);
    const playoffRounds: BracketRound[] = [];

    playoffRounds.push({
        roundIndex: 1,
        name: getRoundName(bracketSize / 2),
        matchCount: bracketSize / 2,
        matches: r1Matches,
    });

    let matchesInRound = bracketSize / 2;
    for (let r = 2; r <= totalRounds; r++) {
        matchesInRound /= 2;
        const ms: EngineMatch[] = [];
        for (let pos = 1; pos <= matchesInRound; pos++) {
            ms.push({
                id: `po_r${r}_m${pos}`,
                round: r,
                position: pos,
                p1: null,
                p2: null,
            });
        }
        playoffRounds.push({
            roundIndex: r,
            name: getRoundName(matchesInRound),
            matchCount: matchesInRound,
            matches: ms,
        });
    }

    return { groups, advanceCount, playoffRounds, seedingStats: seedingResult.stats, seedingMode };
}

// 🎯 ФУНКЦИЯ ПОСЕВА ОЛИМПИЙКИ С ЗАЩИТОЙ ДЛЯ ЛЮБИТЕЛЕЙ (UNIFORM/SNAKE = перемешивание слабых)
export function buildSingleEliminationBracket(
    players: EnginePlayer[],
    seedingMode: SeedingType = 'RATING'
): EngineMatch[] {
    let arranged = [...players];

    if (seedingMode === 'RATING') {
        // Строгий спорт (1 vs 64)
        arranged.sort((a, b) => b.rating - a.rating);
    } else if (seedingMode === 'RANDOM') {
        // Чистый жребий
        arranged.sort(() => Math.random() - 0.5);
    } else {
        // SNAKE / UNIFORM: Сеем только топ-25% сильнейших, остальных перемешиваем, чтобы не было избиения
        arranged.sort((a, b) => b.rating - a.rating);
        const seededCount = Math.max(4, Math.floor(arranged.length / 4));
        const topSeeds = arranged.slice(0, seededCount);
        const unseeded = arranged.slice(seededCount).sort(() => Math.random() - 0.5);
        arranged = [...topSeeds, ...unseeded];
    }

    const B = calcBracketSize(arranged.length);
    const slots = generateSEBracketSlots(B);
    const matches: EngineMatch[] = [];

    for (let i = 0; i < slots.length; i += 2) {
        const seed1 = slots[i];
        const seed2 = slots[i + 1];
        const p1 = seed1 <= arranged.length ? arranged[seed1 - 1] : 'BYE';
        const p2 = seed2 <= arranged.length ? arranged[seed2 - 1] : 'BYE';

        matches.push({
            id: `main_r1_m${Math.floor(i / 2) + 1}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            p1,
            p2,
        });
    }

    return matches;
}

export function buildClassicTournamentTree(players: EnginePlayer[]): BracketRound[] {
    // Эта функция сейчас используется для отрисовки "пустой" классики.
    // Заменяется buildFullBracketRounds в реальном судействе.
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const N = sorted.length;
    if (N === 0) return [];

    const B = calcBracketSize(N);
    const totalRounds = Math.log2(B);
    const slots = generateSEBracketSlots(B);
    const rounds: BracketRound[] = [];

    const r1: EngineMatch[] = [];
    for (let i = 0; i < slots.length; i += 2) {
        const seed1 = slots[i];
        const seed2 = slots[i + 1];
        r1.push({
            id: `r1_m${Math.floor(i / 2) + 1}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            p1: seed1 <= N ? sorted[seed1 - 1] : 'BYE',
            p2: seed2 <= N ? sorted[seed2 - 1] : 'BYE',
        });
    }

    rounds.push({ roundIndex: 1, name: getRoundName(B / 2), matchCount: B / 2, matches: r1 });

    let matchesInRound = B / 2;
    for (let r = 2; r <= totalRounds; r++) {
        matchesInRound /= 2;
        const ms: EngineMatch[] = [];
        for (let pos = 1; pos <= matchesInRound; pos++) {
            ms.push({ id: `r${r}_m${pos}`, round: r, position: pos, p1: null, p2: null });
        }
        rounds.push({ roundIndex: r, name: getRoundName(matchesInRound), matchCount: matchesInRound, matches: ms });
    }

    return rounds;
}

export interface BracketDisplayMatch {
    id: string;
    position: number;
    p1: EnginePlayer | 'BYE' | { placeholder: string } | null;
    p2: EnginePlayer | 'BYE' | { placeholder: string } | null;
    winner?: EnginePlayer | null;
    isAutoAdvanced?: boolean;
    hasResult?: boolean;
    result?: any;
}

export interface BracketDisplayRound {
    id: string;
    name: string;
    matchCount: number;
    matches: BracketDisplayMatch[];
}

export function buildFullBracketRounds(
    startingMatches: EngineMatch[],
    matchResults: Record<string, any> = {}
): BracketDisplayRound[] {
    if (!startingMatches || startingMatches.length === 0) return [];

    const rounds: BracketDisplayRound[] = [];
    let currentMatchesCount = startingMatches.length;
    let roundIndex = 1;

    // --- РАУНД 1 ---
    const r1Matches: BracketDisplayMatch[] = startingMatches.map((m) => {
        const p1 = m.p1 as EnginePlayer | 'BYE' | null;
        const p2 = m.p2 as EnginePlayer | 'BYE' | null;

        let winner: EnginePlayer | null = null;
        let isAutoAdvanced = false;

        // Автопроход из-за BYE в 1-м раунде
        if (p1 && p1 !== 'BYE' && p2 === 'BYE') { winner = p1; isAutoAdvanced = true; }
        if (p2 && p2 !== 'BYE' && p1 === 'BYE') { winner = p2; isAutoAdvanced = true; }

        // Ручной ввод счёта судьёй
        const res = matchResults[m.id];
        if (res && res.winnerId) {
            if (p1 && typeof p1 === 'object' && 'id' in p1 && p1.id === res.winnerId) {
                winner = p1;
            } else if (p2 && typeof p2 === 'object' && 'id' in p2 && p2.id === res.winnerId) {
                winner = p2;
            }
        }

        return { id: m.id, position: m.position, p1, p2, winner, isAutoAdvanced, hasResult: !!res };
    });

    rounds.push({ id: `r1`, name: getRoundName(currentMatchesCount, roundIndex), matchCount: currentMatchesCount, matches: r1Matches });

    // --- РАУНДЫ 2 И ДАЛЬШЕ (ПРОДВИЖЕНИЕ ПОБЕДИТЕЛЕЙ) ---
    let prevRoundMatches = r1Matches;

    while (currentMatchesCount > 1) {
        currentMatchesCount /= 2;
        roundIndex++;
        const nextRoundMatches: BracketDisplayMatch[] = [];

        for (let i = 0; i < currentMatchesCount; i++) {
            const sourceMatch1 = prevRoundMatches[i * 2];
            const sourceMatch2 = prevRoundMatches[i * 2 + 1];

            const p1: EnginePlayer | { placeholder: string } | null = sourceMatch1?.winner
                ? sourceMatch1.winner
                : { placeholder: `Поб. М${i * 2 + 1}` };

            const p2: EnginePlayer | { placeholder: string } | null = sourceMatch2?.winner
                ? sourceMatch2.winner
                : { placeholder: `Поб. М${i * 2 + 2}` };

            let winner: EnginePlayer | null = null;
            let isAutoAdvanced = false;
            const matchId = `main_r${roundIndex}_m${i + 1}`;

            // Проверка ручного счёта судьи (с защитой типов 'id' in p)
            const res = matchResults[matchId];
            if (res && res.winnerId) {
                if (p1 && typeof p1 === 'object' && 'id' in p1 && p1.id === res.winnerId) {
                    winner = p1 as EnginePlayer;
                } else if (p2 && typeof p2 === 'object' && 'id' in p2 && p2.id === res.winnerId) {
                    winner = p2 as EnginePlayer;
                }
            }

            nextRoundMatches.push({ id: matchId, position: i + 1, p1, p2, winner, isAutoAdvanced, hasResult: !!res });
        }

        rounds.push({ id: `r${roundIndex}`, name: getRoundName(currentMatchesCount, roundIndex), matchCount: currentMatchesCount, matches: nextRoundMatches });
        prevRoundMatches = nextRoundMatches;
    }

    return rounds;
}

export function generateRoundRobinSchedule(playerCount: number) {
    const n = playerCount % 2 === 0 ? playerCount : playerCount + 1;
    const rounds = n - 1;
    const halfSize = n / 2;
    const matches: { round: number; player1Index: number; player2Index: number }[] = [];
    const players = Array.from({ length: n }, (_, i) => i);

    for (let round = 0; round < rounds; round++) {
        for (let match = 0; match < halfSize; match++) {
            const home = players[match];
            const away = players[n - 1 - match];
            if (playerCount % 2 !== 0 && (home === n - 1 || away === n - 1)) continue;
            matches.push({ round: round + 1, player1Index: home, player2Index: away });
        }
        const last = players.pop()!;
        players.splice(1, 0, last);
    }
    return matches;
}

export function getRoundName(matchCount: number, roundIndex?: number): string {
    if (matchCount === 1) return 'Финал';
    if (matchCount === 2) return 'Полуфинал';
    if (matchCount === 4) return '1/4 финала';
    if (matchCount === 8) return '1/8 финала';
    if (matchCount === 16) return '1/16 финала';
    if (matchCount === 32) return '1/32 финала';
    if (matchCount === 64) return '1/64 финала';
    return `Раунд ${roundIndex || ''}`;
}