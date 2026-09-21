// seed-tournament.mjs
import { createClient } from '@supabase/supabase-js';
import { fakerRU as faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Ошибка: В .env.local не найдены NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
    console.log('🔍 Находим активный турнир...');

    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, title')
        .limit(1);

    if (!tournaments || tournaments.length === 0) {
        console.error('❌ Не найдено ни одного турнира в БД.');
        return;
    }

    const tournamentId = tournaments[0].id;
    console.log(`🏆 Выбран турнир: "${tournaments[0].title}" (${tournamentId})`);

    // Находим категорию или создаем новую
    let { data: categories } = await supabase
        .from('tournament_categories')
        .select('id, category, rating_group')
        .eq('tournament_id', tournamentId);

    let categoryId = categories && categories.length > 0 ? categories[0].id : null;

    if (!categoryId) {
        console.log('⚠️ Категорий не найдено, создаем новую категорию MS C...');
        const { data: newCat, error: createCatErr } = await supabase
            .from('tournament_categories')
            .insert({
                tournament_id: tournamentId,
                category: 'MS',
                rating_group: 'C',
                max_pairs: 64
            })
            .select('id')
            .single();

        if (createCatErr || !newCat) {
            console.error('❌ Не удалось создать категорию:', createCatErr?.message);
            return;
        }
        categoryId = newCat.id;
    }

    console.log(`📂 Записываем участников в категорию ID: ${categoryId}`);

    const createdPlayerIds = [];

    for (let i = 1; i <= 64; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${lastName} ${firstName}`;
        const email = `test_player_${Date.now()}_${i}@smashclub.test`;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError || !authUser.user) {
            console.error(`❌ Ошибка создания юзера ${i}:`, authError?.message);
            continue;
        }

        const userId = authUser.user.id;
        createdPlayerIds.push(userId);

        const ratingSingles = faker.number.int({ min: 300, max: 850 });
        const ratingDoubles = faker.number.int({ min: 300, max: 850 });

        await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: fullName,
                rating_singles: ratingSingles,
                rating_doubles: ratingDoubles,
                gender: i % 2 === 0 ? 'male' : 'female',
            }, { onConflict: 'id' });

        if (i % 16 === 0 || i === 64) {
            console.log(`... Создано ${i}/64 игроков`);
        }
    }

    console.log('🏆 Регистрируем игроков в категории турнира...');

    const participantsToInsert = createdPlayerIds.map((playerId) => ({
        tournament_id: tournamentId,
        category_id: categoryId,
        player1_id: playerId,
        status: 'confirmed',
    }));

    const { error: partError } = await supabase
        .from('tournament_participants')
        .insert(participantsToInsert);

    if (partError) {
        console.error('❌ Ошибка при записи участников:', partError.message);
    } else {
        console.log(`✅ УСПЕХ! ${createdPlayerIds.length} участников успешно добавлены в турнир.`);
    }
}

seed();