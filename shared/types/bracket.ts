export type Discipline = 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
export type RatingGroup = 'A' | 'B' | 'C' | 'D' | 'E';
export type BracketFormat = 'SE' | 'RR';
export type SeedingType = 'SNAKE' | 'RANDOM';

export type Participant =
    | { id: string; name: string; rating: number }
    | null
    | 'BYE';

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
    status: 'draft' | 'ready' | 'pending';
    format?: BracketFormat;
};

export type BracketState = {
    format: BracketFormat;
    startingMatches: LocalMatch[];
    rrPlayers: Participant[];
    seedingType?: SeedingType;
};