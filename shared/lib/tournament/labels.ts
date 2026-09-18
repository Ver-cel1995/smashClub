import type { Discipline } from '@/shared/types/bracket';

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
    MS: 'Мужская одиночка',
    WS: 'Женская одиночка',
    MD: 'Мужская пара',
    WD: 'Женская пара',
    XD: 'Смешанная пара',
};

export const DISCIPLINE_SHORT: Record<Discipline, string> = {
    MS: 'МО',
    WS: 'ЖО',
    MD: 'МД',
    WD: 'ЖД',
    XD: 'СмД',
};

export const RATING_GROUP_LABELS: Record<string, string> = {
    A: 'Группа A (900+)',
    B: 'Группа B (750–900)',
    C: 'Группа C (600–750)',
    D: 'Группа D (480–600)',
    E: 'Группа E (380–480)',
};