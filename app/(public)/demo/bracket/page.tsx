'use client';

import { BracketBuilder } from '@/components/tournaments/bracket/bracket-builder';
import { DEMO_INITIAL_CATEGORIES, DEMO_INITIAL_PARTICIPANTS } from '@/shared/lib/tournament/demo-data';

export default function DemoBracketPage() {
    return (
        <div className="w-full h-screen overflow-hidden bg-app">
            <BracketBuilder
                tournamentId="demo-stand"
                initialCategories={DEMO_INITIAL_CATEGORIES}
                initialParticipants={DEMO_INITIAL_PARTICIPANTS}
                initialMatches={[]}
                isDemo={true}
            />
        </div>
    );
}