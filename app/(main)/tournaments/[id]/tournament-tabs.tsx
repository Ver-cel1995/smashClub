'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export function TournamentTabs() {
    const [activeTab, setActiveTab] = useState('overview');

    // Простая логика переключения табов через скрытие/показ блоков по ID
    useEffect(() => {
        const tabs = ['overview', 'participants', 'brackets'];
        tabs.forEach(tab => {
            const el = document.getElementById(tab);
            if (el) {
                el.style.display = tab === activeTab ? 'block' : 'none';
            }
        });
    }, [activeTab]);

    return (
        <div className="flex px-4 gap-6 overflow-x-auto scrollbar-hide pt-3">
            {[
                { id: 'overview', label: 'Обзор' },
                { id: 'participants', label: 'Участники' },
                { id: 'brackets', label: 'Сетки' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        'pb-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2',
                        activeTab === tab.id
                            ? 'text-accent border-accent'
                            : 'text-muted border-transparent hover:text-main'
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}