// app/(public)/layout.tsx
import React from 'react';
import { ThemeProvider } from '@/shared/lib/theme/theme-provider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-app text-main antialiased selection:bg-accent selection:text-accent-foreground">
                {children}
            </div>
        </ThemeProvider>
    );
}