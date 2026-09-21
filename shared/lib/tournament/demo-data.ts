// shared/lib/tournament/demo-data.ts
import type { BracketState } from '@/shared/types/bracket';
import { buildSingleEliminationBracket } from '@/shared/lib/tournament/bracket-engine';

const LAST_NAMES = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Павлов', 'Новиков', 'Егоров', 'Козлов', 'Степанов', 'Николаев'];
const FIRST_NAMES = ['Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 'Кирилл', 'Михаил'];

// 1. Генератор участников
export function generateMockParticipants(categoryId: string, count: number, startRating = 650) {
    return Array.from({ length: count }, (_, idx) => {
        const lastName = LAST_NAMES[idx % LAST_NAMES.length];
        const firstName = FIRST_NAMES[(idx * 2) % FIRST_NAMES.length];
        const rating = Math.max(300, startRating - idx * 15);

        return {
            id: `demo-p-${categoryId}-${idx + 1}`,
            category_id: categoryId,
            status: 'registered',
            player1: {
                id: `p1-${categoryId}-${idx}`,
                full_name: `${lastName} ${firstName}`,
                rating_singles: rating,
                rating_doubles: rating,
            },
        };
    });
}

// 2. Генерируем 18 участников для категории MS C
const msCParticipants = generateMockParticipants('demo-ms-c', 18, 740);

// 3. Собираем для них готовую олимпийскую сетку, чтобы демо было эффектным
const enginePlayers = msCParticipants.map(p => ({
    id: p.id,
    name: p.player1.full_name,
    rating: p.player1.rating_singles
}));
const msCMatches = buildSingleEliminationBracket(enginePlayers, 'SNAKE');

const msCBracketSettings: BracketState = {
    format: 'SE',
    seedingType: 'SNAKE',
    startingMatches: msCMatches.map((m: any) => ({
        id: m.id,
        p1: m.p1 === 'BYE' ? 'BYE' : m.p1 ? { id: m.p1.id, name: m.p1.name, rating: m.p1.rating } : null,
        p2: m.p2 === 'BYE' ? 'BYE' : m.p2 ? { id: m.p2.id, name: m.p2.name, rating: m.p2.rating } : null,
    })),
    rrPlayers: [],
    matchResults: {}
};

// 4. Экспортируем начальные категории (имитация ответа из БД)
export const DEMO_INITIAL_CATEGORIES: any[] = [
    {
        id: 'demo-ms-c',
        category: 'MS',
        rating_group: 'C',
        bracket_status: 'ready',
        bracket_format: 'single_elim',
        bracket_generated: true,
        bracket_settings: msCBracketSettings
    },
    {
        id: 'demo-ms-a',
        category: 'MS',
        rating_group: 'A',
        bracket_status: 'draft',
        bracket_format: null,
        bracket_generated: false,
        bracket_settings: null
    }
];

// 5. Экспортируем список участников
export const DEMO_INITIAL_PARTICIPANTS = msCParticipants;