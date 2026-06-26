import { InputView } from './InputView.js'
import { InputValidator } from './InputValidator.js'
import { AnalyticsPopUpController } from '../ScenarioNodes/AnalyticsPopUp/AnalyticsPopUpController.js'
import { AnalyticsPopUpService } from '../ScenarioNodes/AnalyticsPopUp/AnalyticsPopUpService.js'
import { AnalysisPopUpController } from '../ScenarioNodes/AnalysisPopUp/AnalysisPopUpController.js'
import { AnalysisPopUpService } from '../ScenarioNodes/AnalysisPopUp/AnalysisPopUpService.js'
import { AddListIndicatorsController } from '../ScenarioNodes/AddListIndicators/AddListIndicatorsController.js'
import { AddListIndicatorsService } from '../ScenarioNodes/AddListIndicators/AddListIndicatorsService.js'
import { SelectDistributionController } from '../ScenarioNodes/SelectDistribution/SelectDistributionController.js'
import { SelectDistributionService } from '../ScenarioNodes/SelectDistribution/SelectDistributionService.js'
import { UploadFilePopUpController } from '../ScenarioNodes/UploadFilePopUp/UploadFilePopUpController.js'
import { UploadFilePopUpService } from '../ScenarioNodes/UploadFilePopUp/UploadFilePopUpService.js'
import { ArrayDataPopUpController } from '../ScenarioNodes/ArrayDataPopUp/ArrayDataPopUpController.js'
import { ArrayDataPopUpService } from '../ScenarioNodes/ArrayDataPopUp/ArrayDataPopUpService.js'
import { FilterPopUpController } from '../ScenarioNodes/FilterPopUp/FilterPopUpController.js'
import { FilterPopUpService } from '../ScenarioNodes/FilterPopUp/FilterPopUpService.js'

/**
 * InputController — состояние строк input, запросы через InputService, обновление InputView.
 */
export class InputController {

