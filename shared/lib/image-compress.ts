export type CompressOptions = {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    useWebp?: boolean
}

const DEFAULTS: Required<CompressOptions> = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebp: true,
}

/**
 * Динамически подгружает библиотеку сжатия и сжимает файл.
 * Библиотека грузится только когда реально нужна.
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<File> {
    if (!file.type.startsWith('image/')) return file
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

    const opts = { ...DEFAULTS, ...options }

    try {
        // Динамический импорт — не попадает в главный бандл
        const imageCompression = (await import('browser-image-compression')).default

        const compressed = await imageCompression(file, {
            maxSizeMB: opts.maxSizeMB,
            maxWidthOrHeight: opts.maxWidthOrHeight,
            useWebWorker: true,
            fileType: opts.useWebp ? 'image/webp' : file.type,
            initialQuality: 0.85,
        })

        if (compressed.size >= file.size) return file

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

export async function compressImages(
    files: File[],
    options?: CompressOptions
): Promise<File[]> {
    return Promise.all(files.map((f) => compressImage(f, options)))
}