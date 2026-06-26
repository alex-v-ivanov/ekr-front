import { StressScenarioResult } from './StressScenarioResult.js'

/** Дефолты analytics в payload модуля (легаси `getStressParams`). */
export const DEFAULT_ANALYTICS = {
  product: '-1',
  movementType: '-1',
  company: '-1',
  trCurrency: '-1',
  lt_st: '-1',
}

/** Ключи объекта `analytics` в строке Input/Output и в JSON модуля. */
export const ANALYTICS_FIELD_NAMES = Object.keys(DEFAULT_ANALYTICS)

/**
 * Слияние `row.analytics` с дефолтами для save/run (п.18 §6.3).
 *
 * @param {Object|null|undefined} analytics
 * @returns {Object}
 */
export function mapAnalyticsToModule(analytics) {
  const result = { ...DEFAULT_ANALYTICS }

  if (analytics == null || typeof analytics !== 'object') {
    return result
  }

  ANALYTICS_FIELD_NAMES.forEach((key) => {
    if (analytics[key] !== undefined && analytics[key] !== null) {
      result[key] = String(analytics[key])
    }
  })

  return result
}

/**
 * Analytics строки Input для save/run — как в легаси `getStressParams` (~160–176):
 * дефолты `-1`, затем merge полей `row.analytics` без приведения типов.
 *
 * @param {Object|null|undefined} analytics
 * @returns {Object}
 */
export function mergeInputRowAnalyticsForModule(analytics) {
  const result = { ...DEFAULT_ANALYTICS }

  if (analytics == null || typeof analytics !== 'object') {
    return result
  }

  Object.keys(analytics).forEach((key) => {
    result[key] = analytics[key]
  })

  return result
}

/**
 * Параметры распределения в payload save/run (легасi `getStressParams` — `{ name, value }`).
 *
 * @param {Array|null|undefined} params
 * @returns {Array<{ name: string, value: string }>}
 */
export function mapDistributionParamsForModule(params) {
  if (!params || !Array.isArray(params)) {
    return []
  }

  return params.map((el) => {
    const name =
      el.name != null
        ? el.name
        : el.paramName != null
          ? el.paramName
          : el.n != null
            ? el.n
            : ''
    const val =
      el.value != null
        ? el.value
        : el.paramValue != null
          ? el.paramValue
          : el.v != null
            ? el.v
            : el['@v'] != null
              ? el['@v']
              : '0'

    return {
      name: String(name),
      value: String(val),
    }
  })
}

/**
 * Id распределения в payload модуля — всегда number (легасi `getStressParams` → `distribution`).
 * Строковые id из Select2 / структуры приводятся через `Number()`; иначе `-1`.
 *
 * @param {*} distributionId — `distributionId` в модели строки Input
 * @returns {number}
 */
export function coerceInputDistributionForModule(distributionId) {
  if (distributionId == null || distributionId === '') {
    return -1
  }

  if (typeof distributionId === 'number') {
    return Number.isNaN(distributionId) ? -1 : distributionId
  }

  const trimmed = String(distributionId).trim()

  if (trimmed === '') {
    return -1
  }

  const num = Number(trimmed)

  return Number.isNaN(num) ? -1 : num
}

/**
 * Дата params/строки → `MM.YYYY` для save/run payload (легасi `formatDate` / `getStressParams`).
 *
 * @param {*} value — `YYYY-MM-DD`, `MM.YYYY`, `DD.MM.YYYY`
 * @returns {string}
 */
export function normalizeMonthForStressModulePayload(value) {
  if (value == null || value === '') {
    return ''
  }

  const s = String(value).trim()
  const isoMatch = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(s)

  if (isoMatch) {
    return `${isoMatch[2]}.${isoMatch[1]}`
  }

  const dotParts = s.split('.')

  if (dotParts.length === 3) {
    const month = dotParts[1]
    const year = dotParts[2]

    if (month && year) {
      return `${month}.${year}`
    }
  }

  if (dotParts.length === 2) {
    return s
  }

  return s
}

