export class OutputService {

  /** Дефолты analytics в JSON модуля (как `DEFAULT_ANALYTICS` в `StressService`; копия, без import). */
  static _MODULE_ANALYTICS_DEFAULTS = {
    product: '-1',
    movementType: '-1',
    company: '-1',
    trCurrency: '-1',
    lt_st: '-1',
  }

  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * Справочники для блока Output: показатели (`indType=2`) и продукты.
   *
   * @returns {Promise<{ indicators: Array<{ id: *, name: * }>, products: Array<{ id: *, name: * }> }>}
   */
  async loadOutputDimLists() {
    const [indicatorsRaw, productsRaw] = await Promise.all([
      this.apiClient.getStressPoksIndicators(2),
      this.apiClient.getProductsDimElements(),
    ])

    return {
      indicators: this._normalizeDimItems(indicatorsRaw),
      products: this._normalizeDimItems(productsRaw),
    }
  }

  /**
   * Нормализация элементов dim: `{ k, n }` → `{ id, name }`.
   *
   * @param {Array} items
   * @returns {Array<{ id: *, name: * }>}
   */
  _normalizeDimItems(items) {
    if (!Array.isArray(items)) {
      return []
    }

    return items.map((item) => ({
      id: item && Object.prototype.hasOwnProperty.call(item, 'k') ? item.k : null,
      name: item && Object.prototype.hasOwnProperty.call(item, 'n') ? String(item.n) : '',
    }))
  }

  /**
   * `CheckSingleStructure` для строки Output (легаси `checkIndicator`).
   *
   * @param {Object} row
   * @param {Object|null|undefined} params
   * @returns {Promise<{ missingParams: boolean, isError?: boolean, status?: number, message?: string }>}
   */
  async checkIndicatorStructure(row, params) {
    const payload = this._buildCheckSingleStructurePayload(row, params)

    if (payload == null) {
      return { missingParams: true }
    }

    const response = await this.apiClient.checkSingleStructure(
      payload,
      this.apiClient.getUserId(),
      params.versionId,
    )

    const isError = !this.apiClient.checkModuleResponse(response)

    return {
      missingParams: false,
      isError,
      status: isError ? -1 : 0,
      message: response && response.message != null ? String(response.message) : '',
    }
  }

  /**
   * Класс ошибки строки по полю status (легаси renderOutput ~75–77).
   *
   * @param {Object} row
   * @returns {{ applyErrorClass: boolean, hasError: boolean }}
   */
  resolveRowErrorState(row) {
    if (row.status === undefined || row.status === null || row.status === '') {
      return { applyErrorClass: false, hasError: false }
    }

    const status = Number(row.status)

    if (Number.isNaN(status)) {
      return { applyErrorClass: false, hasError: false }
    }

    return { applyErrorClass: true, hasError: status !== 0 }
  }

  /**
   * Режим view/editor строки (легаси renderOutput ~61–62).
   *
   * @param {Object} row
   * @returns {{ isViewMode: boolean }}
   */
  resolveRowViewMode(row) {
    return {
      isViewMode: this._isLoadedIndicatorRow(row),
    }
  }

  /**
   * Строка из структуры (view) vs новая (editor).
   *
   * @param {Object} row
   * @returns {boolean}
   */
  _isLoadedIndicatorRow(row) {
    return row.getParamFromRequest === false
  }

  /**
   * Состояние кнопки analytics (легаси index.initBtnAnalysts ~478–510).
   *
   * @param {Object|null} analytics
   * @returns {{ tooltipText: string, fillColor: string, disabled: boolean }}
   */
  resolveAnalyticsButtonState(analytics) {
    const hasAnalytics =
      analytics != null && typeof analytics === 'object' && Object.keys(analytics).length > 0

    return {
      tooltipText: hasAnalytics ? 'Аналитики' : 'Нет аналитик',
      fillColor: hasAnalytics ? '#004c97' : '#404040',
      disabled: !hasAnalytics,
    }
  }

  /**
   * Разбор выбора показателя из Select2 (легаси initOutputIndicator select2:select ~119–127).
   *
   * @param {Object|Array} select2Data — `e.params.data`
   * @returns {{ indicatorId: *|null, indicatorName: string }|null}
   */
  parseIndicatorFromSelect2(select2Data) {
    if (select2Data == null) {
      return null
    }

    let selected = null

    if (Array.isArray(select2Data)) {
      const found = select2Data.find((el) => el.selected === true)
      if (found !== undefined) {
        selected = found.text
      }
    } else if (select2Data.text != null) {
      selected = select2Data.text
    }

    if (!selected || typeof selected !== 'string') {
      return null
    }

    const parts = selected.split('#;')
    const indicatorName = parts.length > 1 ? parts[1] : selected
    const idRaw =
      parts.length > 1 ? parts[0] : select2Data.id != null ? String(select2Data.id) : ''
    const indicatorId =
      idRaw === ''
        ? null
        : Number(idRaw).toString() === idRaw
          ? Number(idRaw)
          : idRaw

    return { indicatorId, indicatorName }
  }

  /**
   * @returns {Promise<Array>}
   */
  async parseUploadedOutputIndicators() {
    return []
  }

  /**
   * Дата → `MM.YYYY` для `CheckSingleStructure` (легаси `formatDate` в `checkIndicator`).
   *
   * @param {*} value — `YYYY-MM-DD`, `MM.YYYY`, `DD.MM.YYYY`
   * @returns {string}
   */
  _normalizeMonthForModulePayload(value) {
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

  /**
   * Нормализация analytics из структуры / попапа (дефолты модуля).
   *
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  normalizeAnalytics(analytics) {
    return this._mapAnalyticsToModule(analytics)
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  _mapAnalyticsToModule(analytics) {
    const result = { ...OutputService._MODULE_ANALYTICS_DEFAULTS }

    if (analytics == null || typeof analytics !== 'object') {
      return result
    }

    Object.keys(OutputService._MODULE_ANALYTICS_DEFAULTS).forEach((key) => {
      if (analytics[key] !== undefined && analytics[key] !== null) {
        result[key] = String(analytics[key])
      }
    })

    return result
  }

  /**
   * JSON для `CheckSingleStructure` по строке Output (легаси `index.checkIndicator`).
   *
   * @param {Object} row
   * @param {Object|null|undefined} params
   * @returns {Object|null}
   */
  _buildCheckSingleStructurePayload(row, params) {
    if (row == null || params == null) {
      return null
    }

    const versionId = params.versionId
    const iterations = params.iterations
    const simulations = params.simulations
    const indicatorId = row.indicatorId != null ? row.indicatorId : row.key

    if (
      versionId == null
      || String(versionId) === ''
      || iterations == null
      || String(iterations) === ''
      || simulations == null
      || String(simulations) === ''
    ) {
      return null
    }

    const forecastFrom = params.startDate != null ? String(params.startDate) : ''
    const forecastTo = params.endDate != null ? String(params.endDate) : ''

    return {
      prognozVersion: Number(versionId),
      indicatorId,
      forecastData: {
        dateFrom: this._normalizeMonthForModulePayload(forecastFrom),
        dateTo: this._normalizeMonthForModulePayload(forecastTo),
      },
      IterationCount: String(iterations),
      SimulationCount: String(simulations),
      analytics: this._mapAnalyticsToModule(row.analytics),
      dateFrom: this._normalizeMonthForModulePayload(forecastFrom),
      dateTo: this._normalizeMonthForModulePayload(forecastTo),
    }
  }
}