  /**
   * @param {InputService} inputService
   * @param {Function} onChangeCallback
   */
  constructor(inputService, onChangeCallback) {
    this.service = inputService
    this.onChangeCallback = onChangeCallback

    this.indicators = []
    this.params = null

    /** @type {Array<{ id: *, name: * }>} опции комбо показателя (после loadInputDimSelectOptions) */
    this.inputIndicatorOptions = []
    /** @type {Array<{ id: *, name: * }>} опции комбо распределения */
    this.distributionOptions = []
    /** @type {Array<{ id: *, name: * }>} справочник продуктов (ProductsEls) для колонки Product */
    this.productOptions = []

    this.validator = new InputValidator()
    this.view = new InputView(this)
    /** @type {((message: string, onConfirm: () => void) => void)|null} */
    this._showConfirmDialog = null
    /** @type {((message: string, type?: string) => void)|null} */
    this._showDialog = null
    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null
    /** @type {(() => { clientServiceUrl: string, moniker: string }|null)|null} */
    this._getPutBinConfig = null
    this._popUpViewsBound = false

    this.analyticsPopUpController = this._createAnalyticsPopUpController(inputService.apiClient)
    this.analysisPopUpController = this._createAnalysisPopUpController(inputService.apiClient)
    this.addListIndicatorsController = this._createAddListIndicatorsController(inputService.apiClient)
    this.selectDistributionController = this._createSelectDistributionController(inputService.apiClient)
    this.uploadFilePopUpController = this._createUploadFilePopUpController(inputService.apiClient)
    this.arrayDataPopUpController = this._createArrayDataPopUpController(inputService.apiClient)
    this.filterPopUpController = this._createFilterPopUpController(inputService.apiClient)
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {AnalyticsPopUpController}
   */
  _createAnalyticsPopUpController(apiClient) {
    const controller = new AnalyticsPopUpController(
      new AnalyticsPopUpService(apiClient),
      'Input',
      () => this.indicators,
      (rowNumber, analytics) => this._onAnalyticsPopUpApply(rowNumber, analytics),
    )
    return controller
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {AnalysisPopUpController}
   */
  _createAnalysisPopUpController(apiClient) {
    const controller = new AnalysisPopUpController(
      new AnalysisPopUpService(apiClient),
      'Input',
      () => this.indicators,
      (rowNumber) => {
        this.removeIndicator(rowNumber)
      },
      () => this.validator.getRemoveRowConfirmMessage(),
    )
    controller.setShowConfirmDialog(this._showConfirmDialog)
    return controller
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {AddListIndicatorsController}
   */
  _createAddListIndicatorsController(apiClient) {
    return new AddListIndicatorsController(
      new AddListIndicatorsService(apiClient),
      'Input',
      () => this.params,
      (rows) => this._onAddListIndicatorsCopy(rows),
    )
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {SelectDistributionController}
   */
  _createSelectDistributionController(apiClient) {
    return new SelectDistributionController(
      new SelectDistributionService(apiClient),
      () => this.params,
      () => this.distributionOptions,
      (data) => this._onSelectDistributionApply(data),
    )
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {UploadFilePopUpController}
   */
  _createUploadFilePopUpController(apiClient) {
    return new UploadFilePopUpController(
      new UploadFilePopUpService(apiClient),
      () => this.params,
      () => this.indicators,
      () => (this._getPutBinConfig ? this._getPutBinConfig() : null),
      (sessionContext, params, extras) =>
        this.service.buildExcelRequestPayload(sessionContext, params, extras),
      (data) => this._onUploadFileApply(data),
    )
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {ArrayDataPopUpController}
   */
  _createArrayDataPopUpController(apiClient) {
    return new ArrayDataPopUpController(
      new ArrayDataPopUpService(apiClient),
      () => this.params,
      () => this.indicators,
      (sessionContext, params, extras) =>
        this.service.buildExcelRequestPayload(sessionContext, params, extras),
      (data) => this._onArrayDataApply(data),
    )
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {FilterPopUpController}
   */
  _createFilterPopUpController(apiClient) {
    return new FilterPopUpController(
      new FilterPopUpService(apiClient),
      'Input',
      () => this.indicators,
      () => this.productOptions,
      () => this.distributionOptions,
      () => this.inputIndicatorOptions,
      (ctx) => this._onFilterPopUpIndicatorOptions(ctx),
      (ctx) => this._onFilterPopUpDistributionOptions(ctx),
      (ctx) => this._onFilterPopUpHeaderFilter(ctx),
    )
  }

  /**
   * Колбек фильтра показателя по блоку (C.3 §5; реализация — в InputView).
   *
   * @param {import('../ScenarioNodes/FilterPopUp/FilterPopUpController.js').FilterPopUpIndicatorSelectContext} ctx
   * @returns {Promise<void>}
   */
  async _onFilterPopUpIndicatorOptions(ctx) {
    this.view.refreshRowIndicatorSelect2(ctx.rowNumber, ctx.options)
  }

  /**
   * Колбек фильтра распределения в строке (C.3 §4).
   *
   * @param {import('../ScenarioNodes/FilterPopUp/FilterPopUpController.js').FilterPopUpDistributionSelectContext} ctx
   */
  _onFilterPopUpDistributionOptions(ctx) {
    this.view.refreshRowDistributionSelect2(ctx.rowNumber, ctx.options)
  }

  /**
   * Колбек фильтра шапки списка (C.3 §3).
   *
   * @param {import('../ScenarioNodes/FilterPopUp/FilterPopUpController.js').FilterPopUpHeaderSelectContext} ctx
   */
  _onFilterPopUpHeaderFilter(ctx) {
    this.view.applyHeaderRowFilter(ctx.headerColumn, ctx.value)
  }

  /**
   * Фильтр шапки списка Input (C.3 §3.1; легасi `initFilterInputIndicator`).
   *
   * @param {'Number'|'Name'|'Product'} headerColumn
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   */
  openHeaderFilter(headerColumn, $anchor, $nav) {
    this.filterPopUpController.openHeaderFilter(headerColumn, $anchor, $nav)
  }

  /**
   * Фильтр распределения в строке Input (C.3 §4.1; легасi `filteringDistribution` click).
   *
   * @param {number} rowNumber
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   */
  openDistributionFilter(rowNumber, $anchor, $nav) {
    this.filterPopUpController.openDistributionFilter(rowNumber, $anchor, $nav)
  }

  /**
   * Фильтр показателя по блоку модели в строке Input (C.3 §5.1; легасi `filteringIndicator` click).
   *
   * @param {number} rowNumber
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   * @returns {Promise<void>}
   */
  openIndicatorBlockFilter(rowNumber, $anchor, $nav) {
    return this.filterPopUpController.openIndicatorBlockFilter(rowNumber, $anchor, $nav)
  }

  /**
   * Колбек choose из модалки подбора (п.16 §5.4; полная сборка полей — в §5).
   *
   * @param {Object} data
   */
  _onSelectDistributionApply(data) {
    return this.applyDistribution(data)
  }

  /**
   * Колбек copy из попапа «Добавить список» (п.17 §3.5, §5.3).
   *
   * @param {Array} rows
   * @returns {Promise<void>}
   */
  async _onAddListIndicatorsCopy(rows) {
    await this.applyLoadedIndicatorRows(rows)
  }

  /**
   * Колбек после SaveExcelDataSet (п.19 §7.1).
   *
   * @param {Object} data
   */
  _onUploadFileApply(data) {
    if (data != null && data.number != null) {
      this.fillHistoricalRange(data.number)
    }

    this.applyExcelToRow(data)
  }

  /**
   * Колбек после выбора массива данных (п.19 §7.1–7.2; легасi `selected` → `checkIndicator`).
   *
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async _onArrayDataApply(data) {
    if (!this.applyExcelToRow(data)) {
      return
    }

    if (data.number != null) {
      await this.checkIndicator(data.number)
    }
  }

  /**
   * Конфиг PutBin (ClientServiceUrl, Moniker) — проброс из `StressController` (п.19 §0.5).
   *
   * @param {(() => { clientServiceUrl: string, moniker: string }|null)|null} fn
   */
  setPutBinConfig(fn) {
    this._getPutBinConfig = typeof fn === 'function' ? fn : null
  }

  /**
   * Confirm-диалог (легаси `common.showDialog`, п.15 §6.5). Проброс из `StressController.setShowConfirmDialog`.
   *
   * @param {((message: string, onConfirm: () => void) => void)|null} fn
   */
  setShowConfirmDialog(fn) {
    this._showConfirmDialog = typeof fn === 'function' ? fn : null
    this.analysisPopUpController.setShowConfirmDialog(this._showConfirmDialog)
    this.selectDistributionController.setShowConfirmDialog(this._showConfirmDialog)
  }

  /**
   * Информационный диалог (легаси `common.showDialog`; п.19 §7.3 — Upload / ArrayData).
   *
   * @param {((message: string, type?: string) => void)|null} fn
   */
  setShowDialog(fn) {
    this._showDialog = typeof fn === 'function' ? fn : null
    this.selectDistributionController.setShowDialog(fn)
    this.uploadFilePopUpController.setShowDialog(fn)
    this.arrayDataPopUpController.setShowDialog(fn)
  }

  /**
   * Оверлей загрузки (легаси `common.waiter`; п.19 §7.3 — Upload `sendSaveExcel`, ArrayData `GetExcelDataSets`).
   *
   * @param {((token: string) => void)|null} showFn
   * @param {((token: string) => void)|null} hideFn
   */
  setWaiter(showFn, hideFn) {
    this._showWaiter = typeof showFn === 'function' ? showFn : null
    this._hideWaiter = typeof hideFn === 'function' ? hideFn : null
    this.addListIndicatorsController.setWaiter(showFn, hideFn)
    this.selectDistributionController.setWaiter(showFn, hideFn)
    this.uploadFilePopUpController.setWaiter(showFn, hideFn)
    this.arrayDataPopUpController.setWaiter(showFn, hideFn)
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

  getInputIndicatorOptions() {
    return this.inputIndicatorOptions
  }

  getDistributionOptions() {
    return this.distributionOptions
  }

  /**
   * Загрузка справочников показателей и распределений из BI (аналог InputIndicatorEls / distributionEls).
   */
  async loadInputDimSelectOptions() {
    const { indicators, distributions, products } = await this.service.loadInputDimLists()
    this.inputIndicatorOptions = indicators
    this.distributionOptions = distributions
    this.productOptions = products
    this.view.setSelect2Options(this.inputIndicatorOptions, this.distributionOptions)
  }

  /**
   * Загрузка справочников при bind view (аналог stress-ui: InputIndicatorEls / distributionEls).
   * Отрисовка строк — в InputView после await onBind (п. 1.4).
   */
  async onBind() {
    await this.loadInputDimSelectOptions()
  }

  bindView(root) {
    this.view.bind(root)
    this._bindPopUpViewsOnce(root)
  }

  /**
   * DOM попапов analytics / analysis / addListIndicators / selectDistribution / uploadFile / arrayData / filterPopUp — при первом `bindView`.
   *
   * @param {HTMLElement|Document} root
   */
  _bindPopUpViewsOnce(root) {
    if (this._popUpViewsBound) {
      return
    }

    const scope = root || document

    this.analyticsPopUpController.view.bind(scope)
    this.analysisPopUpController.view.bind(scope)
    this.addListIndicatorsController.view.bind(scope)
    // п.16 §1.8 — легаси stress-ui: chart.init + InputSelectDistribution.init
    this.selectDistributionController.view.bind(scope)
    // п.19 §1.7 — легаси stress-ui: uploadFilePopUp.init
    this.uploadFilePopUpController.view.bind(scope)
    // п.19 §4.6 — легаси stress-ui: arrayDataPopUp.init
    this.arrayDataPopUpController.view.bind(scope)
    // C.3 §0.3 — легасi CustomePopUp (filtering*)
    this.filterPopUpController.view.bind(scope)
    this._popUpViewsBound = true
  }

  /**
   * @param {number} [scrollToNumber] — после render прокрутить к строке (п. 2.2, только при добавлении).
   */
  syncIndicators(scrollToNumber) {
    const viewRows = this.indicators.map((row, index) => this._toViewRow(row, index))
    this.view.renderIndicators(viewRows, scrollToNumber)
    this._notifyIndicatorsChanged()
  }

  /**
   * Подпись распределения в view-режиме; `-1` и пустое имя — как «не выбрано» (после Excel / сброса).
   *
   * @param {Object} row
   * @returns {string}
   */
  _resolveDistributionDisplayName(row) {
    const id = row.distributionId

    if (id == null || id === '' || Number(id) === -1) {
      return ''
    }

    if (row.distributionName != null && String(row.distributionName) !== '') {
      return String(row.distributionName)
    }

    return String(id)
  }

  /**
   * Имя распределения для иконки Schedule — только при активном id (не после сброса Excel).
   *
   * @param {Object} row
   * @returns {string|null}
   */
  _resolveScheduleDistributionName(row) {
    const id = row.distributionId

    if (id == null || id === '' || Number(id) === -1) {
      return null
    }

    if (row.distributionName != null && String(row.distributionName) !== '') {
      return String(row.distributionName)
    }

    return null
  }

  /**
   * DTO для отрисовки строки: подписи и нормализованные поля, без логики справочников во view.
   *
   * @param {Object} row
   * @param {number} index
   * @returns {Object}
   */
  _toViewRow(row, index) {
    return {
      number: row.number != null ? row.number : index + 1,
      indicatorId: row.indicatorId,
      indicatorName: row.indicatorName,
      distributionId: row.distributionId,
      distributionName: this._resolveScheduleDistributionName(row),
      indicatorDisplayName: row.indicatorName || row.name || '',
      distributionDisplayName: this._resolveDistributionDisplayName(row),
      productLabel: this._resolveProductLabel(row.analytics),
      distributionParams: row.distributionParams,
      acceptableRangeLabel: this.service.formatAcceptableRange(row.validDateFrom, row.validDateTo),
      historicalRangeFrom: this._resolveHistoricalRangeBound(row, 'from'),
      historicalRangeTo: this._resolveHistoricalRangeBound(row, 'to'),
      historicalRangeLabel: this.service.formatHistoricalRangeDisplay(
        row.historicalRangeFrom ?? row.dateFrom,
        row.historicalRangeTo ?? row.dateTo,
      ),
      rowErrorState: this.service.resolveRowErrorState(row),
      analyticsButton: this.service.resolveAnalyticsButtonState(row.analytics),
      excelRowState: this.service.resolveExcelRowState(row),
      excelFileButtons: this.service.resolveExcelFileButtons(row),
      indicatorType: row.indicatorType != null && Number(row.indicatorType) === 2 ? 2 : 1,
      ...this.service.resolveRowViewMode(row),
    }
  }

  /**
   * @param {Object} row
   * @param {'from'|'to'} bound
   * @returns {string}
   */
  _resolveHistoricalRangeBound(row, bound) {
    const key = bound === 'from' ? 'historicalRangeFrom' : 'historicalRangeTo'
    const altKey = bound === 'from' ? 'dateFrom' : 'dateTo'
    const value = row[key] != null ? row[key] : row[altKey]

    return value != null && value !== '' ? String(value) : ''
  }

  /**
   * Подпись Product по analytics.product и справочнику productOptions (легаси syncProductFieldFromAnalytics; в т.ч. -1 / «Все»).
   *
   * @param {Object|null} analytics
   * @returns {string}
   */
  _resolveProductLabel(analytics) {
    if (analytics == null || analytics.product === undefined) {
      return ''
    }

    const id = String(analytics.product)
    const item = this.productOptions.find((p) => String(p.id) === id)

    return item != null ? item.name : id
  }

  /**
   * @param {string|number} value
   * @param {number} [decimals]
   * @returns {string}
   */
  formatOptionValueDisplay(value, decimals) {
    return this.service.formatOptionValueDisplay(value, decimals)
  }

  /**
   * Выбор показателя в Select2 (п. 4.2; легаси `loadingAnalysts` + `fillAnalysts`).
   *
   * @param {number} number
   * @param {Object|Array} select2Data — `e.params.data`
   * @returns {Promise<void>}
   */
  async onIndicatorSelect(number, select2Data) {
    const parsed = this.service.parseIndicatorFromSelect2(select2Data)

    if (!parsed) {
      return
    }

    const analytics = await this.analyticsPopUpController.service.resolveRowAnalytics(
      parsed.indicatorId,
      'Input',
      null,
    )

    this.patchIndicator(
      number,
      {
        indicatorId: parsed.indicatorId,
        indicatorName: parsed.indicatorName,
        analytics,
      },
      { rerender: true },
    )

    if (parsed.indicatorId != null && String(parsed.indicatorId) !== '') {
      await this.updateInputValidDateRange(number)
      await this.checkIndicator(number)
    }
  }

  /**
   * Выбор распределения в Select2 (п. 4.4–4.5). Загрузка params; DTO для перерисовки Options/Schedule/HistoricalRange.
   *
   * @param {number} number
   * @param {Object|Array} select2Data — `e.params.data`
   * @returns {Promise<Object|null>}
   */
  async onDistributionSelect(number, select2Data) {
    const parsed = this.service.parseDistributionFromSelect2(select2Data)

    if (!parsed) {
      return null
    }

    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return null
    }

    const shouldFetchParams =
      row.getParamFromRequest === true ||
      !row.distributionParams ||
      row.distributionParams.length === 0

    this.patchIndicator(
      number,
      {
        distributionId: parsed.distributionId,
        distributionName: parsed.distributionName,
      },
      { rerender: false },
    )

    if (shouldFetchParams && parsed.distributionId != null) {
      try {
        const distributionParams = await this.service.loadDistributionParams(parsed.distributionId)
        this.patchIndicator(number, { distributionParams }, { rerender: false })
      } catch (err) {
        console.error('InputController.onDistributionSelect: loadDistributionParams', err)
        this.patchIndicator(number, { distributionParams: [] }, { rerender: false })
      }
    }

    const distributionType = this.service.resolveDistributionTypeByName(
      parsed.distributionName,
      this.distributionOptions,
    )

    if (distributionType != null) {
      this.patchIndicator(number, { indicatorType: distributionType }, { rerender: false })
    }

    const updatedRow = this.indicators.find((r) => r.number === number)

    if (!updatedRow) {
      return null
    }

    return {
      distributionId: parsed.distributionId,
      distributionName: parsed.distributionName,
      distributionParams: updatedRow.distributionParams,
      optionsUseEditorMode: this.service.resolveRowViewMode(updatedRow).optionsUseEditorMode,
      selectionButtonType: distributionType,
      historicalRangeAfterDistribution: this.service.resolveHistoricalRangeAfterDistributionChange(
        updatedRow,
      ),
      requestValidDateRange: !this.service.resolveExcelRowState(updatedRow).hasExcel,
    }
  }

  /**
   * Запрос и применение допустимого диапазона дат (п. 5.4–5.5, легаси updateInputValidDateRange).
   *
   * @param {number} number
   * @param {{ skipIfStored?: boolean }} [options] — `skipIfStored: true` только при render загруженной строки (легаси ~177–184)
   * @returns {Promise<boolean>}
   */
  async updateInputValidDateRange(number, options = {}) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row || !this.params) {
      return false
    }

    if (options.skipIfStored === true && this.service.hasStoredValidDateRange(row)) {
      return false
    }

    if (row.indicatorId == null || String(row.indicatorId) === '') {
      return false
    }

    return this._withWaiter('update valid date', async () => {
      try {
        const apiResponse = await this.service.fetchValidDateRange(row, this.params)

        if (apiResponse == null) {
          return false
        }

        return this.applyCheckDataValidRangeResponse(number, apiResponse)
      } catch (err) {
        console.error('InputController.updateInputValidDateRange', err)
        return this._applyCheckDataValidRangeParsed(number, {
          ok: false,
          errorLabel: 'Нет данных',
        })
      }
    })
  }

  /**
   * Обработчик ответа CheckData (п. 5.5, легаси handleCheckDataResponse).
   *
   * @param {number} number
   * @param {*} apiResponse
   * @returns {boolean}
   */
  applyCheckDataValidRangeResponse(number, apiResponse) {
    const parsed = this.service.parseCheckDataValidRangeResponse(apiResponse)

    return this._applyCheckDataValidRangeParsed(number, parsed)
  }

  /**
   * @param {number} number
   * @param {{ ok: boolean, validDateFrom?: *, validDateTo?: *, label?: string, errorLabel?: string }} parsed
   * @returns {boolean}
   */
  _applyCheckDataValidRangeParsed(number, parsed) {
    if (parsed.ok) {
      this.patchIndicator(
        number,
        {
          validDateFrom: parsed.validDateFrom,
          validDateTo: parsed.validDateTo,
        },
        { rerender: false },
      )
      this.view.updateAcceptableRange(number, { label: parsed.label, hasError: false })
    } else {
      this.view.updateAcceptableRange(number, {
        label: parsed.errorLabel || 'Нет данных',
        hasError: true,
      })
    }

    this._checkRangeDateIfApplicable(number)

    return true
  }

  /**
   * Подсветка ошибок исторического диапазона (п. 5.6, легаси checkRangeDate). Без showDialog.
   *
   * @param {number} number
   * @returns {boolean}
   */
  checkRangeDate(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return false
    }

    if (this.service.resolveExcelRowState(row).hasExcel) {
      return false
    }

    const validation = this.service.resolveRangeDateValidation(row)

    return this.view.applyRangeDateValidation(number, validation)
  }

  /**
   * @param {number} number
   */
  _checkRangeDateIfApplicable(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row || this.service.resolveExcelRowState(row).hasExcel) {
      return
    }

    this.checkRangeDate(number)
  }

  /**
   * Сброс распределения — снова запрашивать params с сервера (легаси select2:unselecting ~581–586).
   *
   * @param {number} number
   * @returns {boolean}
   */
  onDistributionUnselect(number) {
    return this.patchIndicator(number, { getParamFromRequest: true }, { rerender: false })
  }

  /**
   * Подготовка исторического диапазона перед AirDatepicker (п. 5.1): дефолты в модели + ISO для виджета.
   *
   * @param {number} number
   * @returns {{ fromIso: string, toIso: string, viewLabel: string }|null}
   */
  prepareHistoricalRangeForPicker(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return null
    }

    const patch = this.service.buildHistoricalRangeDefaultsPatch(row)

    if (patch) {
      this.patchIndicator(number, patch, { rerender: false })
    }

    const updatedRow = this.indicators.find((r) => r.number === number)

    if (!updatedRow) {
      return null
    }

    return this.service.resolveHistoricalRangePickerDates(updatedRow)
  }

  /**
   * Выбор даты в AirDatepicker (п. 5.2, легаси fillHistoricalRange).
   *
   * @param {number} number
   * @param {*} fromPicker
   * @param {*} toPicker
   * @returns {{ viewLabel: string }|null}
   */
  onHistoricalRangePickerSelect(number, fromPicker, toPicker) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return null
    }

    const { patch, viewLabel } = this.service.buildHistoricalRangePatchFromPickers(fromPicker, toPicker)

    this.patchIndicator(number, patch, { rerender: false })

    return { viewLabel }
  }

