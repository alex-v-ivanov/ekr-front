/**
 * AnalysisPopUpService — данные для модалки «Анализ списка».
 *
 * Слои (п.18 §0.2): только `StressApi`; без jQuery, без DOM.
 */

/** Поля фильтров `#analysis__*` (как в легаси). */
export const ANALYSIS_FILTER_FIELD_NAMES = [
  'product',
  'movementType',
  'company',
  'trCurrency',
  'lt_st',
]

export class AnalysisPopUpService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
    /** @type {Record<string, Array<{ id: *, text: string }>>|null} */
    this._fieldOptions = null
  }

  /**
   * Справочники Dim для фильтров (легаси `initVersion` → `initSelect2Field` на `#analysis__*`).
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
   * Уникальные значения analytics по строкам блока (п.18 §4.2).
   *
   * @param {Array} indicators
   * @returns {Record<string, Set<string>>}
   */
  buildUnionAnalyticsValues(indicators) {
    /** @type {Record<string, Set<string>>} */
    const union = {}

    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      union[fieldName] = new Set()
    })

    ;(indicators || []).forEach((row) => {
      if (row.analytics == null || typeof row.analytics !== 'object') {
        return
      }

      ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
        if (row.analytics[fieldName] !== undefined && row.analytics[fieldName] !== null) {
          union[fieldName].add(String(row.analytics[fieldName]))
        }
      })
    })

    return union
  }

  /**
   * Опции фильтров: только значения из union по строкам (п.18 §4.2; не полный Dim как в легаси `initVersion`).
   *
   * @param {Record<string, Set<string>>} union
   * @returns {Record<string, Array<{ id: *, text: string }>>}
   */
  buildFilterOptionsByUnion(union) {
    /** @type {Record<string, Array<{ id: *, text: string }>>} */
    const result = {}

    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      const values = union[fieldName]
      const allOptions = this.getSelectItems(fieldName) || []

      if (!values || values.size === 0) {
        result[fieldName] = []
        return
      }

      const filtered = allOptions.filter((option) => {
        const optionId = String(option.text).split('#;')[0]
        return values.has(optionId)
      })

      values.forEach((value) => {
        const found = filtered.some(
          (option) => String(option.text).split('#;')[0] === value,
        )

        if (!found) {
          filtered.push({
            id: value,
            text: value + '#;' + value,
          })
        }
      })

      result[fieldName] = filtered
    })

    return result
  }

  /**
   * Полный справочник для фильтров `#analysis__*` (легаси `initVersion` → `initSelect2Field`).
   *
   * @returns {Record<string, Array<{ id: *, text: string }>>}
   */
  getFilterFieldOptions() {
    if (this._fieldOptions == null) {
      return {}
    }

    return this._fieldOptions
  }

  /**
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

  /**
   * DTO строк для `.SelectAnalysisBody` (п.18 §5.1; легаси `AnalysisPopUp.render`).
   *
   * @param {Array} indicators
   * @param {'Input'|'Output'} table
   * @returns {Array}
   */
  buildRenderRows(indicators, table) {
    return (indicators || []).map((row, index) => {
      return this._mapIndicatorToRenderRow(row, index, table)
    })
  }

  /**
   * @param {Object} row
   * @param {number} index
   * @param {'Input'|'Output'} table
   * @returns {Object}
   */
  _mapIndicatorToRenderRow(row, index, table) {
    const number = row.number != null ? row.number : index + 1
    const indicatorName =
      row.indicatorName != null
        ? String(row.indicatorName)
        : row.name != null
          ? String(row.name)
          : ''

    /** @type {Record<string, { value: string, label: string }>} */
    const analyticsFields = {}

    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      analyticsFields[fieldName] = this._resolveAnalyticsField(row.analytics, fieldName)
    })

    /** @type {Object} */
    const renderRow = {
      number,
      indicatorName,
      analyticsFields,
    }

    if (table === 'Input') {
      renderRow.distributionName =
        row.distributionName != null
          ? String(row.distributionName)
          : row.distributionId != null
            ? String(row.distributionId)
            : ''

      const historicalFrom = row.historicalRangeFrom ?? row.dateFrom ?? ''
      const historicalTo = row.historicalRangeTo ?? row.dateTo ?? ''
      renderRow.historicalRangeLabel = String(historicalFrom) + ' - ' + String(historicalTo)

      if (row.validDateFrom !== undefined && row.validDateTo !== undefined) {
        renderRow.acceptableRangeLabel = this._formatAcceptableRange(
          row.validDateFrom,
          row.validDateTo,
        )
        renderRow.acceptableRangeError = false
      } else {
        renderRow.acceptableRangeLabel = 'Нет данных'
        renderRow.acceptableRangeError = true
      }

      renderRow.excelState = this._resolveExcelRowState(row)
    }

    return renderRow
  }

  /**
   * @param {Object|null|undefined} analytics
   * @param {string} fieldName
   * @returns {{ value: string, label: string }}
   */
  _resolveAnalyticsField(analytics, fieldName) {
    if (analytics == null || analytics[fieldName] === undefined || analytics[fieldName] === null) {
      return { value: '', label: '' }
    }

    const value = String(analytics[fieldName])

    if (value === '-1' || value === '0') {
      return { value: '', label: '' }
    }

    return {
      value,
      label: this._resolveDimLabel(fieldName, value),
    }
  }

  /**
   * @param {string} fieldName
   * @param {string} value
   * @returns {string}
   */
  _resolveDimLabel(fieldName, value) {
    const items = this.getSelectItems(fieldName) || []
    const item = items.find((option) => String(option.text).split('#;')[0] === value)

    if (item == null) {
      return value
    }

    const parts = String(item.text).split('#;')

    return parts.length > 1 ? parts[1] : parts[0]
  }

  /**
   * @param {*} validDateFrom
   * @param {*} validDateTo
   * @returns {string}
   */
  _formatAcceptableRange(validDateFrom, validDateTo) {
    const from = this._sanitizeDateRangeText(String(validDateFrom))
    const to = this._sanitizeDateRangeText(String(validDateTo))

    return from + ' - ' + to
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  _sanitizeDateRangeText(str) {
    if (typeof str !== 'string') {
      return ''
    }

    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  }

  /**
   * @param {Object} row
   * @returns {{ rowColorClass: string|null, hideDistribution: boolean, hideHistoricalRange: boolean, showFileButtons: boolean, fileInfoTooltip: string|null }}
   */
  _resolveExcelRowState(row) {
    const guid = row.ExcelGUID
    const hasExcel = guid !== '' && guid !== undefined && guid !== null

    if (!hasExcel) {
      return {
        rowColorClass: null,
        hideDistribution: false,
        hideHistoricalRange: false,
        showFileButtons: false,
        fileInfoTooltip: null,
      }
    }

    let rowColorClass = null
    let hideDistribution = false

    if (row.ExcelType === 2) {
      rowColorClass = 'ListRow__yellow'
      hideDistribution = true
    } else if (row.ExcelType === 1) {
      rowColorClass = 'ListRow__green'
      hideDistribution = false
    }

    const name = row.ExcelName
    const fileInfoTooltip =
      name !== undefined && name !== null && String(name) !== '' ? String(name) : null

    return {
      rowColorClass,
      hideDistribution,
      hideHistoricalRange: true,
      showFileButtons: true,
      fileInfoTooltip,
    }
  }
}
