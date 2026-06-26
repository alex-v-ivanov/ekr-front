/**
 * Проверки фильтров / состояния списка в модалке «Анализ».
 * Без jQuery, без `StressApi` — чистые правила над данными.
 */
export class AnalysisPopUpValidator {

  /**
   * @param {Object} state
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validateFilterState(state) {
    const errors = []

    return { isValid: errors.length === 0, errors }
  }
}
