export function AuthFooter() {
    return (
        <div className="space-y-2 text-center text-xs text-neutral-500">
            <p>Продолжая, вы соглашаетесь с условиями</p>
            <div className="flex items-center justify-center gap-2">
                <a href="#" className="hover:text-neutral-300">
                    Политика конфиденциальности
                </a>
                <span>•</span>
                <a href="#" className="hover:text-neutral-300">
                    Условия использования
                </a>
            </div>
        </div>
    )
}
