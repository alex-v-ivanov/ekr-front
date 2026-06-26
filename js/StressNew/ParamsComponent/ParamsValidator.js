/**
 * Локальная валидация блока Params (без API и DOM). Правила и тексты — в этом классе (п.15).
 *
 * @typedef {Object} ParamsValidationSnapshot
 * @property {boolean} hasPeriodFrom — выбрана дата «от» в AirDatepicker.
 * @property {boolean} hasPeriodTo — выбрана дата «до» в AirDatepicker.
 * @property {string|number|Array|null|undefined} versionSelect2Val — `select2('val')` комбо версии (как легасi).
 * @property {Array} versionSelect2Data — `select2('data')` комбо версии.
 * @property {Array} iterationsSelect2Data — `select2('data')` итераций.
 * @property {Array} simulationsSelect2Data — `select2('data')` симуляций.
 *
 * @typedef {Object} ParamsValidationResult
 * @property {boolean} isValid — `true`, если `errors` пуст.
 * @property {string[]} errors — тексты для зоны params (`StressScenarioResult._pushParamsErrors`).
 */

export class ParamsValidator {

  /** Легасi `StressValidationMessages.PERIOD_VERSION_REQUIRED` (getStressParams ~69–84). */
  static PERIOD_VERSION_REQUIRED = 'Ошибка: Заполните поле "Период версии прогноза"'

  /** Легасi `StressValidationMessages.PROGNOSIS_VERSION_REQUIRED` (getStressParams ~115). */
  static PROGNOSIS_VERSION_REQUIRED = 'Ошибка: Заполните поле "Версия прогноза"'

  /** Легасi `StressValidationMessages.COULD_NOT_DETERMINE_PROGNOSIS_VERSION` (getStressParams ~254–256). */
  static COULD_NOT_DETERMINE_PROGNOSIS_VERSION = 'Не удалось определить прогноз версии'

  /** Легасi `StressValidationMessages.ITERATION_COUNT_REQUIRED` (getStressParams ~121–127). */
  static ITERATION_COUNT_REQUIRED = 'Ошибка: Заполните поле "Количество итераций расчета"'

  /** Легасi `StressValidationMessages.SIMULATION_COUNT_REQUIRED` (getStressParams ~130–136). */
  static SIMULATION_COUNT_REQUIRED = 'Ошибка: Заполните поле "Количество симуляций"'

  /**
   * @param {Object|null|undefined} params — состояние из `ParamsController.params`.
   * @param {ParamsValidationSnapshot|null|undefined} [snapshot] — срез виджетов, как легасi `getStressParams`.
   * @returns {ParamsValidationResult}
   */
  validate(params, snapshot) {
    if (snapshot) {
      return this._validateFromSnapshot(snapshot)
    }

    return this._validateFromParams(params)
  }

  /**
   * Паритет легасi `getStressParams`: читаем AirDatepicker и Select2, не только `params`.
   *
   * @param {ParamsValidationSnapshot} snapshot
   * @returns {ParamsValidationResult}
   */
  _validateFromSnapshot(snapshot) {
    const errors = []

    if (!snapshot.hasPeriodFrom || !snapshot.hasPeriodTo) {
      errors.push(ParamsValidator.PERIOD_VERSION_REQUIRED)
      return { isValid: false, errors }
    }

    const selectedIds = snapshot.versionSelect2Val
    const selectedId = selectedIds
      ? (Array.isArray(selectedIds) ? selectedIds[0] : selectedIds)
      : null

    if (selectedId !== null) {
      const versionData = Array.isArray(snapshot.versionSelect2Data)
        ? snapshot.versionSelect2Data
        : []

      if (versionData.length === 0) {
        errors.push(ParamsValidator.PROGNOSIS_VERSION_REQUIRED)
        return { isValid: false, errors }
      }

      const iterationsData = Array.isArray(snapshot.iterationsSelect2Data)
        ? snapshot.iterationsSelect2Data
        : []

      if (iterationsData.length === 0) {
        errors.push(ParamsValidator.ITERATION_COUNT_REQUIRED)
        return { isValid: false, errors }
      }

      const simulationsData = Array.isArray(snapshot.simulationsSelect2Data)
        ? snapshot.simulationsSelect2Data
        : []

      if (simulationsData.length === 0) {
        errors.push(ParamsValidator.SIMULATION_COUNT_REQUIRED)
        return { isValid: false, errors }
      }
    } else {
      errors.push(ParamsValidator.COULD_NOT_DETERMINE_PROGNOSIS_VERSION)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * @param {Object|null|undefined} params
   * @returns {ParamsValidationResult}
   */
  _validateFromParams(params) {
    const errors = []

    if (!params || !params.startDate || !params.endDate) {
      errors.push(ParamsValidator.PERIOD_VERSION_REQUIRED)
    }

    if (!params || params.versionId == null || String(params.versionId) === '') {
      errors.push(ParamsValidator.COULD_NOT_DETERMINE_PROGNOSIS_VERSION)
    }

    if (!params || params.iterations == null || String(params.iterations) === '') {
      errors.push(ParamsValidator.ITERATION_COUNT_REQUIRED)
    }

    if (!params || params.simulations == null || String(params.simulations) === '') {
      errors.push(ParamsValidator.SIMULATION_COUNT_REQUIRED)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