export class StressService {

  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * @param {Object} aggregate
   * @param {'runTest'|'save'} mode
   * @returns {Object}
   */
  buildStressModulePayload(aggregate, mode) {
    const p = aggregate && aggregate.params ? aggregate.params : {}
    const inputRows = aggregate && Array.isArray(aggregate.input) ? aggregate.input : []
    const outputRows = aggregate && Array.isArray(aggregate.output) ? aggregate.output : []

    const rez = {
      dateFrom: normalizeMonthForStressModulePayload(p.startDate),
      dateTo: normalizeMonthForStressModulePayload(p.endDate),
      prognozVersion: p.versionId != null && p.versionId !== '' ? Number(p.versionId) : null,
      IterationCount: p.iterations != null ? String(p.iterations) : '',
      SimulationCount: p.simulations != null ? String(p.simulations) : '',
      Input: inputRows.map((el) => this._mapInputRowToModule(el, mode)),
      Output: outputRows.map((el) => this._mapOutputRowToModule(el)),
    }

    if (p.stressTestName) {
      rez.Name = p.stressTestName
    }

    return rez
  }

  /**
   * @param {Object} el — строка Input из `InputController`
   * @param {'runTest'|'save'} mode
   * @returns {Object}
   */
  _mapInputRowToModule(el, mode) {
    const option = {
      number: el.number,
      key:
        el.indicatorId != null && el.indicatorId !== '' && !Number.isNaN(el.indicatorId)
          ? el.indicatorId
          : null,
      name: el.indicatorName !== null ? el.indicatorName : '',
      distribution: coerceInputDistributionForModule(el.distributionId),
      distributionId: el.distributionName !== null ? el.distributionName : '',
      distributionParams: mapDistributionParamsForModule(el.distributionParams),
      dateFrom: el.historicalRangeFrom,
      dateTo: el.historicalRangeTo,
      indicatorType: el.indicatorType,
      analytics: mergeInputRowAnalyticsForModule(el.analytics),
      status: el.status,
    }

    this._appendExcelFieldsIfPresent(option, el)

    if (mode === 'save') {
      option.validDateFrom = el.validDateFrom
      option.validDateTo = el.validDateTo
    }

    return option
  }

  /**
   * Excel-поля строки Input в payload save/run (п.19 §7.4; легасi `getStressParams` ~178–182).
   * Включаются только при непустом `ExcelGUID` — как после `applyExcelToRow` / загрузки структуры.
   *
   * @param {Object} option — объект строки для `rez.Input`
   * @param {Object} el — строка из `InputController.getData()`
   */
  _appendExcelFieldsIfPresent(option, el) {
    if (el.ExcelGUID === undefined || el.ExcelGUID === '') {
      return
    }

    option.ExcelGUID = el.ExcelGUID !== undefined ? el.ExcelGUID : ''
    option.ExcelType = el.ExcelType !== undefined ? el.ExcelType : ''
    option.ExcelName = el.ExcelName !== undefined ? el.ExcelName : ''
  }

  /**
   * @param {Object} el — строка Output из `OutputController`
   * @returns {Object}
   */
  _mapOutputRowToModule(el) {
    const key = el.indicatorId != null ? el.indicatorId : el.key
    const name = el.indicatorName != null ? el.indicatorName : el.name

    return {
      number: el.number != null ? el.number : el.id,
      key,
      name,
      analytics: mapAnalyticsToModule(el.analytics),
      status: el.status,
    }
  }

  /**
   * @param {Object} jsonObject
   * @param {string|number} prognozVersionId
   * @param {string} userId
   * @returns {Promise<*>}
   */
  checkFullStructure(jsonObject, prognozVersionId, userId) {
    return this.apiClient.checkFullStructure(jsonObject, prognozVersionId, userId)
  }

  /**
   * @param {Object} jsonObject
   * @param {string|number} prognozVersionId
   * @param {string} userId
   * @returns {Promise<*>}
   */
  getValidData(jsonObject, prognozVersionId, userId) {
    return this.checkFullStructure(jsonObject, prognozVersionId, userId)
  }

  /**
   * @param {Object} aggregate
   * @returns {Promise<{ ok: boolean, messages: Object, checkResponse: *, payload: Object, invalidRows?: { input: number[], output: number[] } }>}
   */
  async checkFullStructureForRun(aggregate) {
    const payload = this.buildStressModulePayload(aggregate, 'runTest')
    const pv = payload.prognozVersion
    const userId = this.apiClient.getUserId()

    const checkResponse = await this.checkFullStructure(payload, pv, userId)
    const rowsSource = this._resolveCheckFullStructureRows(checkResponse, payload)
    const invalidRows = this._findInvalidStructureCheckRows(rowsSource)

    if (invalidRows.input.length > 0 || invalidRows.output.length > 0) {
      return {
        ok: false,
        messages: StressScenarioResult.messagesFromStructureRowCheckFailure(),
        checkResponse,
        payload,
        invalidRows,
      }
    }

    return {
      ok: true,
      messages: StressScenarioResult.emptyMessages(),
      checkResponse,
      payload,
    }
  }

