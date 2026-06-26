import { OutputView } from './OutputView.js'
import { OutputValidator } from './OutputValidator.js'
import { AnalyticsPopUpController } from '../ScenarioNodes/AnalyticsPopUp/AnalyticsPopUpController.js'
import { AnalyticsPopUpService } from '../ScenarioNodes/AnalyticsPopUp/AnalyticsPopUpService.js'
import { AnalysisPopUpController } from '../ScenarioNodes/AnalysisPopUp/AnalysisPopUpController.js'
import { AnalysisPopUpService } from '../ScenarioNodes/AnalysisPopUp/AnalysisPopUpService.js'
import { AddListIndicatorsController } from '../ScenarioNodes/AddListIndicators/AddListIndicatorsController.js'
import { AddListIndicatorsService } from '../ScenarioNodes/AddListIndicators/AddListIndicatorsService.js'
import { FilterPopUpController } from '../ScenarioNodes/FilterPopUp/FilterPopUpController.js'
import { FilterPopUpService } from '../ScenarioNodes/FilterPopUp/FilterPopUpService.js'
/**
 * OutputController — состояние строк output, запросы через OutputService, обновление OutputView.
 */
export class OutputController {

  /**
   * @param {OutputService} outputService
   * @param {Function} onChangeCallback
   */
  constructor(outputService, onChangeCallback) {
    this.service = outputService
    this.onChangeCallback = onChangeCallback

    this.indicators = []
    this.params = null
    /** @type {Array<{ id: *, name: * }>} */
    this.outputIndicatorOptions = []
    /** @type {Array<{ id: *, name: * }>} */
    this.productOptions = []

    this.validator = new OutputValidator()
    this.view = new OutputView(this)
    /** @type {((message: string, onConfirm: () => void) => void)|null} */
    this._showConfirmDialog = null
    /** @type {((message: string, type?: string) => void)|null} */
    this._showDialog = null
    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null
    this._popUpViewsBound = false

    this.analyticsPopUpController = this._createAnalyticsPopUpController(outputService.apiClient)
    this.analysisPopUpController = this._createAnalysisPopUpController(outputService.apiClient)
    this.addListIndicatorsController = this._createAddListIndicatorsController(outputService.apiClient)
    this.filterPopUpController = this._createFilterPopUpController(outputService.apiClient)
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {AnalyticsPopUpController}
   */
  _createAnalyticsPopUpController(apiClient) {
    const controller = new AnalyticsPopUpController(
      new AnalyticsPopUpService(apiClient),
      'Output',
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
      'Output',
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
      'Output',
      () => this.params,
      (rows) => this._onAddListIndicatorsCopy(rows),
    )
  }

  /**
   * @param {import('../StressApi.js').StressApi} apiClient
   * @returns {FilterPopUpController}
   */
  _createFilterPopUpController(apiClient) {
    return new FilterPopUpController(
      new FilterPopUpService(apiClient),
      'Output',
      () => this.indicators,
      () => this.productOptions,
      () => null,
      () => this.outputIndicatorOptions,
      (ctx) => this._onFilterPopUpIndicatorOptions(ctx),
      (ctx) => {},
      (ctx) => this._onFilterPopUpHeaderFilter(ctx),
    )
  }

  /**
   * Колбек фильтра показателя по блоку (C.3 §5; реализация — в OutputView).
   *
   * @param {import('../ScenarioNodes/FilterPopUp/FilterPopUpController.js').FilterPopUpIndicatorSelectContext} ctx
   * @returns {Promise<void>}
   */
  async _onFilterPopUpIndicatorOptions(ctx) {
    this.view.refreshRowIndicatorSelect2(ctx.rowNumber, ctx.options)
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
   * Фильтр шапки списка Output (C.3 §3.2; легасi `initFilterOutputIndicator`).
   *
   * @param {'Number'|'Name'|'Product'} headerColumn
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   */
  openHeaderFilter(headerColumn, $anchor, $nav) {
    this.filterPopUpController.openHeaderFilter(headerColumn, $anchor, $nav)
  }

  /**
   * Фильтр показателя по блоку модели в строке Output (C.3 §5.1; легасi `filteringIndicator` click).
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
   * Колбек copy из попапа «Добавить список» (п.17 §3.5, §5.3).
   *
   * @param {Array} rows
   * @returns {Promise<void>}
   */
  async _onAddListIndicatorsCopy(rows) {
    await this.applyLoadedIndicatorRows(rows)
  }

  /**
   * Confirm-диалог (легаси `common.showDialog`, п.15 §6.5). Проброс из `StressController.setShowConfirmDialog`.
   *
   * @param {((message: string, onConfirm: () => void) => void)|null} fn
   */
  setShowConfirmDialog(fn) {
    this._showConfirmDialog = typeof fn === 'function' ? fn : null
    this.analysisPopUpController.setShowConfirmDialog(this._showConfirmDialog)
  }

  /**
   * @param {((message: string, type?: string) => void)|null} fn
   */
  setShowDialog(fn) {
    this._showDialog = typeof fn === 'function' ? fn : null
  }

  /**
   * Оверлей загрузки (легаси `common.waiter`). Проброс из `StressController._wireWaiterUi`.
   *
   * @param {((token: string) => void)|null} showFn
   * @param {((token: string) => void)|null} hideFn
   */
  setWaiter(showFn, hideFn) {
    this._showWaiter = typeof showFn === 'function' ? showFn : null
    this._hideWaiter = typeof hideFn === 'function' ? hideFn : null
    this.addListIndicatorsController.setWaiter(showFn, hideFn)
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
   * Загрузка справочников при bind view (аналог InputController.onBind).
   */
  async onBind() {
    const { indicators, products } = await this.service.loadOutputDimLists()
    this.outputIndicatorOptions = indicators
    this.productOptions = products
    this.view.setIndicatorSelect2Options(this.outputIndicatorOptions)
  }

  getOutputIndicatorOptions() {
    return this.outputIndicatorOptions
  }

  getProductOptions() {
    return this.productOptions
  }

  bindView(root) {
    this.view.bind(root)
    this._bindPopUpViewsOnce(root)
  }

  /**
   * DOM попапов analytics / analysis / addListIndicators / filterPopUp — при первом `bindView` (п.18 §6.1, п.17 §5.1).
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
    // C.3 §0.3 — легасi CustomePopUp (filtering*)
    this.filterPopUpController.view.bind(scope)
    this._popUpViewsBound = true
  }

  setMessages(items) {
    this.view.setMessages(Array.isArray(items) ? items : [])
  }

  async setParams(params) {
    const prevParams = this.params
    const prevVersionId = prevParams != null ? prevParams.versionId : null

    this.params = params

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
   * Проверка строки через `CheckSingleStructure` (легаси `checkIndicator`).
   *
   * @param {number} number
   * @returns {Promise<boolean>}
   */
  async checkIndicator(number) {
    return this._withWaiter('CheckIndicator', () => this._checkIndicatorCore(number))
  }

  /**
   * @param {number} number
   * @returns {Promise<boolean>}
   */
  async _checkIndicatorCore(number) {
    const row = this.indicators.find((r) => r.number === number)

    if (!row) {
      return false
    }

    const result = await this.service.checkIndicatorStructure(row, this.params)

    if (result.missingParams) {
      this.setMessages([
        { type: 'error', text: OutputValidator.COULD_NOT_DETERMINE_REQUIRED_FIELDS },
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
   * Перепроверка всех строк при смене версии прогноза (легаси `initPrognozVersionCombo`).
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
   * Кнопка analytics в строке (п.18 §2.1; легаси `stress-output-rows` click analytics).
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
   * Сохранение analytics из попапа в строку (п.18 §3.5; легаси save → syncProduct + checkIndicator).
   * Формат в модели — как в `_mapOutputRowToModule` (п.18 §6.3).
   *
   * @param {number} rowNumber
   * @param {Object} analytics
   */
  async applyAnalytics(rowNumber, analytics) {
    const patched = this.patchIndicator(rowNumber, { analytics }, { rerender: true })

    if (!patched) {
      return
    }

    await this.checkIndicator(rowNumber)
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
   * Кнопка «Редактировать» — режим editor (п. 5.1, легаси editeRow ~187–192).
   *
   * @param {number} number
   * @returns {boolean}
   */
  onEditRow(number) {
    this.patchIndicator(number, { getParamFromRequest: true }, { rerender: false })
    return this.view.setRowEditMode(number, true)
  }

  /**
   * Кнопка cancel (tooltip «Сохранить») — режим view (п. 5.2, легаси ~181–186). Без валидации.
   *
   * @param {number} number
   * @returns {boolean}
   */
  onCancelRow(number) {
    this.patchIndicator(number, { getParamFromRequest: false }, { rerender: false })
    return this.view.setRowEditMode(number, false)
  }

  /**
   * Кнопка removeRow (п.15 §6.4): confirm, затем удаление (легаси `stress-output-rows` ~173).
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
   * @param {number} [scrollToNumber]
   */
  syncIndicators(scrollToNumber) {
    const viewRows = this.indicators.map((row, index) => this._toViewRow(row, index))
    this.view.renderIndicators(viewRows, scrollToNumber)

    if (this.onChangeCallback) {
      this.onChangeCallback(this.indicators)
    }
  }

  /**
   * DTO для отрисовки строки (п. 3.1+): view получает готовые поля, без логики модели.
   *
   * @param {Object} row
   * @param {number} index
   * @returns {{ number: number, indicatorId: *, indicatorName: string, productLabel: string, rowErrorState: { applyErrorClass: boolean, hasError: boolean } }}
   */
  _toViewRow(row, index) {
    const indicatorId = row.indicatorId != null ? row.indicatorId : row.key
    const indicatorName =
      row.indicatorName != null
        ? String(row.indicatorName)
        : row.name != null
          ? String(row.name)
          : ''

    return {
      number: row.number != null ? row.number : index + 1,
      indicatorId,
      indicatorName,
      productLabel: this._resolveProductLabel(row.analytics),
      rowErrorState: this.service.resolveRowErrorState(row),
      analyticsButton: this.service.resolveAnalyticsButtonState(row.analytics),
      ...this.service.resolveRowViewMode(row),
    }
  }

  /**
   * Подпись Product по analytics.product и справочнику productOptions (легаси syncProductFieldFromAnalytics; в т.ч. -1 / 0 / «Все»).
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
      'Output',
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
      await this.checkIndicator(number)
    }
  }

  /**
   * @param {Object} updatedIndicator
   */
  applyIndicator(updatedIndicator) {
    if (!updatedIndicator) {
      return
    }

    const normalized = this._normalizeIndicatorRow(updatedIndicator)
    let number = normalized.number
    if (number == null && normalized.id != null) {
      const row = this.indicators.find((r) => r.id === normalized.id)
      number = row != null ? row.number : null
    }

    if (number == null) {
      return
    }

    this.patchIndicator(number, normalized, { rerender: true })
  }

  /**
   * Точечное обновление полей строки по number.
   * По умолчанию только модель + колбек; `rerender: true` — полный render.
   *
   * @param {number} number
   * @param {Object} partial
   * @param {{ rerender?: boolean }} [options]
   * @returns {boolean}
   */
  patchIndicator(number, partial, options) {
    const idx = this.indicators.findIndex((row) => row.number === number)
    if (idx === -1) {
      return false
    }

    const merged = { ...this.indicators[idx], ...(partial || {}) }
    this.indicators[idx] = this._normalizeIndicatorRow(merged, number)

    if (options && options.rerender) {
      this.syncIndicators()
    } else if (this.onChangeCallback) {
      this.onChangeCallback(this.indicators)
    }

    return true
  }

  /**
   * @param {Array} rows
   */
  async setIndicators(rows) {
    const normalized = this._normalizeIndicatorRows(rows)
    this.indicators = await Promise.all(normalized.map((row) => this._prepareIndicatorRow(row)))
    this.syncIndicators()
    await this._checkIndicatorsWithoutStatus()
  }

  /**
   * @param {Array} indicators
   */
  async applyUploaded(indicators) {
    await this.applyLoadedIndicatorRows(indicators)
  }

  /**
   * Заменить список строк из внешнего источника (структура, copy, upload).
   * Та же цепочка, что `StressController.applyStructureRowsFromParams` (п.17 §5.3; легаси `renderOutput`).
   * `getData()` после вызова — в формате для `StressService.buildStressModulePayload` (§5.4).
   *
   * @param {Array|null|undefined} rows
   * @returns {Promise<void>}
   */
  async applyLoadedIndicatorRows(rows) {
    await this.setIndicators(rows)
  }

  getData() {
    return this.indicators
  }

  /**
   * Добавить строку output (п. 6.3, шапка `addOutputIndicator`). Guard — `OutputValidator.canAddRow` (легаси `addNewOutput`).
   * `CheckSingleStructure` — только после выбора показателя (`onIndicatorSelect`), не при добавлении пустой строки.
   */
  addNewIndicator() {
    const check = this.validator.canAddRow(this.params)

    if (!check.ok) {
      if (check.message) {
        this.setMessages([{ type: 'error', text: check.message }])
      }

      return
    }

    const number = this._getNextRowNumber(this.indicators)
    this.indicators.push(this._createEmptyIndicator(number))
    this.syncIndicators(number)
  }

  /**
   * Кнопка «Очистить список» (п.15 §6.4): confirm, затем очистка (легаси `clearOutputList` ~395–400).
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
   * Очистить все строки output (`setIndicators([])`).
   */
  clearAllIndicators() {
    void this.setIndicators([])
  }

  /**
   * @param {Array<{ number?: number }>} rows
   * @returns {number}
   */
  _getNextRowNumber(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return 1
    }

    const numbers = rows
      .map((row) => row && row.number)
      .filter((n) => typeof n === 'number')

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  }

  /**
   * @param {number} number
   * @returns {{ number: number, indicatorId: null, indicatorName: null, analytics: null, status: -1 }}
   */
  _createEmptyIndicator(number) {
    return {
      number,
      indicatorId: null,
      indicatorName: null,
      analytics: null,
      status: -1,
      getParamFromRequest: true,
    }
  }

  /**
   * @param {Array|null|undefined} rows
   * @returns {Array}
   */
  _normalizeIndicatorRows(rows) {
    const list = Array.isArray(rows) ? rows : []
    const normalized = []

    list.forEach((row) => {
      const number = this._getNextRowNumber(normalized)
      normalized.push(this._normalizeIndicatorRow(row, number))
    })

    return normalized
  }

  /**
   * Нормализация строки Output: key/name -> indicatorId/indicatorName.
   *
   * @param {Object|null|undefined} row
   * @param {number} number — порядковый номер строки (легасi `renderOutput` → `getNumberRow`).
   * @returns {Object}
   */
  async _prepareIndicatorRow(row) {
    const prepared = { ...row }

    if (prepared.indicatorId != null && String(prepared.indicatorId) !== '') {
      prepared.getParamFromRequest = false
      prepared.analytics = await this._resolveRowAnalyticsForLoad(prepared)
    }

    return prepared
  }

  /**
   * Analytics при загрузке из структуры — как легаси `renderOutput`; Dim только если analytics нет.
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
      'Output',
      null,
    )
  }

  _normalizeIndicatorRow(row, number) {
    const source = row && typeof row === 'object' ? row : {}

    const indicatorId = source.indicatorId != null ? source.indicatorId : (source.key != null ? source.key : null)
    const indicatorName =
      source.indicatorName != null ? source.indicatorName : (source.name != null ? source.name : null)
    const analytics =
      source.analytics && typeof source.analytics === 'object' ? source.analytics : null
    const status = Object.prototype.hasOwnProperty.call(source, 'status') ? source.status : undefined

    return {
      ...source,
      number: number != null ? number : source.number,
      indicatorId,
      indicatorName,
      key: indicatorId,
      name: indicatorName,
      analytics,
      status,
    }
  }

  /**
   * @param {{ mode?: 'runTest'|'save' }} [options]
   * @returns {import('./OutputValidator.js').KeyedValidationResult}
   */
  validate(options) {
    return this.validator.validate(this.indicators, this.params, options)
  }
}
