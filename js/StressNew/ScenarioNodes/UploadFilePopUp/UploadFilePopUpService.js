/**
 * API загрузки Excel: PutBin + SaveExcelDataSet (п.19 §2).
 * Legacy: `UploadFilePopUp.send` / `handleSaveExcelDataSetResponse` в `stress-popups.js`.
 *
 * Слои (как AnalyticsPopUp / AddListIndicators): только `StressApi`; без `Common/config`, без DOM.
 */
export class UploadFilePopUpService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * Загрузить файл в хранилище через PutBin (п.19 §2.3; легасi `send` → fetch PutBin).
   *
   * @param {FormData} formData — `file` и `data` (как в легасi)
   * @param {{
   *   clientServiceUrl: string,
   *   moniker: string,
   *   format: string,
   *   fileName: string,
   * }} config
   * @returns {Promise<string>} ExcelID
   */
  async uploadFileToBin(formData, config) {
    return this.apiClient.putBin(formData, config)
  }

  /**
   * SaveExcelDataSet → `ExcelGUID` из `message` (п.19 §2.4; легасi `handleSaveExcelDataSetResponse`).
   *
   * @param {Object} payload — JSON из `InputService.buildExcelRequestPayload`
   * @param {Object|null|undefined} params — блок Params (`versionId`)
   * @returns {Promise<{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   *   excelGuid?: string,
   *   data?: Object,
   * }>}
   */
  async saveExcelDataSet(payload, params) {
    if (!payload || !params || params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: null }
    }

    const userId = this.apiClient.getUserId()
    const versionId = params.versionId
    const response = await this.apiClient.saveExcelDataSet(payload, userId, versionId)

    return this._parseSaveExcelDataSetResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   *   excelGuid?: string,
   *   data?: Object,
   * }}
   */
  _parseSaveExcelDataSetResponse(response) {
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

      const excelGuid =
        data != null && data.ExcelGUID != null ? String(data.ExcelGUID) : ''

      if (!excelGuid) {
        return {
          ok: false,
          message: response?.message != null ? String(response.message) : '',
        }
      }

      return { ok: true, excelGuid, data }
    } catch {
      return {
        ok: false,
        message: response?.message != null ? String(response.message) : '',
      }
    }
  }
}