  /**
   * Источник строк для post-check (легасi `sendTest` → `getValidData`: при ERROR — исходный `objJson`, иначе `JSON.parse(message)`).
   *
   * @param {*} checkResponse
   * @param {Object} payload
   * @returns {{ Input?: Array<Object>, Output?: Array<Object> }}
   */
  _resolveCheckFullStructureRows(checkResponse, payload) {
    if (this.apiClient.isModuleResponseFailed(checkResponse)) {
      return payload
    }

    if (checkResponse.message != null && String(checkResponse.message).length > 0) {
      try {
        return JSON.parse(checkResponse.message)
      } catch {
        return payload
      }
    }

    return payload
  }

  /**
   * @param {{ Input?: Array<Object>, Output?: Array<Object> }} source
   * @returns {{ input: number[], output: number[] }}
   */
  _findInvalidStructureCheckRows(source) {
    const invalidInput = []
    const invalidOutput = []

    ;(source?.Input || []).forEach((item) => {
      if (item == null) {
        return
      }

      if (item.status === undefined || item.status === -1) {
        invalidInput.push(Number(item.number))
      }
    })

    ;(source?.Output || []).forEach((item) => {
      if (item == null) {
        return
      }

      if (item.status === undefined || item.status === -1) {
        invalidOutput.push(Number(item.number))
      }
    })

    return { input: invalidInput, output: invalidOutput }
  }

  /**
   * @param {*} res — ответ модуля
   * @returns {boolean}
   */
  _isStressModuleResponseOk(res) {
    return !this.apiClient.isModuleResponseFailed(res)
  }

  /**
   * @param {*} res — ответ модуля
   * @returns {boolean}
   */
  _isCheckFullStructureOk(res) {
    return this._isStressModuleResponseOk(res)
  }

  /**
   * @param {Object} aggregate
   * @param {{ payload?: Object, json?: string }} [options] — тот же JSON, что CheckFullStructure (легасi `sendTest`)
   * @returns {Promise<{ ok: boolean, messages: Object, raw: * }>}
   */
  async startModelRisk(aggregate, options) {
    const payload =
      options && options.payload != null
        ? options.payload
        : this.buildStressModulePayload(aggregate, 'runTest')
    const json =
      options && options.json != null && String(options.json).length > 0
        ? String(options.json)
        : JSON.stringify(payload)
    const userName = this.apiClient.userName || ''
    const version = payload.prognozVersion != null ? String(payload.prognozVersion) : ''

    const raw = await this.apiClient.startModelRisk(json, userName, version)
    const ok = this._isStressModuleResponseOk(raw)
    const messages = StressScenarioResult.messagesFromModuleCall(
      raw,
      ok,
      'startModelRisk',
      'Проверка прошла успешно. Стресс-тестирование запущено.',
      'Ошибка запуска стресс-теста'
    )

    return { ok, messages, raw }
  }

  /**
   * @param {Object} aggregate
   * @returns {Promise<{ ok: boolean, messages: Object, raw: * }>}
   */
  async saveUserStructure(aggregate) {
    const payload = this.buildStressModulePayload(aggregate, 'save')
    const json = JSON.stringify(payload)
    const versionId = payload.prognozVersion != null ? String(payload.prognozVersion) : ''
    const userId = this.apiClient.getUserId()

    const raw = await this.apiClient.saveUserStructure(json, userId, versionId)
    const ok = this._isStressModuleResponseOk(raw)
    const messages = StressScenarioResult.messagesFromModuleCall(
      raw,
      ok,
      'saveUserStructure',
      'Конфигурация сохранена',
      'Ошибка сохранения конфигурации'
    )

    return { ok, messages, raw }
  }

  /**
   * @param {Object} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  checkSingleStructure(json, userId, versionId) {
    return this.apiClient.checkSingleStructure(json, userId, versionId)
  }
}
