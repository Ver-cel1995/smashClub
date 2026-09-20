export interface EnginePlayer {
    id: string;
    name: string;
    rating: number;
}

export interface GroupStage {
    label: string; // 'A', 'B', 'C'...
    players: (EnginePlayer | null)[];
}

export interface MatchSlot {
    seed?: number;
    player?: EnginePlayer | 'BYE' | null;
    placeholder?: string;
}

export interface EngineMatch {
    id: string;
    round: number;
    position: number;
    p1: MatchSlot;
    p2: MatchSlot;
    winnerId?: string;
}

// ============================================================
// 1. ПОСЕВ: ЗМЕЙКА (SNAKE SEEDING)
// ============================================================
export function snakeSeeding(players: EnginePlayer[], groupCount: number): GroupStage[] {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const groups: GroupStage[] = Array.from({ length: groupCount }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        players: [],
    }));

    sorted.forEach((player, i) => {
        const round = Math.floor(i / groupCount);
        const posInRound = i % groupCount;
        const groupIndex = round % 2 === 0 ? posInRound : groupCount - 1 - posInRound;
        groups[groupIndex].players.push(player);
    });

    return groups;
}

// ============================================================
// 2. ПОСЕВ: РАВНОМЕРНЫЙ (UNIFORM SEEDING)
// ============================================================
export function uniformSeeding(players: EnginePlayer[], groupCount: number): GroupStage[] {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const groups: GroupStage[] = Array.from({ length: groupCount }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        players: [],
    }));

    sorted.forEach((player, i) => {
        const groupIndex = i % groupCount;
        groups[groupIndex].players.push(player);
    });

    return groups;
}

// ============================================================
// 3. СЕТКА ОЛИМПИЙКИ (SINGLE ELIMINATION / BWF SEEDING SLOTS)
// ============================================================
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

// Расчёт BYE для ближайшей степени 2
export function calculateByes(playerCount: number) {
    let bracketSize = 1;
    while (bracketSize < playerCount) bracketSize *= 2;
    if (bracketSize < 2) bracketSize = 2;

    const byeCount = bracketSize - playerCount;
    // BYE отдаются топовым сеяным игрокам (1, 2, 3...)
    const byeSeeds = Array.from({ length: byeCount }, (_, i) => i + 1);

    return { bracketSize, byeCount, byeSeeds };
}

export function buildSingleEliminationBracket(players: EnginePlayer[], targetCount: number): EngineMatch[] {
    const actualSlots = Math.max(targetCount, players.length);

    let bracketSize = 1;
    while (bracketSize < actualSlots) bracketSize *= 2;
    if (bracketSize < 2) bracketSize = 2;

    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const slots = generateSEBracketSlots(bracketSize);

    const matches: EngineMatch[] = [];

    // Если мы генерируем просто шаблон (участников 0), пустые слоты будут null ("Ожидание")
    // Если турнир уже стартует (участники есть), то пустые слоты превращаются в BYE ("Проход дальше")
    const isTemplate = players.length === 0;

    for (let i = 0; i < slots.length; i += 2) {
        const seed1 = slots[i];
        const seed2 = slots[i + 1];

        const player1 = sorted[seed1 - 1] || null;
        const player2 = sorted[seed2 - 1] || null;

        const p1 = player1 ? player1 : (isTemplate ? null : 'BYE');
        const p2 = player2 ? player2 : (isTemplate ? null : 'BYE');

        matches.push({
            id: `m1_${Math.floor(i / 2) + 1}`,
            round: 1,
            position: Math.floor(i / 2) + 1,
            p1: { seed: seed1, player: p1 },
            p2: { seed: seed2, player: p2 },
        });
    }

    return matches;
}

// ============================================================
// 4. КРУГОВАЯ СИСТЕМА (CIRCLE METHOD SCHEDULE GENERATOR)
// ============================================================
export interface RRScheduleMatch {
    round: number;
    player1Index: number;
    player2Index: number;
}

export function generateRoundRobinSchedule(playerCount: number): RRScheduleMatch[] {
    const n = playerCount % 2 === 0 ? playerCount : playerCount + 1;
    const rounds = n - 1;
    const halfSize = n / 2;
    const matches: RRScheduleMatch[] = [];

    const players = Array.from({ length: n }, (_, i) => i);

    for (let round = 0; round < rounds; round++) {
        for (let match = 0; match < halfSize; match++) {
            const home = players[match];
            const away = players[n - 1 - match];

            if (playerCount % 2 !== 0 && (home === n - 1 || away === n - 1)) {
                continue; // Пропускаем виртуальный BYE
            }

            matches.push({
                round: round + 1,
                player1Index: home,
                player2Index: away,
            });
        }

        const last = players.pop()!;
        players.splice(1, 0, last);
    }

    return matches;
}

// ============================================================
// 5. ТРАНЗИТ ГРУППЫ -> СЕТКА ПЛЕЙ-ОФФ (1A vs 2D, 1B vs 2C)
// ============================================================
export interface GroupResultWinner {
    groupLabel: string;
    position: number; // 1, 2
    player: EnginePlayer;
}

export function transitionGroupsToPlayoff(groupCount: number): EngineMatch[] {
    // 4 группы -> 8 игроков (топ-2 из каждой): 1A vs 2D, 1B vs 2C, 1C vs 2B, 1D vs 2A
    const groupLabels = Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i));
    const matches: EngineMatch[] = [];

    for (let i = 0; i < groupCount; i++) {
        const firstGroup = groupLabels[i];
        const secondGroup = groupLabels[groupCount - 1 - i];

        matches.push({
            id: `po_1_${i + 1}`,
            round: 1,
            position: i + 1,
            p1: { placeholder: `1-е место гр. ${firstGroup}` },
            p2: { placeholder: `2-е место гр. ${secondGroup}` },
        });
    }

    return matches;
}