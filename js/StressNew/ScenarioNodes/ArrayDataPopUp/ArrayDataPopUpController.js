import { ArrayDataPopUpValidator } from './ArrayDataPopUpValidator.js'
import { ArrayDataPopUpView } from './ArrayDataPopUpView.js'

/**
 * @typedef {Object} ArrayDataPopUpSessionContext
 * @property {number} rowNumber
 * @property {*} indicatorId
 * @property {Object|null} [analytics]
 * @property {*} [historicalRangeFrom]
 * @property {*} [historicalRangeTo]
 * @property {1|2} [excelType]
 */

/**
 * Модалка выбора массива данных Excel для строки Input.
 * Legacy: `ArrayDataPopUp` в `Reports/js/Stress/stress-popups.js`.
 *
 * Экземпляр только в `InputController` (п.19 §0).
 */
export class ArrayDataPopUpController {

  /**
   * @param {import('./ArrayDataPopUpService.js').ArrayDataPopUpService} arrayDataPopUpService
   * @param {() => Object|null} getParams
   * @param {() => Array} getIndicators
   * @param {(sessionContext: Object, params: Object|null, extras?: Object) => Object|null} buildExcelRequestPayload
   * @param {(data: Object) => void|Promise<void>} onApply
   */
  constructor(
    arrayDataPopUpService,
    getParams,
    getIndicators,
    buildExcelRequestPayload,
    onApply,
  ) {
    this.getParams = getParams
    this.getIndicators = getIndicators
    this.buildExcelRequestPayload = buildExcelRequestPayload
    this.onApply = onApply

    this.service = arrayDataPopUpService
    this.validator = new ArrayDataPopUpValidator()
    this.view = new ArrayDataPopUpView(this)

    /** @type {ArrayDataPopUpSessionContext|null} */
    this.sessionContext = null

    /** @type {Array} */
    this.excelDatasets = []

    /** @type {1|2|null} */
    this.type = null

    /** @type {((message: string, type?: string) => void)|null} */
    this._showDialog = null
    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null
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
   * Открыть модалку для строки Input (п.19 §5.1; легасi `openModal`).
   * Pre-select radio и показ — `view.openModal`; список наборов — `loadDatasetsForType`.
   *
   * @param {ArrayDataPopUpSessionContext|null|undefined} sessionContext
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
    void this.loadDatasetsForType(excelType)
  }

  /**
   * Тип Excel для radio при open (п.19 §4.4 / §5.1; легасi `InputData.ExcelType`, default 1).
   *
   * @param {ArrayDataPopUpSessionContext|null|undefined} sessionContext
   * @returns {1|2}
   */
  _resolveExcelType(sessionContext) {
    const raw = sessionContext?.excelType
    if (raw !== undefined && raw !== '') {
      return Number(raw) === 2 ? 2 : 1
    }
    return 1
  }

  /**
   * Смена radio «Скалярный» / «Матрица» (п.19 §4.3; легасi `loadingArrayDataByType`).
   *
   * @param {1|2} type
   */
  onParameterTypeChange(type) {
    void this.loadDatasetsForType(type === 2 ? 2 : 1)
  }

  /**
   * Загрузка списка наборов для типа Excel (п.19 §4.3 / §5.1–5.2; легасi `loadingArrayDataByType`).
   *
   * @param {1|2} type
   * @returns {Promise<void>}
   */
  async loadDatasetsForType(type) {
    if (!this.sessionContext) {
      return
    }

    this.type = type === 2 ? 2 : 1

    await this._fetchAndRenderDatasets()
  }

  /**
   * GetExcelDataSets → `excelDatasets[]` (п.19 §5.2); render Select2 — §5.3.
   *
   * @returns {Promise<void>}
   */
  async _fetchAndRenderDatasets() {
    const ctx = this.sessionContext
    const type = this.type

    if (!ctx || type == null) {
      return
    }

    const params = this.getParams ? this.getParams() : null
    const payload = this.buildExcelRequestPayload
      ? this.buildExcelRequestPayload(ctx, params, { excelType: type })
      : null

    if (!payload) {
      this.excelDatasets = []
      this.view.renderDatasetOptions([])
      return
    }

    await this._withWaiter('GetExcelDataSets', async () => {
      try {
        const result = await this.service.fetchExcelDataSets(payload, params)

        if (!result.ok) {
          this.excelDatasets = []
          this.view.renderDatasetOptions([])
          this._handleGetExcelDataSetsError(result)
          return
        }

        this.excelDatasets = result.datasets || []
        this.view.renderDatasetOptions(this.excelDatasets)
      } catch {
        this.excelDatasets = []
        this.view.renderDatasetOptions([])
        this._showErrorDialog(ArrayDataPopUpValidator.COULD_NOT_GET_EXCEL_DATA)
      }
    })
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
   * Ошибка GetExcelDataSets (п.19 §5.6; легасi `handleGetExcelDataSetsResponse` fault).
   * Модалку не закрываем — как в легасi (в отличие от Upload save).
   *
   * @param {{
   *   ok?: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   * }|null|undefined} fetchResult
   */
  _handleGetExcelDataSetsError(fetchResult) {
    if (fetchResult?.fault) {
      this._showErrorDialog(ArrayDataPopUpValidator.COULD_NOT_GET_EXCEL_DATA)
      return
    }

    if (fetchResult?.moduleError && fetchResult.message) {
      this._showErrorDialog(fetchResult.message)
      return
    }

    this._showErrorDialog(
      fetchResult?.message || ArrayDataPopUpValidator.COULD_NOT_GET_EXCEL_DATA,
    )
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

  /**
   * Кнопка «Выбрать»: validator → `onApply` → `closeModal` (п.19 §5.4–5.5; легасi `selected`).
   */
  async handleSelect() {
    const ctx = this.sessionContext

    if (!ctx) {
      return
    }

    const index = this.view.getSelectedDatasetIndex()
    const validation = this.validator.validateSelection(index != null)

    if (!validation.isValid) {
      this.view.showEmptySelectionError(ArrayDataPopUpValidator.FIELD_REQUIRED)
      return
    }

    this.view.clearDropdownValidationErrors()

    const arrayData = this.excelDatasets[index]

    if (!arrayData) {
      return
    }

    const excelType = this.type === 2 ? 2 : 1
    const payload = {
      number: ctx.rowNumber,
      ExcelGUID: arrayData.ExcelGUID != null ? String(arrayData.ExcelGUID) : '',
      ExcelType: excelType,
      ExcelName: arrayData.ExcelName != null ? String(arrayData.ExcelName) : '',
      distributionId: -1,
      distributionParams: [],
    }

    if (this.onApply) {
      await Promise.resolve(this.onApply(payload))
    }

    this.closeModal()
  }

  closeModal() {
    this.sessionContext = null
    this.type = null
    this.excelDatasets = []
    this.view.closeModal()
  }
}
