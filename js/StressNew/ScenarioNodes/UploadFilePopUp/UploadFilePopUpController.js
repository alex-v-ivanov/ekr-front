import { UploadFilePopUpValidator } from './UploadFilePopUpValidator.js'
import { UploadFilePopUpView } from './UploadFilePopUpView.js'

/**
 * @typedef {Object} UploadFilePopUpSessionContext
 * @property {number} rowNumber
 * @property {*} indicatorId
 * @property {Object|null} [analytics]
 * @property {*} [historicalRangeFrom]
 * @property {*} [historicalRangeTo]
 * @property {1|2} [excelType]
 */

/**
 * Модалка загрузки Excel для строки Input.
 * Legacy: `UploadFilePopUp` в `Reports/js/Stress/stress-popups.js`.
 *
 * Экземпляр только в `InputController` (п.19 §0).
 */
export class UploadFilePopUpController {

  /**
   * @param {import('./UploadFilePopUpService.js').UploadFilePopUpService} uploadFilePopUpService
   * @param {() => Object|null} getParams
   * @param {() => Array} getIndicators
   * @param {() => { clientServiceUrl: string, moniker: string }|null} getPutBinConfig
   * @param {(sessionContext: Object, params: Object|null, extras?: Object) => Object|null} buildExcelRequestPayload
   * @param {(data: Object) => void|Promise<void>} onApply
   */
  constructor(
    uploadFilePopUpService,
    getParams,
    getIndicators,
    getPutBinConfig,
    buildExcelRequestPayload,
    onApply,
  ) {
    this.getParams = getParams
    this.getIndicators = getIndicators
    this.getPutBinConfig = getPutBinConfig
    this.buildExcelRequestPayload = buildExcelRequestPayload
    this.onApply = onApply

    this.service = uploadFilePopUpService
    this.validator = new UploadFilePopUpValidator()
    this.view = new UploadFilePopUpView(this)

    /** @type {UploadFilePopUpSessionContext|null} */
    this.sessionContext = null

    /** @type {((message: string, type?: string) => void)|null} */
    this._showDialog = null
    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null

    /** @type {string|null} ExcelID после PutBin — для SaveExcelDataSet (§2.4) */
    this._putBinExcelId = null

    /** @type {{ excelGuid: string, data?: Object }|null} результат SaveExcelDataSet (§2.5) */
    this._saveExcelResult = null
  }

  /**
   * @param {((message: string, type?: string) => void)|null} fn
   */
  setShowDialog(fn) {
    this._showDialog = typeof fn === 'function' ? fn : null
  }

  /**
   * @param {((token: string) => void)|null} showFn
   * @param {((token: string) => void)|null} hideFn
   */
  setWaiter(showFn, hideFn) {
    this._showWaiter = typeof showFn === 'function' ? showFn : null
    this._hideWaiter = typeof hideFn === 'function' ? hideFn : null
  }

  /**
   * Открыть модалку для строки Input (п.19 §2.1; легасi `openModal`).
   * Контекст собирает `InputController`; controller не ищет строку по DOM.
   *
   * @param {UploadFilePopUpSessionContext|null|undefined} sessionContext
   */
  open(sessionContext) {
    if (!sessionContext || sessionContext.rowNumber == null) {
      return
    }

    const excelType = this._resolveExcelType(sessionContext)

    this.sessionContext = {
      ...sessionContext,
      excelType,
    }

    this.view.openModal(excelType)
  }

  /**
   * Тип Excel для radio при open (п.19 §1.4, §2.1; легасi `InputData.ExcelType`, default 1).
   *
   * @param {UploadFilePopUpSessionContext|null|undefined} sessionContext
   * @returns {1|2}
   */
  _resolveExcelType(sessionContext) {
    const raw = sessionContext?.excelType
    if (raw !== undefined && raw !== '') {
      return Number(raw) === 2 ? 2 : 1
    }
    return 1
  }

  handleSend() {
    if (!this.sessionContext) {
      return
    }

    const excelName = this.view.getExcelNameValue()
    const validation = this.validator.validateBeforeSend(this.view.fileInputEl, excelName)

    if (!validation.isValid) {
      this.view.showSendValidationErrors(excelName, validation.missingFile)
      return
    }

    this.view.clearSendValidationErrors()
    this.view.setSendButtonDisabled(true)

    void this._runSendUpload()
  }

