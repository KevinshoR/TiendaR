/** Formatea un número como pesos colombianos: 38500 -> "$38.500" */
export const COP = (v) => `$${Number(v).toLocaleString('es-CO')}`