  /**
   * Синхронизация исторического диапазона из AirDatepicker в модель (п. 5.3, легаси fillHistoricalRange).
   *
   * @param {number} number
   * @returns {boolean}
   */
  fillHistoricalRange(number) {
    return this.view.fillHistoricalRange(number)
  }

  /**
   * Кнопка «Редактировать» — режим editor (п. 6.1, легаси editeRow ~260–264).
   *
   * @param {number} number
   * @returns {boolean}
   */
  onEditRow(number) {
    this.patchIndicator(number, { getParamFromRequest: true }, { rerender: false })
    return this.view.setRowEditMode(number, true)
  }

  /**
   * Кнопка «Сохранить» — режим view (п. 6.2, легаси save ~242–257). Options — `InputValidator.validateRowOptions` (п. 2.2).
   *
   * @param {number} number
   * @returns {boolean}
   */
  onSaveRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return false
    }

    if (!this.validator.validateRowOptions(row)) {
      this.setMessages([
        { type: 'error', text: this.validator.getValuesProbabilitiesMismatchMessage(), meta: { rowIndex: number } },
      ])

      return false
    }

    this.patchIndicator(number, { getParamFromRequest: false }, { rerender: false })
    return this.view.setRowEditMode(number, false)
  }

  _notifyIndicatorsChanged() {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.indicators)
    }
  }

  getNumberRow(data) {
    if (!data || data.length === 0) {
      return 1
    }
    const hasNumberProperty = data.some(obj => Object.prototype.hasOwnProperty.call(obj, 'number'))
    if (!hasNumberProperty) {
      return 1
    }
    const numbers = data
      .filter(obj => Object.prototype.hasOwnProperty.call(obj, 'number') && typeof obj.number === 'number')
      .map(obj => obj.number)
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  }

  createEmptyIndicator(number) {
    return {
      number,
      indicatorId: null,
      indicatorName: null,
      distributionId: null,
      distributionName: null,
      distributionParams: [],
      historicalRangeFrom: null,
      historicalRangeTo: null,
      getParamFromRequest: true,
      indicatorType: 1,
      analytics: null,
      mode: null,
      status: -1,
    }
  }

  /**
   * Добавить строку input (кнопка «+»). Guard — `InputValidator.canAddRow` (легаси `addNewInput`).
   * `CheckSingleStructure` — только после выбора показателя (`onIndicatorSelect`), не при добавлении пустой строки.
   */
  async addNewIndicator() {
    const check = this.validator.canAddRow(this.params)

    if (!check.ok) {
      if (check.message) {
        this.setMessages([{ type: 'error', text: check.message }])
      }

      return
    }

    const number = this.getNumberRow(this.indicators)
    const newIndicator = this.createEmptyIndicator(number)
    const prepared = await this._prepareIndicatorRow(newIndicator)

    this.indicators.push(prepared)
    this.syncIndicators(number)
  }

  setMessages(items) {
    this.view.setMessages(Array.isArray(items) ? items : [])
  }

  async setParams(params) {
    const prevParams = this.params
    const prevVersionId = prevParams != null ? prevParams.versionId : null
    const periodChanged = this._isPeriodChanged(prevParams, params)

    this.params = params

    if (periodChanged) {
      await this.recalculate()
    }

    const versionChanged =
      params != null
      && params.versionId != null
      && String(params.versionId) !== ''
      && params.versionId !== prevVersionId

    if (versionChanged && prevVersionId != null && this.indicators.length > 0) {
      await this.recheckAllIndicators()
    }
  }

  /**
   * @param {Object|null|undefined} prevParams
   * @param {Object|null|undefined} params
   * @returns {boolean}
   */
  _isPeriodChanged(prevParams, params) {
    if (!prevParams || !params) {
      return false
    }

    return prevParams.startDate !== params.startDate || prevParams.endDate !== params.endDate
  }

  /**
   * Проверка строки через `CheckSingleStructure` (легаси `checkIndicator`).
   *
   * @param {number} number
   * @returns {Promise<boolean>} `true` — проверка прошла
   */
  async checkIndicator(number) {
    return this._withWaiter('CheckIndicator', () => this._checkIndicatorCore(number))
  }

  /**
   * @param {number} number
   * @returns {Promise<boolean>}
   */
  async _checkIndicatorCore(number) {
    let row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return false
    }

    if (!this.service.resolveExcelRowState(row).hasExcel) {
      this.fillHistoricalRange(number)
      row = this.indicators.find((r) => r.number === number)

      if (!row) {
        return false
      }
    }

    const result = await this.service.checkIndicatorStructure(row, this.params)

    if (result.missingParams) {
      this.setMessages([
        { type: 'error', text: InputValidator.COULD_NOT_DETERMINE_REQUIRED_FIELDS },
      ])
      return false
    }

    this.patchIndicator(number, { status: result.status }, { rerender: false })

    const rowErrorState = this.service.resolveRowErrorState({
      ...row,
      status: result.status,
    })

    this.view.updateRowErrorState(number, rowErrorState)

    if (
      result.isError
      && row.ExcelType === 2
      && result.message
      && this._showDialog
    ) {
      this._showDialog(result.message, 'Error')
    }

    return !result.isError
  }

  /**
   * Перепроверка всех строк при смене версии прогноза (легаси `initPrognozVersionCombo` ~210–232).
   *
   * @returns {Promise<void>}
   */
  async recheckAllIndicators() {
    if (this.indicators.length === 0) {
      return
    }

    await this._withWaiter('CheckIndicator', async () => {
      await Promise.all(this.indicators.map((row) => this._checkIndicatorCore(row.number)))
    })
  }

  /**
   * После загрузки списка: проверить строки без сохранённого `status` (легаси renderInput ~146–149).
   *
   * @returns {Promise<void>}
   */
  async _checkIndicatorsWithoutStatus() {
    const numbers = this.indicators
      .filter((row) => row.status === undefined || row.status === null || row.status === '')
      .map((row) => row.number)

    if (numbers.length === 0) {
      return
    }

    await this._withWaiter('CheckIndicator', async () => {
      await Promise.all(numbers.map((number) => this._checkIndicatorCore(number)))
    })
  }

  /**
   * Пересчёт при смене params (п. 7.1): исторический диапазон из пикеров, valid range / checkRangeDate.
   * Только при смене периода — не при смене версии прогноза (легаси `initPrognozVersionCombo`).
   *
   * @returns {Promise<void>}
   */
  async recalculate() {
    if (!this.params || this.indicators.length === 0) {
      return
    }

    await Promise.all(this.indicators.map((row) => this._recalculateRow(row.number)))
  }

  /**
   * @param {number} number
   * @returns {Promise<void>}
   */
  async _recalculateRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return
    }

    this.fillHistoricalRange(number)

    if (this.service.resolveExcelRowState(row).hasExcel) {
      return
    }

    if (this.service.hasStoredValidDateRange(row)) {
      this.checkRangeDate(number)
      return
    }

    if (row.indicatorId != null && String(row.indicatorId) !== '') {
      await this.updateInputValidDateRange(number)
    }
  }

  /**
   * Обновить строку целым объектом (попапы, upload). Пока с полным re-render.
   *
   * @param {Object} updatedIndicator
   */
  applyIndicator(updatedIndicator) {
    if (!updatedIndicator) {
      return
    }

    let number = updatedIndicator.number
    if (number == null && updatedIndicator.id != null) {
      const row = this.indicators.find((r) => r.id === updatedIndicator.id)
      number = row != null ? row.number : null
    }

    if (number == null) {
      return
    }

    this.patchIndicator(number, updatedIndicator, { rerender: true })
  }

  /**
   * Точечное обновление полей строки по number (п. 2.4).
   * По умолчанию только модель + колбек; `rerender: true` — полный render (до patch во view, п. 4–5).
   *
   * @param {number} number
   * @param {Object} partial
   * @param {{ rerender?: boolean }} [options]
   * @returns {boolean} строка найдена и обновлена
   */
  patchIndicator(number, partial, options) {
    const idx = this.indicators.findIndex((r) => r.number === number)
    if (idx === -1) {
      return false
    }

    const merged = { ...this.indicators[idx], ...(partial || {}) }

    if (Object.prototype.hasOwnProperty.call(partial || {}, 'distributionParams')) {
      merged.distributionParams = this.service.normalizeDistributionParams(merged.distributionParams)
    }

    this.indicators[idx] = merged

    if (options && options.rerender) {
      this.syncIndicators()
    } else {
      this._notifyIndicatorsChanged()
    }

    return true
  }

  /**
   * Результат подбора/выбора распределения → строка по `number` (п. 2.5, контракт без попапа).
   *
   * @param {Object} data — `number` и поля распределения (см. `_distributionPartialFromData`)
   * @returns {boolean}
   */
  applyDistribution(data) {
    if (!data || data.number == null) {
      return false
    }

    const partial = this._distributionPartialFromData(data)
    if (Object.keys(partial).length === 0) {
      return false
    }

    return this.patchIndicator(data.number, partial, { rerender: true })
  }

  /**
   * Excel из Upload / ArrayData → строка Input (п.19 §7.1; легасi `handleSaveExcelDataSetResponse` / `selected`).
   * DOM строки не трогаем — re-render через `resolveExcelRowState` / `_renderExcelRowState` (п.13 §3.7).
   *
   * @param {Object|null|undefined} data — контракт §onApply
   * @returns {boolean}
   */
  applyExcelToRow(data) {
    if (!data || data.number == null) {
      return false
    }

    const excelType = Number(data.ExcelType) === 2 ? 2 : 1

    const partial = {
      ExcelGUID: data.ExcelGUID != null ? String(data.ExcelGUID) : '',
      ExcelType: excelType,
      ExcelName: data.ExcelName != null ? String(data.ExcelName) : '',
      // Сброс подбора: id/params в модели и payload; имя — только для UI (легасi DOM не чистит, по спецификации — пустая строка).
      distribution: '',
      distributionId: -1,
      distributionName: null,
      distributionParams: [],
    }

    return this.patchIndicator(data.number, partial, { rerender: true })
  }

  /**
   * Поля распределения из payload попапа/API для merge в строку (save/run как в легаси).
   *
   * @param {Object} data
   * @returns {Object}
   */
  _distributionPartialFromData(data) {
    const keys = [
      'distributionId',
      'distributionName',
      'distributionParams',
      'indicatorType',
      'getParamFromRequest',
      'historicalRangeFrom',
      'historicalRangeTo',
      'validDateFrom',
      'validDateTo',
    ]
    const partial = {}

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i]
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        partial[key] = data[key]
      }
    }

    return partial
  }

  /**
   * Кнопка removeRow (п.15 §6.1): confirm, затем удаление (легаси `stress-input-rows` ~230–239).
   *
   * @param {number} number
   */
  onRemoveRow(number) {
    if (!this._showConfirmDialog) {
      this.removeIndicator(number)
      return
    }

    this._showConfirmDialog(this.validator.getRemoveRowConfirmMessage(), () => {
      this.removeIndicator(number)
    })
  }

  /**
   * Удалить строку из модели и перерисовать список.
   *
   * @param {number} number
   */
  removeIndicator(number) {
    this.indicators = this.indicators.filter((row) => row.number !== number)
    this.syncIndicators()
  }

  /**
   * Кнопка «Очистить список» (п.15 §6.3): confirm, затем очистка (легаси `clearInputList` ~387–392).
   */
  onClearAllIndicators() {
    if (!this._showConfirmDialog) {
      this.clearAllIndicators()
      return
    }

    this._showConfirmDialog(this.validator.getClearAllIndicatorsConfirmMessage(), () => {
      this.clearAllIndicators()
    })
  }

  /**
   * Очистить все строки input (`setIndicators([])`).
   */
  clearAllIndicators() {
    void this.setIndicators([])
  }

  /**
   * Кнопка «Загрузка из EXCEL» в строке (п.19 §3.1–3.4; легаси `uploadFilePopUp.openModal(id)`).
   *
   * @param {number} number
   */
  openUploadFileForRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return
    }

    const check = this.validator.canOpenUploadFile(row)

    if (!check.ok) {
      if (check.silent) {
        return
      }

      if (check.message) {
        this._showSelectDistributionGuardMessage(check.message, number)
      }

      return
    }

    this.fillHistoricalRange(number)

    const updatedRow = this.indicators.find((r) => r.number === number) || row

    this.uploadFilePopUpController.open(this._buildUploadFileSessionContext(updatedRow))
  }

  /**
   * Кнопка «Выбрать массив данных» в строке (п.19 §6.1–6.3; легасi `arrayDataPopUp.openModal(id)`).
   *
   * @param {number} number
   */
  openArrayDataForRow(number) {
    const sessionContext = this._resolveArrayDataSessionContext(number)

    if (!sessionContext) {
      return
    }

    this.fillHistoricalRange(number)

    const updatedContext = this._resolveArrayDataSessionContext(number)

    this.arrayDataPopUpController.open(updatedContext || sessionContext)
  }

  /**
   * Контекст строки для `ArrayDataPopUpController.open` (п.19 §sessionContext; тот же контракт, что Upload §3.2).
   *
   * @param {number} number
   * @returns {Object|null}
   */
  _resolveArrayDataSessionContext(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return null
    }

    return this._buildArrayDataSessionContext(row)
  }

  /**
   * @param {Object} row
   * @returns {{
   *   rowNumber: number,
   *   indicatorId: *,
   *   analytics: Object|null,
   *   historicalRangeFrom: *,
   *   historicalRangeTo: *,
   *   excelType: 1|2,
   * }}
   */
  _buildArrayDataSessionContext(row) {
    return this._buildUploadFileSessionContext(row)
  }

  /**
   * Контекст строки для `UploadFilePopUpController.open` (п.19 §sessionContext).
   *
   * @param {number} number
   * @returns {Object|null}
   */
  _resolveUploadFileSessionContext(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return null
    }

    return this._buildUploadFileSessionContext(row)
  }

  /**
   * @param {Object} row
   * @returns {{
   *   rowNumber: number,
   *   indicatorId: *,
   *   analytics: Object|null,
   *   historicalRangeFrom: *,
   *   historicalRangeTo: *,
   *   excelType: 1|2,
   * }}
   */
  _buildUploadFileSessionContext(row) {
    const { from: historicalRangeFrom, to: historicalRangeTo } =
      this.service.resolveHistoricalRangeBounds(row)

    const rawExcelType = row.ExcelType
    const excelType =
      rawExcelType !== undefined && rawExcelType !== ''
        ? (Number(rawExcelType) === 2 ? 2 : 1)
        : 1

    return {
      rowNumber: row.number,
      indicatorId: row.indicatorId,
      analytics: row.analytics != null ? row.analytics : null,
      historicalRangeFrom,
      historicalRangeTo,
      excelType,
    }
  }

  /**
   * Кнопка подбора распределения/модели (п.16 §3.1–3.4; легаси `stress-input-rows` → `selection` click).
   * Guard — §3.2; открытие модалки — §3.3; загрузка данных — §3.4.
   *
   * @param {number} number
   */
  openSelectDistributionForRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return
    }

    const rangeValidation = this.service.resolveRangeDateValidation(row)
    const check = this.validator.canOpenSelectDistribution(row, rangeValidation)

    if (!check.ok) {
      if (check.silent) {
        return
      }

      if (check.message) {
        this._showSelectDistributionGuardMessage(check.message, number)
      }

      return
    }

    // §3.4 — fetchDistributionTable, таблица, график
    this.view.setActiveInputRow(number)

    const indicatorType = this.view.getSelectionButtonType(number)

    this.patchIndicator(number, { indicatorType }, { rerender: false })

    const updatedRow = this.indicators.find((r) => r.number === number)

    if (!updatedRow) {
      return
    }

    this.selectDistributionController.open(
      this._buildSelectDistributionSessionContext(updatedRow, indicatorType),
    )
  }

  /**
   * Контекст строки для `SelectDistributionController.open` (п.16 §3.3).
   *
   * @param {Object} row
   * @param {1|2} indicatorType
   * @returns {Object}
   */
  _buildSelectDistributionSessionContext(row, indicatorType) {
    const { from: historicalRangeFrom, to: historicalRangeTo } =
      this.service.resolveHistoricalRangeBounds(row)
    const guid = row.ExcelGUID
    const hasExcel = guid !== '' && guid !== undefined && guid !== null

    return {
      rowNumber: row.number,
      indicatorId: row.indicatorId,
      indicatorName:
        row.indicatorName != null
          ? String(row.indicatorName)
          : row.name != null
            ? String(row.name)
            : '',
      indicatorType: indicatorType === 2 ? 2 : 1,
      historicalRangeFrom,
      historicalRangeTo,
      analytics: row.analytics != null ? { ...row.analytics } : null,
      excelGuid: hasExcel ? String(guid) : '',
      excelType: row.ExcelType != null ? row.ExcelType : null,
      distributionName: row.distributionName != null ? String(row.distributionName) : '',
    }
  }

  /**
   * Диалог guard подбора (легаси `common.showDialog` при ошибке selection).
   *
   * @param {string} message
   * @param {number} [rowNumber]
   */
  _showSelectDistributionGuardMessage(message, rowNumber) {
    if (this._showDialog) {
      this._showDialog(message)
      return
    }

    this.setMessages([
      {
        type: 'error',
        text: message,
        ...(rowNumber != null ? { meta: { rowIndex: rowNumber } } : {}),
      },
    ])
  }

  /**
   * Кнопка analytics в строке (п.18 §2.1; легаси `stress-input-rows` click analytics).
   * Guards — §2.2–2.3; Dim при открытии — §2.5; render — §3.2.
   *
   * @param {number} number
   */
  async openAnalyticsForRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return
    }

    const check = this.validator.canOpenAnalytics(row)

    if (!check.ok) {
      this.setMessages([
        { type: 'error', text: check.message, meta: { rowIndex: number } },
      ])
      return
    }

    this.analyticsPopUpController.init({
      rowNumber: number,
      indicatorId: row.indicatorId,
      indicatorName: row.indicatorName != null ? row.indicatorName : row.name,
      analytics: row.analytics,
    })

    const { loaded, analytics } = await this.analyticsPopUpController.ensureAnalyticsLoaded()

    if (loaded && analytics != null) {
      this.patchIndicator(number, { analytics }, { rerender: true })
    }

    await this.analyticsPopUpController.renderForm()
    this.analyticsPopUpController.openModal()
  }

  /**
   * Колбек AnalyticsPopUp после save (п.18 §3.4).
   *
   * @param {number} rowNumber
   * @param {Object} analytics
   */
  async _onAnalyticsPopUpApply(rowNumber, analytics) {
    await this.applyAnalytics(rowNumber, analytics)
  }

  /**
   * Сохранение analytics из попапа в строку (п.18 §3.5; легаси save → checkIndicator + updateInputValidDateRange).
   * В модели — только поля, доступные показателю; дефолты analytics — `InputService.normalizeAnalytics`.
   *
   * @param {number} rowNumber
   * @param {Object} analytics
   */
  async applyAnalytics(rowNumber, analytics) {
    const patched = this.patchIndicator(
      rowNumber,
      { analytics },
      { rerender: true },
    )

    if (!patched) {
      return
    }

    await this.checkIndicator(rowNumber)

    const row = this.indicators.find((r) => r.number === rowNumber)

    if (
      row
      && row.indicatorId != null
      && String(row.indicatorId) !== ''
      && this.params
      && this.params.versionId != null
      && String(this.params.versionId) !== ''
    ) {
      await this.updateInputValidDateRange(rowNumber)
    }
  }

  /**
   * Попап «Добавить список» (легаси addListIndicators.openModal). ScenarioNodes — п.17.
   *
   * @param {'Input'|'Output'} _table
   */
  openIndicatorsList(_table) {
    void _table
    void this.addListIndicatorsController.openModal()
  }

  /**
   * Попап «Анализ списка» (легаси analysisPopUp.openModal).
   *
   * @param {'Input'|'Output'} _table
   */
  openIndicatorsAnalysis(_table) {
    void _table
    void this.analysisPopUpController.openModal()
  }

  /**
   * Кнопка fileRemove (п.15 §6.2, п.19 §8): confirm → `DeleteExcelDataSet` → сброс строки или dialog (легаси ~352–364, `index.removeFile`).
   *
   * @param {number} number
   */
  onFileRemove(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row || !this.service.resolveExcelRowState(row).hasExcel) {
      return
    }

    if (!this._showConfirmDialog) {
      void this._requestDeleteExcelDataSet(number)
      return
    }

    this._showConfirmDialog(this.validator.getFileRemoveConfirmMessage(), () => {
      void this._requestDeleteExcelDataSet(number)
    })
  }

  /**
   * DeleteExcelDataSet для строки (п.19 §8.1–8.2; легаси `removeFile` → `handleDeleteExcelDataSetResponse`).
   *
   * @param {number} number
   * @returns {Promise<void>}
   */
  async _requestDeleteExcelDataSet(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row || !this.service.resolveExcelRowState(row).hasExcel) {
      return
    }

    const excelGuid = row.ExcelGUID != null ? String(row.ExcelGUID) : ''

    try {
      const result = await this.service.deleteExcelDataSet(excelGuid, this.params)
      this._handleDeleteExcelDataSetResponse(number, result)
    } catch {
      this._showDeleteExcelDataSetError(InputValidator.COULD_NOT_GET_DELETE_EXCEL_DATA)
    }
  }

  /**
   * Ответ DeleteExcelDataSet (п.19 §8.2; легаси `handleDeleteExcelDataSetResponse`).
   *
   * @param {number} number
   * @param {{
   *   ok?: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   * }|null|undefined} result
   */
  _handleDeleteExcelDataSetResponse(number, result) {
    if (result?.ok) {
      this.removeExcelFromRow(number)
      return
    }

    if (result?.fault) {
      this._showDeleteExcelDataSetError(InputValidator.COULD_NOT_GET_DELETE_EXCEL_DATA)
      return
    }

    if (result?.moduleError) {
      this._showDeleteExcelDataSetError(InputValidator.COULD_NOT_DELETE_FILE)
      return
    }

    this._showDeleteExcelDataSetError(InputValidator.COULD_NOT_GET_DELETE_EXCEL_DATA)
  }

  /**
   * Диалог ошибки DeleteExcelDataSet (п.19 §8.2; легаси `common.showDialog`).
   *
   * @param {string} message
   */
  _showDeleteExcelDataSetError(message) {
    if (this._showDialog) {
      this._showDialog(message)
      return
    }

    this.setMessages([{ type: 'error', text: message }])
  }

  /**
   * Снять Excel со строки (п.13 §6.4, легаси DOM после успешного DeleteExcelDataSet). Вызывается из §8.2.
   *
   * @param {number} number
   * @returns {boolean}
   */
  removeExcelFromRow(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row || !this.service.resolveExcelRowState(row).hasExcel) {
      return false
    }

    return this.patchIndicator(number, this.service.buildExcelClearPatch(), { rerender: true })
  }

  async applyUploaded(indicators) {
    await this.applyLoadedIndicatorRows(indicators)
  }

  /**
   * Заменить список строк из внешнего источника (структура, copy, upload).
   * Та же цепочка, что `StressController.applyStructureRowsFromParams` (п.17 §5.3; легаси `renderInput`).
   * `getData()` после вызова — в формате для `StressService.buildStressModulePayload` (§5.4).
   *
   * @param {Array|null|undefined} rows
   * @returns {Promise<void>}
   */
  async applyLoadedIndicatorRows(rows) {
    await this.setIndicators(rows)
  }

  /**
   * Заменить список строк (из структуры, upload, очистка). `null` / не массив → `[]`, DOM очищается в view.
   *
   * @param {Array|null|undefined} rows
   */
  async setIndicators(rows) {
    const normalized = this._normalizeIndicatorRows(rows)
    this.indicators = await Promise.all(normalized.map((row) => this._prepareIndicatorRow(row)))
    this.syncIndicators()
    await this._checkIndicatorsWithoutStatus()
  }

  /**
   * @param {Array|null|undefined} rows
   * @returns {Array}
   */
  _normalizeIndicatorRows(rows) {
    const list = Array.isArray(rows) ? rows : []
    const normalized = []

    list.forEach((row) => {
      const number = this.getNumberRow(normalized)
      normalized.push(this._normalizeIndicatorRow(row, number))
    })

    return normalized
  }

  /**
   * Нормализация строки из структуры: key/name → indicatorId/indicatorName (как Output).
   *
   * @param {Object|null|undefined} row
   * @param {number} number — порядковый номер строки (легасi `renderInput` → `getNumberRow`).
   * @returns {Object}
   */
  _normalizeIndicatorRow(row, number) {
    const source = row && typeof row === 'object' ? row : {}

    const indicatorId = source.indicatorId != null ? source.indicatorId : (source.key != null ? source.key : null)
    const indicatorName =
      source.indicatorName != null ? source.indicatorName : (source.name != null ? source.name : null)
    const { distributionId, distributionName } = this.service.resolveDistributionFields(source)
    const historicalRangeFrom = this._resolveLoadedHistoricalBound(
      source.historicalRangeFrom,
      source.dateFrom,
    )
    const historicalRangeTo = this._resolveLoadedHistoricalBound(
      source.historicalRangeTo,
      source.dateTo,
    )

    return {
      ...source,
      number,
      indicatorId,
      indicatorName,
      key: indicatorId,
      name: indicatorName,
      distributionId,
      distributionName,
      historicalRangeFrom,
      historicalRangeTo,
    }
  }

  /**
   * @param {*} primary
   * @param {*} fallback
   * @returns {*|null}
   */
  _resolveLoadedHistoricalBound(primary, fallback) {
    if (primary != null && String(primary).trim() !== '') {
      return primary
    }

    if (fallback != null && String(fallback).trim() !== '') {
      return fallback
    }

    return null
  }

  /**
   * Нормализация полей модели строки после загрузки / merge (без DOM).
   *
   * @param {Object} row
   * @returns {Object}
   */
  async _prepareIndicatorRow(row) {
    const prepared = {
      ...row,
      distributionParams: this.service.normalizeDistributionParams(row.distributionParams),
    }

    if (prepared.indicatorId != null && String(prepared.indicatorId) !== '') {
      prepared.getParamFromRequest = false
      prepared.analytics = await this._resolveRowAnalyticsForLoad(prepared)
    }

    return prepared
  }

  /**
   * Analytics при загрузке строки из структуры: из JSON как в легаси `renderInput` (~105);
   * Dim по API — только если в структуре analytics нет (легаси `loadingAnalysts` при select).
   *
   * @param {Object} row
   * @returns {Promise<Object|null>}
   */
  async _resolveRowAnalyticsForLoad(row) {
    if (row.analytics != null) {
      return this.service.normalizeAnalytics(row.analytics)
    }

    return this.analyticsPopUpController.service.resolveRowAnalytics(
      row.indicatorId,
      'Input',
      null,
    )
  }

  getData() {
    return this.indicators
  }

  /**
   * @returns {import('./InputValidator.js').KeyedValidationResult}
   */
  validate() {
    return this.validator.validate(this.indicators, this.params)
  }
}
