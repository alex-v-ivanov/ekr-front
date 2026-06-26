/**
 * AnalyticsPopUpService — Dim и вызовы Fore для попапа аналитик.
 *
 * Слои (п.18 §0.2): только `StressApi`; без jQuery, без DOM, без бизнес-правил UI.
 */

/** Подписи полей analytics (легаси `index.analyticsDictionary`). */
export const ANALYTICS_FIELD_LABELS = {
  product: 'Продукты',
  movementType: 'Вид движения',
  company: 'Компания',
  trCurrency: 'Валюта транзакций',
  lt_st: 'Классификация LT/ST',
}

/** Имена полей analytics в порядке легаси `getSelectItems`. */
export const ANALYTICS_FIELD_NAMES = Object.keys(ANALYTICS_FIELD_LABELS)

/** Для Output дефолт `0` вместо `-1` (легаси `fillAnalysts`). */
const OUTPUT_ZERO_VALUE_FIELDS = new Set(['product', 'movementType', 'company', 'lt_st'])

export class AnalyticsPopUpService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
    /** @type {Record<string, Array<{ id: *, text: string }>>|null} */
    this._fieldOptions = null
  }

  /**
   * Dim по показателю → объект `analytics` с дефолтами (легаси `loadingAnalysts` + `fillAnalysts`).
   *
   * @param {*} indicatorId
   * @param {'Input'|'Output'} table
   * @returns {Promise<Object>}
   */
  async loadAnalyticsDictionary(indicatorId, table) {
    if (indicatorId == null) {
      return {}
    }

    const dimItems = await this.apiClient.getAnalyticsPokazDimElements(indicatorId)

    if (!dimItems || dimItems.length === 0) {
      return {}
    }

    return this._fillAnalyticsFromDim(dimItems, table)
  }

  /**
   * Analytics строки: только поля, доступные показателю в Dim (легаси `loadingAnalysts` + `fillAnalysts`).
   * Лишние ключи из JSON структуры отбрасываются; сохранённые значения накладываются на дефолты Dim.
   *
   * @param {*} indicatorId
   * @param {'Input'|'Output'} table
   * @param {Object|null|undefined} [savedAnalytics]
   * @returns {Promise<Object|null>}
   */
  async resolveRowAnalytics(indicatorId, table, savedAnalytics) {
    if (indicatorId == null || String(indicatorId) === '') {
      return null
    }

    const dictionary = await this.loadAnalyticsDictionary(indicatorId, table)
    const keys = Object.keys(dictionary)

    if (keys.length === 0) {
      return null
    }

    if (savedAnalytics == null || typeof savedAnalytics !== 'object') {
      return { ...dictionary }
    }

    const result = { ...dictionary }

    Object.keys(savedAnalytics).forEach((key) => {
      if (result[key] !== undefined && savedAnalytics[key] != null) {
        result[key] = String(savedAnalytics[key])
      }
    })

    return result
  }

  /**
   * Загрузить справочники опций для полей формы (легаси `initVersion` в stress-ui + `getSelectItems`).
   *
   * @returns {Promise<Record<string, Array<{ id: *, text: string }>>>}
   */
  async loadFieldOptions() {
    const [
      productRaw,
      movementTypeRaw,
      companyRaw,
      trCurrencyRaw,
      ltStRaw,
    ] = await Promise.all([
      this.apiClient.getProductsDimElements(),
      this.apiClient.getMovementTypeDimElements(),
      this.apiClient.getCompaniesDimElements(),
      this.apiClient.getTransactionCurrencyDimElements(),
      this.apiClient.getLtStDimElements(),
    ])

    this._fieldOptions = {
      product: this._mapDimToSelect2(productRaw),
      movementType: this._mapDimToSelect2(movementTypeRaw),
      company: this._mapDimToSelect2(companyRaw),
      trCurrency: this._mapDimToSelect2(trCurrencyRaw),
      lt_st: this._mapDimToSelect2(ltStRaw),
    }

    return this._fieldOptions
  }

  /**
   * Опции Select2 для поля формы (легаси `AnalyticsPopUp.getSelectItems`).
   * Перед вызовом — `loadFieldOptions`.
   *
   * @param {string} fieldName
   * @returns {Array<{ id: *, text: string }>|null}
   */
  getSelectItems(fieldName) {
    if (this._fieldOptions == null) {
      return null
    }

    return this._fieldOptions[fieldName] != null ? this._fieldOptions[fieldName] : null
  }

  /**
   * Подпись поля в форме (легаси `analyticsDictionary` / `getField`).
   *
   * @param {string} fieldName
   * @returns {string}
   */
  getFieldLabel(fieldName) {
    return ANALYTICS_FIELD_LABELS[fieldName] != null
      ? ANALYTICS_FIELD_LABELS[fieldName]
      : fieldName
  }

  /**
   * @param {Array<{ n: string }>} dimItems
   * @param {'Input'|'Output'} table
   * @returns {Object}
   */
  _fillAnalyticsFromDim(dimItems, table) {
    const analytics = {}

    dimItems.forEach((item) => {
      const propName = Object.keys(ANALYTICS_FIELD_LABELS).find(
        (key) => ANALYTICS_FIELD_LABELS[key] === item.n,
      )

      if (propName === undefined) {
        return
      }

      let value = '-1'

      if (table === 'Output' && OUTPUT_ZERO_VALUE_FIELDS.has(propName)) {
        value = '0'
      }

      analytics[propName] = value
    })

    return analytics
  }

  /**
   * BI `{ k, n }` → `{ id, text: "k#;n" }` для Select2 (легаси ProductsEls и др.).
   *
   * @param {Array<{ k: *, n: * }>|null|undefined} items
   * @returns {Array<{ id: *, text: string }>}
   */
  _mapDimToSelect2(items) {
    if (!items || items.length === 0) {
      return []
    }

    return items.map((item) => ({
      id: item.k,
      text: String(item.k) + '#;' + (item.n != null ? String(item.n) : ''),
    }))
  }
}
