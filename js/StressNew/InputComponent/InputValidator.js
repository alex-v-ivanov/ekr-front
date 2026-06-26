/**
 * Локальная валидация блока Input (без API и DOM). Правила и тексты — в этом классе (п.15).
 *
 * @typedef {Object} KeyedValidationResult
 * @property {boolean} isValid — `true`, если в `errors` нет ключей.
 * @property {Record<string, string>} errors — ключ: номер строки (`"3"`) или имя поля (`"params"`); значение — текст ошибки.
 *
 * @typedef {Object} CanAddRowResult
 * @property {boolean} ok
 * @property {string} [message] — текст диалога / `setMessages` при `ok === false`.
 * @property {boolean} [silent] — не показывать сообщение (легаси ExcelType=2 с файлом).
 *
 */
export class InputValidator {

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_INDICATOR` (`stress-input-rows` ~232). */
  static CONFIRM_DELETE_INDICATOR = 'Вы уверены, что хотите удалить показатель ?'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_FILE` (`stress-input-rows` ~357). */
  static CONFIRM_DELETE_FILE = 'Вы уверены, что хотите удалить файл ?'

  /** Легаси `StressValidationMessages.CONFIRM_DELETE_ALL_INPUT` (`stress-ui.js` ~388). */
  static CONFIRM_DELETE_ALL_INPUT = 'Вы уверены, что хотите удалить все Input показатели?'

  /** Легаси `StressValidationMessages.FILL_REQUIRED_FIELDS` (`addNewInput` ~43–52). */
  static FILL_REQUIRED_FIELDS = 'Заполните обязательные поля!'

  /** Легаси `StressValidationMessages.COULD_NOT_DETERMINE_REQUIRED_FIELDS` (`checkIndicator` ~665). */
  static COULD_NOT_DETERMINE_REQUIRED_FIELDS = 'Не удалось определить обязательные поля'

  /** Легаси `StressValidationMessages.COULD_NOT_GET_DELETE_EXCEL_DATA` (`constants.js`, п.19 §8.3). */
  static COULD_NOT_GET_DELETE_EXCEL_DATA = 'Не удалось получить данные с метода DeleteExcelDataSet'

  /** Легаси `StressValidationMessages.COULD_NOT_DELETE_FILE` (`constants.js`, п.19 §8.3). */
  static COULD_NOT_DELETE_FILE = 'Не удалось удалить файл'

  /** Легаси `StressValidationMessages.VALUES_PROBABILITIES_MISMATCH` (save строки ~255). */
  static VALUES_PROBABILITIES_MISMATCH = 'Значения values и probabilities не равны !'

  /** Легаси `StressValidationMessages.SELECT_INDICATOR` (analytics по строке, п.18 §2.2). */
  static SELECT_INDICATOR = 'Выберите показатель'

  /** Легаси `StressValidationMessages.NO_HISTORICAL_RANGE` (`stress-input-rows` selection ~317). */
  static NO_HISTORICAL_RANGE = 'Не задан исторический диапазон для INPUT-показателя: '

  /** Легаси `StressValidationMessages.NO_VALID_RANGE` (`stress-input-rows` selection ~319). */
  static NO_VALID_RANGE = 'Не задан допустимый диапазон для INPUT-показателя: '

  /** Легаси `StressValidationMessages.NO_DATA_FOR_FIT` (`stress-input-rows` selection ~323). */
  static NO_DATA_FOR_FIT = 'Нет данных для подбора'

  /** @returns {string} */
  getRemoveRowConfirmMessage() {
    return InputValidator.CONFIRM_DELETE_INDICATOR
  }

  /** @returns {string} */
  getFileRemoveConfirmMessage() {
    return InputValidator.CONFIRM_DELETE_FILE
  }

  /** @returns {string} */
  getClearAllIndicatorsConfirmMessage() {
    return InputValidator.CONFIRM_DELETE_ALL_INPUT
  }

  /** @returns {string} */
  getValuesProbabilitiesMismatchMessage() {
    return InputValidator.VALUES_PROBABILITIES_MISMATCH
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
      return { ok: false, message: InputValidator.SELECT_INDICATOR }
    }

