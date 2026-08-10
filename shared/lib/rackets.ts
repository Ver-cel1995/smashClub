export const STRING_OPTIONS = [
    { value: 'BG65', label: 'Yonex BG65' },
    { value: 'BG65Ti', label: 'Yonex BG65 Ti' },
    { value: 'BG66U', label: 'Yonex BG66 Ultimax' },
    { value: 'BG80', label: 'Yonex BG80' },
    { value: 'BG80P', label: 'Yonex BG80 Power' },
    { value: 'NBG95', label: 'Yonex Nanogy 95' },
    { value: 'AB', label: 'Yonex Aerobite' },
    { value: 'ABB', label: 'Yonex Aerobite Boost' },
    { value: 'EBG68P', label: 'Yonex Exbolt 68 Power' },
    { value: 'other', label: 'Другая' },
] as const

/** Популярные натяжения в кг */
export const TENSION_OPTIONS = [
    { value: '9', label: '9 кг' },
    { value: '9.5', label: '9.5 кг' },
    { value: '10', label: '10 кг' },
    { value: '10.5', label: '10.5 кг' },
    { value: '11', label: '11 кг' },
    { value: '11.5', label: '11.5 кг' },
    { value: '12', label: '12 кг' },
    { value: '12.5', label: '12.5 кг' },
    { value: '13', label: '13 кг' },
    { value: 'other', label: 'Другое' },
] as const

export type StringOption = typeof STRING_OPTIONS[number]['value']
export type TensionOption = typeof TENSION_OPTIONS[number]['value']