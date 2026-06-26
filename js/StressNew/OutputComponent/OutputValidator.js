/**
 * Локальная валидация блока Output (без API и DOM). Правила и тексты — в этом классе (п.15).
 *
 * @typedef {Object} KeyedValidationResult
 * @property {boolean} isValid — `true`, если в `errors` нет ключей.
 * @property {Record<string, string>} errors — ключ: номер строки (`"2"`) или имя поля; значение — текст ошибки.
 *
 * @typedef {Object} CanAddRowResult
 * @property {boolean} ok
 * @property {string} [message] — текст для `OutputController.setMessages` при `ok === false`.
 */
export class OutputValidator {

  /** Легаси `StressValidationMessages.FILL_REQUIRED_FIELDS` (`addNewOutput` ~24–33). */
  static FILL_REQUIRED_FIELDS = 'Заполните обязательные поля!'

  /** Легаси `StressValidationMessages.COULD_NOT_DETERMINE_REQUIRED_FIELDS` (`checkIndicator` ~665). */
  static COULD_NOT_DETERMINE_REQUIRED_FIELDS = 'Не удалось определить обязательные поля'

  /** Легаси `StressValidationMessages.OUTPUT_INDICATORS_NOT_FILLED` (`getStressParams` ~95–100, только run). */
  static OUTPUT_INDICATORS_NOT_FILLED = 'Не заполнены Output-показатели'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_OUTPUT_INDICATOR` (`stress-output-rows` ~173). */
  static CONFIRM_DELETE_OUTPUT_INDICATOR = 'Вы уверены, что хотите удалить показатель ?'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_ALL_OUTPUT` (`stress-ui.js` ~396). */
  static CONFIRM_DELETE_ALL_OUTPUT = 'Вы уверены, что хотите удалить все Output показатели?'

  /** Легаси `StressValidationMessages.SELECT_INDICATOR` (analytics по строке, п.18 §2.2). */
  static SELECT_INDICATOR = 'Выберите показатель'

  /** @returns {string} */
  getRemoveRowConfirmMessage() {
    return OutputValidator.CONFIRM_DELETE_OUTPUT_INDICATOR
  }

  /** @returns {string} */
  getClearAllIndicatorsConfirmMessage() {
    return OutputValidator.CONFIRM_DELETE_ALL_OUTPUT
  }

  /**
   * Guard открытия analytics по строке (п.18 §2.2).
   *
   * @param {Object|null|undefined} row
   * @returns {CanAddRowResult}
   */
  canOpenAnalytics(row) {
    const indicatorId = row && (row.indicatorId != null ? row.indicatorId : row.key)

    if (indicatorId == null || String(indicatorId) === '') {
      return { ok: false, message: OutputValidator.SELECT_INDICATOR }
    }

    return { ok: true }
  }

  /**
   * Guard кнопки «+» (добавить строку output): нужны params из блока Params.
   *
   * @param {Object|null|undefined} params
   * @returns {CanAddRowResult}
   */
  canAddRow(params) {
    if (!params) {
      return { ok: false, message: OutputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: OutputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.iterations == null || String(params.iterations) === '') {
      return { ok: false, message: OutputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.simulations == null || String(params.simulations) === '') {
      return { ok: false, message: OutputValidator.FILL_REQUIRED_FIELDS }
    }

    return { ok: true }
  }

  /**
   * @param {Array<Object>} rows — `OutputController.indicators`.
   * @param {Object|null|undefined} params — срез params из координатора.
   * @param {{ mode?: 'runTest'|'save' }} [options] — режим сценария (п.15 §3.2: пустой Output только при `runTest`).
   * @returns {KeyedValidationResult}
   */
  validate(rows, params, options) {
    const errors = {}

    if (options?.mode === 'runTest' && (!rows || rows.length === 0)) {
      errors.output = OutputValidator.OUTPUT_INDICATORS_NOT_FILLED
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }
}
