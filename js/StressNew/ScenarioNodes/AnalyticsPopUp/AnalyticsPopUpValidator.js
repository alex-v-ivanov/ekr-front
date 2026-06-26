/**
 * Локальные проверки формы аналитик перед save в строку.
 * Без jQuery, без `StressApi` — чистые правила над данными формы.
 */
export class AnalyticsPopUpValidator {

  /**
   * @param {Object} state
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validateFormState(state) {
    const errors = []

    if (state == null || state.analytics == null || typeof state.analytics !== 'object') {
      errors.push('Нет данных формы аналитик')
    } else if (state.rowNumber == null || Number.isNaN(Number(state.rowNumber))) {
      errors.push('Не указана строка показателя')
    }

    return { isValid: errors.length === 0, errors }
  }
}