    return { ok: true }
  }

  /**
   * Guard открытия модалки загрузки Excel (п.19 §3.3; `buildExcelRequestPayload` требует `indicatorId`).
   *
   * @param {Object|null|undefined} row
   * @returns {CanAddRowResult}
   */
  canOpenUploadFile(row) {
    if (!row) {
      return { ok: false, silent: true }
    }

    const indicatorId = row.indicatorId != null ? row.indicatorId : row.key

    if (indicatorId == null || String(indicatorId) === '') {
      return { ok: false, message: InputValidator.SELECT_INDICATOR }
    }

    return { ok: true }
  }

  /**
   * Guard открытия модалки подбора распределения (п.16 §3.2; легаси `checkValidDataFromSelection` + диалоги в click `selection`).
   *
   * @param {Object|null|undefined} row
   * @param {{ historicalErrorMessages?: string[] }} [rangeValidation] — `InputService.resolveRangeDateValidation(row)`
   * @returns {CanAddRowResult}
   */
  canOpenSelectDistribution(row, rangeValidation) {
    if (!row) {
      return { ok: false, message: InputValidator.SELECT_INDICATOR }
    }

    const indicatorId = row.indicatorId != null ? row.indicatorId : row.key
    const hasExcelFile = this._rowHasExcelFile(row)
    const historicalErrors = rangeValidation?.historicalErrorMessages || []
    const excelType = row.ExcelType

    const approve =
      indicatorId != null
      && String(indicatorId) !== ''
      && !(historicalErrors.length > 0 && !hasExcelFile)
      && !(excelType === 2 && hasExcelFile)

    if (approve) {
      return { ok: true }
    }

    if (excelType === 2) {
      return { ok: false, silent: true }
    }

    if (indicatorId == null || String(indicatorId) === '') {
      return { ok: false, message: InputValidator.SELECT_INDICATOR }
    }

    if (row.historicalRangeFrom === undefined && row.historicalRangeTo === undefined) {
      return {
        ok: false,
        message: InputValidator.NO_HISTORICAL_RANGE + this._formatSelectDistributionRowSuffix(row),
      }
    }

    if (row.validDateFrom === undefined) {
      return {
        ok: false,
        message: InputValidator.NO_VALID_RANGE + this._formatSelectDistributionRowSuffix(row),
      }
    }

    if (
      historicalErrors.length > 0
      && (excelType === 1 || excelType === undefined)
      && !hasExcelFile
    ) {
      return { ok: false, message: InputValidator.NO_DATA_FOR_FIT }
    }

    return { ok: false, silent: true }
  }

  /**
   * @param {Object} row
   * @returns {boolean}
   */
  _rowHasExcelFile(row) {
    const guid = row.ExcelGUID

    return guid !== '' && guid !== undefined && guid !== null
  }

  /**
   * Суффикс `(№ N) имя` в диалогах подбора (легаси `indicatorData.number` / `indicatorName`).
   *
   * @param {Object} row
   * @returns {string}
   */
  _formatSelectDistributionRowSuffix(row) {
    const number = row.number != null ? row.number : ''
    const name =
      row.indicatorName != null
        ? String(row.indicatorName)
        : row.name != null
          ? String(row.name)
          : ''

    return `(№ ${number}) ${name}`
  }

  /**
   * Guard кнопки «+» (добавить строку input): нужны params из блока Params.
   *
   * @param {Object|null|undefined} params
   * @returns {CanAddRowResult}
   */
  canAddRow(params) {
    if (!params) {
      return { ok: false, message: InputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: InputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.iterations == null || String(params.iterations) === '') {
      return { ok: false, message: InputValidator.FILL_REQUIRED_FIELDS }
    }

    if (params.simulations == null || String(params.simulations) === '') {
      return { ok: false, message: InputValidator.FILL_REQUIRED_FIELDS }
    }

    return { ok: true }
  }

  /**
   * Проверка options распределения при save строки (легаси `chackValidInputOptions` ~383–404).
   *
   * @param {Object} row — строка из `InputController.indicators`.
   * @returns {boolean} — `true`, если можно перейти в view.
   */
  validateRowOptions(row) {
    const distributionParams = row && row.distributionParams

    if (!distributionParams || distributionParams.length === 0) {
      return true
    }

    const checkOptions = distributionParams.filter((item) => item.isCheckValidValue === true)

    if (checkOptions.length === 0) {
      return true
    }

    const firstLength = checkOptions[0].value.split(';').length

    for (const obj of checkOptions) {
      if (typeof obj.value !== 'string') {
        return false
      }

      const parts = obj.value.split(';')

      if (parts.length !== firstLength) {
        return false
      }

      if (parts.length === 1 && obj.value.includes(';')) {
        return false
      }
    }

    return true
  }

  /**
   * @param {Array<Object>} indicators — `InputController.indicators`.
   * @param {Object|null|undefined} params — срез params из координатора.
   * @returns {KeyedValidationResult}
   */
  validate(indicators, params) {
    return {
      isValid: true,
      errors: {},
    }
  }
}
