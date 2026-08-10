export const CITY_LABEL: Record<string, string> = {
    kushchevskaya: 'Кущёвская',
    rostov: 'Ростов-на-Дону',
    krasnodar: 'Краснодар',
    kanevskay: 'Каневская',
    leningradskaya: 'Ленинградская',
    other: 'Другой',
}

export const CITY_OPTIONS = Object.entries(CITY_LABEL).map(([value, label]) => ({
    value,
    label,
}))