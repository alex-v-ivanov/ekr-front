/**
 * API списка наборов Excel (GetExcelDataSets), п.19 §5.
 * Legacy: `ArrayDataPopUp.loadingArrayDataByType` в `stress-popups.js`.
 *
 * Слои (как UploadFilePopUpService): только `StressApi`; без DOM.
 */
export class ArrayDataPopUpService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * GetExcelDataSets → массив наборов из `message` (п.19 §5.2; легасi `handleGetExcelDataSetsResponse`).
   *
   * @param {Object} payload — JSON из `InputService.buildExcelRequestPayload`
   * @param {Object|null|undefined} params — блок Params (`versionId`)
   * @returns {Promise<{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   *   datasets?: Array,
   * }>}
   */
  async fetchExcelDataSets(payload, params) {
    if (!payload || !params || params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: null, datasets: [] }
    }

    const userId = this.apiClient.getUserId()
    const versionId = params.versionId
    const response = await this.apiClient.getExcelDataSets(payload, userId, versionId)

    return this._parseGetExcelDataSetsResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   *   datasets?: Array,
   * }}
   */
  _parseGetExcelDataSetsResponse(response) {
    if (response?.faultstring?.length > 0) {
      return { ok: false, fault: true, datasets: [] }
    }

    if (!this.apiClient.checkModuleResponse(response)) {
      const message = response?.message != null ? String(response.message) : ''

      return { ok: false, moduleError: true, message, datasets: [] }
    }

    try {
      const data =
        typeof response.message === 'string' ? JSON.parse(response.message) : response.message

      const datasets = Array.isArray(data) ? data : []

      return { ok: true, datasets }
    } catch {
      return {
        ok: false,
        message: response?.message != null ? String(response.message) : '',
        datasets: [],
      }
    }
  }
}
