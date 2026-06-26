/**
 * API подбора распределения (GetDistributionData, ChoiceDistribution, DeleteDistribution).
 * Legacy: `InputSelectDistribution.request` в `stress-input-select-distribution.js`.
 */
export class SelectDistributionService {

  /** @type {Object} */
  static ANALYTICS_DEFAULTS = {
    product: '-1',
    movementType: '-1',
    company: '-1',
    trCurrency: '-1',
    lt_st: '-1',
  }

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * JSON для GetDistributionData / ChoiceDistribution (легаси `loadingData` → `prop`).
   *
   * @param {Object} sessionContext
   * @param {Object|null|undefined} params — блок Params (`versionId`, `startDate`, `endDate`)
   * @param {{ indicatorType?: 1|2, dist_type?: Array<string> }} [extras]
   * @returns {Object|null}
   */
  buildRequestPayload(sessionContext, params, extras) {
    if (!sessionContext || !params || params.versionId == null || String(params.versionId) === '') {
      return null
    }

    const indicatorType =
      extras && extras.indicatorType != null
        ? extras.indicatorType
        : sessionContext.indicatorType

    /** @type {Object} */
    const payload = {
      prognozVersion: Number(params.versionId),
      indicatorId: sessionContext.indicatorId,
      indicatorType: Number(indicatorType) === 2 ? 2 : 1,
      forecastData: {
        dateFrom: this._normalizeMonthForModule(params.startDate),
        dateTo: this._normalizeMonthForModule(params.endDate),
      },
      dateFrom: this._normalizeMonthForModule(sessionContext.historicalRangeFrom),
      dateTo: this._normalizeMonthForModule(sessionContext.historicalRangeTo),
      analytics: this._mapAnalyticsToModule(sessionContext.analytics),
    }

    const guid = sessionContext.excelGuid

    if (guid != null && String(guid) !== '') {
      payload.ExcelGUID = String(guid)

      if (sessionContext.excelType != null) {
        payload.ExcelType = sessionContext.excelType
      }
    }

    if (extras && Array.isArray(extras.dist_type)) {
      payload.dist_type = extras.dist_type
    }

    return payload
  }

  /**
   * @param {Object} sessionContext
   * @param {Object|null|undefined} params
   * @param {{ indicatorType?: 1|2 }} [extras]
   * @returns {Promise<{ ok: boolean, fault?: boolean, moduleError?: boolean, message?: string, data?: Object }>}
   */
  async fetchDistributionTable(sessionContext, params, extras) {
    const payload = this.buildRequestPayload(sessionContext, params, extras)

    if (!payload) {
      return { ok: false, message: null }
    }

    const userId = this.apiClient.getUserId()
    const versionId = params.versionId
    const response = await this.apiClient.getDistributionData(payload, userId, versionId)

    return this._parseGetDistributionDataResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{ ok: boolean, fault?: boolean, moduleError?: boolean, message?: string, data?: Object }}
   */
  _parseGetDistributionDataResponse(response) {
    if (response?.faultstring?.length > 0) {
      return { ok: false, fault: true }
    }

    if (!this.apiClient.checkModuleResponse(response)) {
      const message = response?.message != null ? String(response.message) : ''

      return { ok: false, moduleError: true, message }
    }

    try {
      const data =
        typeof response.message === 'string' ? JSON.parse(response.message) : response.message

      return { ok: true, data }
    } catch {
      return {
        ok: false,
        message: response?.message != null ? String(response.message) : '',
      }
    }
  }

  /**
   * @param {Object} sessionContext
   * @param {Object|null|undefined} params
   * @param {{ indicatorType?: 1|2, dist_type?: Array<string> }} [extras]
   * @returns {Promise<{ ok: boolean, fault?: boolean, empty?: boolean, message?: string, data?: Object }>}
   */
  async choiceDistribution(sessionContext, params, extras) {
    const payload = this.buildRequestPayload(sessionContext, params, extras)

    if (!payload) {
      return { ok: false, message: null }
    }

    const userId = this.apiClient.getUserId()
    const versionId = params.versionId
    const response = await this.apiClient.choiceDistribution(payload, userId, versionId)

    return this._parseChoiceDistributionResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{ ok: boolean, fault?: boolean, empty?: boolean, message?: string, data?: Object }}
   */
  _parseChoiceDistributionResponse(response) {
    if (response?.faultstring?.length > 0) {
      return { ok: false, fault: true }
    }

    if (!this.apiClient.checkModuleResponse(response)) {
      const message = response?.message != null ? String(response.message) : ''

      return { ok: false, message }
    }

    if (response?.message === '') {
      return { ok: false, empty: true }
    }

    try {
      const data =
        typeof response.message === 'string' ? JSON.parse(response.message) : response.message

      return { ok: true, data }
    } catch {
      return {
        ok: false,
        message: response?.message != null ? String(response.message) : '',
      }
    }
  }

  /**
   * @param {string|number} distributionKey
   * @param {Object|null|undefined} params
   * @returns {Promise<{ ok: boolean, fault?: boolean, message?: string }>}
   */
  async deleteDistribution(distributionKey, params) {
    if (distributionKey == null || String(distributionKey) === '') {
      return { ok: false, message: null }
    }

    if (!params || params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: null }
    }

    const userId = this.apiClient.getUserId()
    const versionId = params.versionId
    const response = await this.apiClient.deleteDistribution(
      { key: distributionKey },
      userId,
      versionId,
    )

    return this._parseDeleteDistributionResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{ ok: boolean, fault?: boolean, message?: string }}
   */
  _parseDeleteDistributionResponse(response) {
    if (response?.faultstring?.length > 0) {
      return {
        ok: false,
        fault: true,
        message: String(response.faultstring),
      }
    }

    if (!this.apiClient.checkModuleResponse(response)) {
      const message = response?.message != null ? String(response.message) : ''

      return { ok: false, message }
    }

    return { ok: true }
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  _mapAnalyticsToModule(analytics) {
    const result = { ...SelectDistributionService.ANALYTICS_DEFAULTS }

    if (analytics == null || typeof analytics !== 'object') {
      return result
    }

    Object.keys(SelectDistributionService.ANALYTICS_DEFAULTS).forEach((key) => {
      if (analytics[key] != null) {
        result[key] = String(analytics[key])
      }
    })

    return result
  }

  /**
   * @param {*} value
   * @returns {string}
   */
  _normalizeMonthForModule(value) {
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
}
