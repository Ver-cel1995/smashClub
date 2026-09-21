import { GroupsThenSEData } from "@/shared/lib/tournament/bracket-engine";

export type Discipline = 'MS' | 'WS' | 'MD' | 'WD' | 'XD';

export type RatingGroup = 'A' | 'B' | 'C' | 'D' | 'E';

// Профессиональные форматы схем BWF
export type BracketFormat =
    | 'SE'                  // Олимпийка (Приложение 11)
    | 'RR'                  // Круговая (1 круг)
    | 'RR_THEN_SE'          // Группы + Олимпийка (Групповой этап + Плей-офф)
    | 'ROUND_ROBIN_DOUBLE'  // Круговая в 2 круга
    | 'DOUBLE_ELIM'         // Двойное выбывание
    | 'SWISS'               // Швейцарская система
    | 'SE_WITH_PLACES'      // Олимпийка с разыгрыванием всех мест
    | 'APP12';              // Длинная сетка (Приложение 12)

export type SeedingType = 'SNAKE' | 'RANDOM' | 'UNIFORM' | 'RATING';

export type Participant = {
    id: string;
    name: string;
    rating: number;
} | 'BYE' | null;

export type LocalMatch = {
    id: string;
    p1: Participant;
    p2: Participant;
};

export type Category = {
    id: string;
    name: Discipline;
    desc: string;
    ratingGroup: RatingGroup;
    count: number;
    status: 'draft' | 'ready';
    format?: BracketFormat;
};

// ------------------------------------------------------------
// СУДЕЙСТВО И РЕЗУЛЬТАТЫ МАТЧЕЙ
// ------------------------------------------------------------
export type GameScore = { p1: number; p2: number };

export type MatchResult = {
    winnerId: string;       // ID победителя (для продвижения по сетке)
    scores: GameScore[];    // Массив геймов, напр. [{p1: 21, p2: 15}, {p1: 21, p2: 18}]
    isWalkover?: boolean;   // Неявка / Техническое поражение
    isRetired?: boolean;    // Снятие из-за травмы
};

// ------------------------------------------------------------
// ГЛАВНОЕ СОСТОЯНИЕ СЕТКИ (Хранится в БД в формате JSONB)
// ------------------------------------------------------------
export type BracketState = {
    format: BracketFormat;
    startingMatches: LocalMatch[];                  // Матчи 1-го раунда (или основной сетки)
    rrPlayers: Participant[];                       // Участники для круговой системы
    seedingType?: SeedingType;                      // Выбранный режим посева
    groupsThenSE?: GroupsThenSEData;                // Данные двухэтапного турнира
    qualifyingMatches?: LocalMatch[];               // Матчи квалификационного раунда (пре-раунд)
    matchResults?: Record<string, MatchResult>;     // Словарь результатов: { [matchId]: MatchResult }
};