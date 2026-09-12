import Link from "next/link";

export function AuthFooter() {
    return (
        <div className="space-y-2 text-center text-xs text-neutral-500">
            <p className="text-center text-dim text-xs mt-6">
                Продолжая, вы соглашаетесь с{' '}
                <Link href="/terms" className="text-accent underline">условиями</Link>
                {' '}и{' '}
                <Link href="/privacy" className="text-accent underline">конфиденциальностью</Link>
            </p>
        </div>
    )
}
