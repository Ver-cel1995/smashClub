export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-5xl">📡</span>
            <h1 className="text-xl font-bold text-white">Нет соединения</h1>
            <p className="text-sm text-neutral-500">
                Проверь интернет и попробуй снова
            </p>
        </div>
    )
}