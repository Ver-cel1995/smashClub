import imageCompression from 'browser-image-compression'

export type CompressOptions = {
    /** Максимальный размер в МБ */
    maxSizeMB?: number
    /** Максимальная сторона (px) */
    maxWidthOrHeight?: number
    /** Использовать WebP если возможно */
    useWebp?: boolean
}

const DEFAULTS: Required<CompressOptions> = {
    maxSizeMB: 0.8, // ~800кб
    maxWidthOrHeight: 1920,
    useWebp: true,
}

/**
 * Сжимает изображение в браузере перед загрузкой.
 * Возвращает исходный файл, если сжатие не применимо (напр. это не картинка).
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<File> {
    if (!file.type.startsWith('image/')) return file
    // GIF/SVG не трогаем
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

    const opts = { ...DEFAULTS, ...options }

    try {
        const compressed = await imageCompression(file, {
            maxSizeMB: opts.maxSizeMB,
            maxWidthOrHeight: opts.maxWidthOrHeight,
            useWebWorker: true,
            fileType: opts.useWebp ? 'image/webp' : file.type,
            initialQuality: 0.85,
        })

        // Если после сжатия стало БОЛЬШЕ — возвращаем оригинал
        if (compressed.size >= file.size) return file

        // Восстанавливаем нормальное имя с новым расширением
        const nameNoExt = file.name.replace(/\.[^.]+$/, '')
        const ext = opts.useWebp ? 'webp' : file.name.split('.').pop() || 'jpg'
        return new File([compressed], `${nameNoExt}.${ext}`, {
            type: compressed.type,
            lastModified: Date.now(),
        })
    } catch (e) {
        console.error('[compressImage] fallback to original:', e)
        return file
    }
}

/**
 * Пачечное сжатие
 */
export async function compressImages(
    files: File[],
    options?: CompressOptions
): Promise<File[]> {
    return Promise.all(files.map((f) => compressImage(f, options)))
}