  /**
   * PutBin + SaveExcelDataSet с waiter; ошибки — §2.6 (легасi `send` catch / `handleSaveExcelDataSetResponse`).
   *
   * @returns {Promise<void>}
   */
  async _runSendUpload() {
    try {
      await this._withWaiter('sendSaveExcel', () => this._performSendUpload())
    } catch {
      this._showErrorDialog(UploadFilePopUpValidator.COULD_NOT_SAVE_EXCEL_DATA)
      this.closeModal()
    }
  }

  /**
   * @param {string|null|undefined} message
   */
  _showErrorDialog(message) {
    if (this._showDialog && message) {
      this._showDialog(message)
    }
  }

  /**
   * Ошибка SaveExcelDataSet (п.19 §2.6; легасi `handleSaveExcelDataSetResponse` fault / else).
   *
   * @param {{
   *   ok?: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   * }|null|undefined} saveResult
   */
  _handleSaveExcelError(saveResult) {
    if (saveResult?.fault) {
      this._showErrorDialog(UploadFilePopUpValidator.COULD_NOT_SAVE_EXCEL_DATA)
      return
    }

    if (saveResult?.moduleError && saveResult.message) {
      this._showErrorDialog(saveResult.message)
      return
    }

    this._showErrorDialog(
      saveResult?.message || UploadFilePopUpValidator.COULD_NOT_SAVE_EXCEL_DATA,
    )
  }

  /**
   * PutBin (§2.3) + SaveExcelDataSet (§2.4); onApply — §2.5.
   *
   * @returns {Promise<void>}
   */
  async _performSendUpload() {
    const file = this.view.getSelectedFile()
    if (!file) {
      return
    }

    const putBinConfig = this.getPutBinConfig ? this.getPutBinConfig() : null
    if (!putBinConfig) {
      throw new Error('PutBin config is missing')
    }

    const formData = this._buildPutBinFormData(file)
    const fileName = file.name
    const format = fileName.split('.').pop().toLowerCase()

    this._putBinExcelId = await this.service.uploadFileToBin(formData, {
      clientServiceUrl: putBinConfig.clientServiceUrl,
      moniker: putBinConfig.moniker,
      format,
      fileName,
    })

    const params = this.getParams ? this.getParams() : null
    const excelName = this.view.getExcelNameValue()
    const excelType = this.view.getSelectedExcelType()
    const payload = this.buildExcelRequestPayload
      ? this.buildExcelRequestPayload(this.sessionContext, params, {
        includeIterationCounts: true,
        excelType,
        excelId: this._putBinExcelId,
        excelName,
      })
      : null

    if (!payload) {
      throw new Error('SaveExcelDataSet payload is invalid')
    }

    const saveResult = await this.service.saveExcelDataSet(payload, params)

    if (!saveResult.ok) {
      this._handleSaveExcelError(saveResult)
      this.closeModal()
      return
    }

    this._saveExcelResult = {
      excelGuid: saveResult.excelGuid,
      data: saveResult.data,
    }

    await this._applySuccessfulUpload()
  }

  /**
   * Успех SaveExcelDataSet → `onApply` → `closeModal` (п.19 §2.5; легасi `handleSaveExcelDataSetResponse`).
   *
   * @returns {Promise<void>}
   */
  async _applySuccessfulUpload() {
    const ctx = this.sessionContext
    const saveResult = this._saveExcelResult

    if (!ctx || !saveResult?.excelGuid) {
      return
    }

    const payload = {
      number: ctx.rowNumber,
      ExcelGUID: saveResult.excelGuid,
      ExcelType: this.view.getSelectedExcelType(),
      ExcelName: this.view.getExcelNameValue(),
      distributionId: -1,
      distributionParams: [],
    }

    if (this.onApply) {
      await Promise.resolve(this.onApply(payload))
    }

    this.closeModal()
  }

  /**
   * @param {File} file
   * @returns {FormData}
   */
  _buildPutBinFormData(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('data', file)
    return formData
  }

  /**
   * @template T
   * @param {string} token
   * @param {() => Promise<T>|T} fn
   * @returns {Promise<T>}
   */
  async _withWaiter(token, fn) {
    if (this._showWaiter) {
      this._showWaiter(token)
    }

    try {
      return await fn()
    } finally {
      if (this._hideWaiter) {
        this._hideWaiter(token)
      }
    }
  }

  closeModal() {
    this.sessionContext = null
    this._putBinExcelId = null
    this._saveExcelResult = null
    this.view.closeModal()
  }
}
