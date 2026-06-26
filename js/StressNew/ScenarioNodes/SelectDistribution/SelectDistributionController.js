import { SelectDistributionValidator } from './SelectDistributionValidator.js'
import { SelectDistributionView } from './SelectDistributionView.js'

/**
 * @typedef {Object} DistributionState
 * @property {Array} results — строки таблицы (fit / new)
 * @property {Array} unable_to_fit — не подошедшие распределения
 * @property {Array<number>} bin_centers — ось X базовой серии графика
 * @property {Array<number>} bin_heights — ось Y базовой серии графика
 */

/**
 * @typedef {Object} ChartPayloadRowContext
 * @property {number|null} excelType
 * @property {string} excelGuid — пустая строка, если Excel не задан (легаси `ExcelGUID !== ""`)
 */

/**
 * @typedef {Object} ChartSeriesSpec
 * @property {string} name — `dist_type`
 * @property {Array} points
 * @property {string} [color]
 */

/**
 * @typedef {Object} ChartPayload
 * @property {1|2} indicatorType
 * @property {Array<number>} binCenters
 * @property {Array<number>} binHeights
 * @property {ChartPayloadRowContext} rowContext
 * @property {ChartSeriesSpec[]} [checkedSeries] — линии отмеченных checkbox (§4.3)
 */

/**
 * Модалка подбора распределения/модели по строке Input.
 * Legacy: `InputSelectDistribution` + `StressChart` (график — методы view, не отдельный компонент).
 *
 * Слои (п.16): без `StressApi` — оркестрация, `service` / `validator`, делегирование в `view`.
 * `SelectDistributionService` создаётся в `InputController` и передаётся сюда.
 */
export class SelectDistributionController {

  /**
   * @param {import('./SelectDistributionService.js').SelectDistributionService} selectDistributionService
   * @param {() => Object|null} getParams
   * @param {() => Array} getDistributionOptions
   * @param {(data: Object) => void|Promise<void>} onApply
   */
  constructor(selectDistributionService, getParams, getDistributionOptions, onApply) {
    this.getParams = getParams
    this.getDistributionOptions = getDistributionOptions
    this.onApply = onApply

    this.service = selectDistributionService
    this.validator = new SelectDistributionValidator()
    this.view = new SelectDistributionView(this)

    /** @type {Object|null} */
    this.sessionContext = null

    /** @type {DistributionState} */
    this.distributionState = this.defaultDistributionState()

    /** @type {ChartSeriesSpec[]} — серии checkbox для `checkedSeries` в payload (§4.3) */
    this.chartCheckedSeries = []

    /** @type {((message: string, type?: string) => void)|null} */
    this._showDialog = null
    /** @type {((message: string, onConfirm: () => void) => void)|null} */
    this._showConfirmDialog = null
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
   * Confirm-диалог (легаси `common.showDialog` с колбеком; п.16 §4.4, §7.1).
   *
   * @param {((message: string, onConfirm: () => void) => void)|null} fn
   */
  setShowConfirmDialog(fn) {
    this._showConfirmDialog = typeof fn === 'function' ? fn : null
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
   * @param {string} message
   */
  _showErrorDialog(message) {
    if (message && this._showDialog) {
      this._showDialog(message)
    }
  }

  /**
   * Единое отображение ошибок API (п.16 §6.5; legacy showDialog).
   *
   * @param {{ message?: string, empty?: boolean, moduleError?: boolean }|null|undefined} result
   * @param {string|null} fallbackMessage
   */
  _showApiError(result, fallbackMessage) {
    if (result && result.empty) {
      this._showErrorDialog(SelectDistributionValidator.DATA_NOT_FOUND)
      return
    }

    if (result && result.moduleError) {
      this._showErrorDialog(`${SelectDistributionValidator.ERROR_COLON}${result.message || ''}`)
      return
    }

    this._showErrorDialog(result && result.message ? result.message : fallbackMessage)
  }

  /**
   * Пустое состояние модалки (легаси `distributionObj` в конструкторе `InputSelectDistribution`).
   *
   * @returns {DistributionState}
   */
  defaultDistributionState() {
    return {
      results: [],
      unable_to_fit: [],
      bin_centers: [],
      bin_heights: [],
    }
  }

  /**
   * Полный сброс in-memory состояния (закрытие модалки, смена `parameterType` — §4.8 / §4.9).
   */
  resetDistributionState() {
    this.distributionState = this.defaultDistributionState()
    this.chartCheckedSeries = []
  }

  /**
   * Очистка только списков таблицы; `bin_*` сохраняются для базовой серии графика (легаси `clearList`).
   */
  clearDistributionTableState() {
    this.distributionState.results = []
    this.distributionState.unable_to_fit = []
  }

  /**
   * Замена состояния из ответа GetDistributionData (легаси `handleGetDistributionDataResponse` → `JSON.parse`).
   *
   * @param {Object|null|undefined} apiMessage — распарсенный `x.message`
   */
  setDistributionStateFromApiResponse(apiMessage) {
    const data = apiMessage && typeof apiMessage === 'object' ? apiMessage : {}

    this.distributionState = {
      results: Array.isArray(data.results) ? data.results.slice() : [],
      unable_to_fit: Array.isArray(data.unable_to_fit) ? data.unable_to_fit.slice() : [],
      bin_centers: Array.isArray(data.bin_centers) ? data.bin_centers.slice() : [],
      bin_heights: Array.isArray(data.bin_heights) ? data.bin_heights.slice() : [],
    }

    this.chartCheckedSeries = []
    this._refreshChart()
  }

  /**
   * Merge ответа ChoiceDistribution в текущее состояние (легаси `handleChoiceDistributionResponse`).
   *
   * @param {Object|null|undefined} updateDate — распарсенный `x.message`
   */
  mergeChoiceDistributionResponse(updateDate) {
    if (!updateDate || typeof updateDate !== 'object') {
      return
    }

    if (Array.isArray(updateDate.bin_centers)) {
      this.distributionState.bin_centers = updateDate.bin_centers.slice()
    }

    if (Array.isArray(updateDate.bin_heights)) {
      this.distributionState.bin_heights = updateDate.bin_heights.slice()
    }

    if (Array.isArray(updateDate.unable_to_fit)) {
      this.distributionState.unable_to_fit = updateDate.unable_to_fit.slice()
    }

    if (Array.isArray(updateDate.results)) {
      updateDate.results.forEach((item) => {
        const existing = this.distributionState.results.find((el) => el.dist_type === item.dist_type)

        if (!existing) {
          return
        }

        if (item.info_criteria) {
          existing.info_criteria = { ...existing.info_criteria, ...item.info_criteria }
        }

        if (Object.prototype.hasOwnProperty.call(item, 'params')) {
          existing.params = item.params
        }

        if (Object.prototype.hasOwnProperty.call(item, 'points')) {
          existing.points = item.points
        }
      })
    }

    this._refreshChart()
  }

  /**
   * Строка `results` по имени распределения (легаси checkbox → `distributionObj.results.find`).
   *
   * @param {string} distType
   * @returns {Object|undefined}
   */
  findResultByDistType(distType) {
    return this.distributionState.results.find((item) => item.dist_type === distType)
  }

  /**
   * @param {Object} context — контекст строки Input (см. план §«open(sessionContext)»)
   * @returns {Promise<void>}
   */
  async open(context) {
    this.sessionContext = context
    this.view.openModal(context)
    await this.loadDistributionTable()
  }

  /**
   * GetDistributionData → таблица + график (п.16 §3.4; легаси `loadingData` + `handleGetDistributionDataResponse`).
   *
   * @returns {Promise<void>}
   */
  async loadDistributionTable() {
    const session = this.sessionContext

    if (!session) {
      return
    }

    this.view.showGridWaiter()

    try {
      const result = await this.service.fetchDistributionTable(session, this.getParams(), {
        indicatorType: session.indicatorType,
      })

      if (result.fault) {
        this._showApiError(result, SelectDistributionValidator.COULD_NOT_GET_DISTRIBUTION_DATA)
        return
      }

      if (!result.ok || !result.data) {
        this._showApiError(result, null)
        return
      }

      this.setDistributionStateFromApiResponse(result.data)

      const rows = this._buildTableDisplayRows()
      this.view.clearTableBody()
      this.view.renderTableRows(rows)
      this.view.setChooseButtonLabel(this._resolveChartIndicatorType())
    } finally {
      this.view.hideGridWaiter()
    }
  }

  /**
   * Строки таблицы для view: fit + unable_to_fit, сортировка LR, выбранное — вверх (легаси `handleGetDistributionDataResponse`).
   *
   * @returns {Array<Object>}
   */
  _buildTableDisplayRows() {
    const state = this.distributionState
    const session = this.sessionContext || {}
    /** @type {Array<Object>} */
    const rows = []

    state.results.forEach((item) => {
      rows.push({
        ...item,
        status: item.status || 'fit',
      })
    })

    state.unable_to_fit.forEach((item) => {
      rows.push({
        key: item.key,
        dist_type: item.dist_type,
        info_criteria: { AIC: 'x', HQIC: 'x', LR: 'x', SIC: 'x' },
        params: {},
        status: 'unable_to_fit',
        error: item.error,
      })
    })

    rows.sort((a, b) => {
      const lrA = Number.parseFloat(a.info_criteria?.LR)
      const lrB = Number.parseFloat(b.info_criteria?.LR)

      if (Number.isNaN(lrA) || Number.isNaN(lrB)) {
        return 0
      }

      return lrB - lrA
    })

    const distributionName = session.distributionName

    if (distributionName != null && String(distributionName) !== '') {
      const selectedIndex = rows.findIndex(
        (item) => item.dist_type.toLowerCase() === String(distributionName).toLowerCase(),
      )

      if (selectedIndex !== -1) {
        const selectedItem = rows.splice(selectedIndex, 1)[0]

        rows.unshift(selectedItem)
      }
    }

    return rows
  }

  /**
   * Закрыть модалку (легаси `toggleModal` при закрытии; полная очистка списка — §4.8 / §5.5).
   */
  closeModal() {
    this.view.closeModal()
  }

  /**
   * Сброс состояния после очистки DOM (легаси `toggleModal` при закрытии с непустой таблицей).
   */
  onModalClosed() {
    this.resetDistributionState()
  }

  /**
   * Кнопки модалки с `data-btn` (п.16 §1.1 → реализация по шагам §4–5).
   *
   * @param {string} action — значение атрибута `data-btn`
   */
  handleModalAction(action) {
    switch (action) {
      case 'chooseDistribution':
        this.handleChooseDistribution()
        break
      case 'checkDistribution':
        this.handleCheckDistribution()
        break
      case 'clearList':
        this.handleClearList()
        break
      case 'addAllDistributionToList':
        this.handleAddAllDistributionToList()
        break
      case 'addDistributionToList':
        this.handleAddDistributionToList()
        break
      default:
        break
    }
  }

  /**
   * Checkbox в строке таблицы (п.16 §4.3; легаси `renderRow` → `change`).
   *
   * @param {string} distType
   * @param {boolean} isChecked
   * @returns {string|null} цвет серии для подсветки строки таблицы
   */
  onDistributionCheckboxChange(distType, isChecked) {
    if (isChecked) {
      const spec = this.buildChartSeriesSpec(distType)

      if (!spec) {
        return null
      }

      const color = this.view.addChartSeries(spec)

      if (color) {
        this.registerCheckedChartSeries(distType, color)
      }

      return color
    }

    this.view.removeChartSeries(distType)
    this.unregisterCheckedChartSeries(distType)
    return null
  }

  /**
   * Поиск по таблице (п.16 §4.5; легаси `serachDistributionToList`).
   *
   * @param {string} query
   */
  onSearchDistributionInput(query) {
    const val = query != null ? String(query) : ''
    const rowNames = this.view.collectTableRowNames()
    const filtered = rowNames.filter((el) => el.name.toLowerCase().includes(val.toLowerCase()))
    const items = this._buildSearchDistributionItems(filtered)

    this.view.showSearchDistributionPopup(items)
  }

  /**
   * Строки для popup поиска из `distributionState` (легаси `CustomePopUp.init` → `searchDistribution`).
   *
   * @param {Array<{ name: string }>} matchedNames
   * @returns {Array<Object>}
   */
  _buildSearchDistributionItems(matchedNames) {
    /** @type {Array<Object>} */
    const items = []
    const state = this.distributionState

    matchedNames.forEach(({ name }) => {
      const lowerName = name.toLowerCase()

      const fromResults = state.results.find(
        (item) => String(item.dist_type).toLowerCase() === lowerName,
      )

      if (fromResults) {
        items.push(fromResults)
        return
      }

      const fromUnable = state.unable_to_fit.find(
        (item) => String(item.dist_type).toLowerCase() === lowerName,
      )

      if (fromUnable) {
        items.push({
          key: fromUnable.key,
          dist_type: fromUnable.dist_type,
          info_criteria: { AIC: 'x', HQIC: 'x', LR: 'x', SIC: 'x' },
          params: {},
          status: 'unable_to_fit',
          error: fromUnable.error,
        })
      }
    })

    return items
  }

  /**
   * Смена радио `parameterType` (легаси `changeType`) — §4.9.
   */
  onParameterTypeChange() {
    if (!this.sessionContext) {
      return
    }

    const indicatorType = this.view.getSelectedParameterType()

    this.sessionContext = {
      ...this.sessionContext,
      indicatorType,
    }

    this.resetDistributionState()
    this.view.clearTableBody()
    this.view.clearChart()
    this.view.setChooseButtonLabel(indicatorType)
    void this.loadDistributionTable()
  }

  /**
   * Выбрать отмеченное распределение/модель и передать в Input (п.16 §5.3; легаси `chooseDistribution`).
   */
  handleChooseDistribution() {
    const distType = this.view.getSelectedDistributionType()
    const validation = this.validator.validateChooseDistribution(distType)

    if (!validation.ok) {
      this._showErrorDialog(validation.message)
      return
    }

    const payload = this._buildApplyDistributionPayload(distType)

    if (!payload || !this.onApply) {
      return
    }

    const applied = this.onApply(payload)

    if (applied !== false) {
      this.closeModal()
    }
  }

  /**
   * Payload для `InputController.applyDistribution` (легаси `updateSelectInputIndicator`).
   *
   * @param {string} distType
   * @returns {Object|null}
   */
  _buildApplyDistributionPayload(distType) {
    const selected = this.findResultByDistType(distType)
    const session = this.sessionContext

    if (!selected || !session) {
      return null
    }

    const distributionOption = this._findDistributionOptionByName(distType)
    const distributionParams = this._mapSelectedDistributionParams(selected.params)
    const indicatorType = this.view.getSelectedParameterType()
    const payload = {
      number: session.rowNumber,
      distributionId: distributionOption ? distributionOption.id : selected.key,
      distributionName: distType,
      distributionParams,
      indicatorType: Number(indicatorType) === 2 ? 2 : 1,
    }

    if (selected.params !== null && selected.params !== undefined) {
      payload.getParamFromRequest = false
    }

    return payload
  }

  /**
   * @param {string} distType
   * @returns {{ id: *, name: string }|undefined}
   */
  _findDistributionOptionByName(distType) {
    return (this.getDistributionOptions() || []).find((item) => item.name === distType)
  }

  /**
   * Параметры из ответа Choice/GetDistributionData → формат строки Input.
   *
   * @param {Object|null|undefined} params
   * @returns {Array<{ name: string, value: * }>}
   */
  _mapSelectedDistributionParams(params) {
    if (params === null || params === undefined) {
      return []
    }

    return Object.keys(params).map((name) => ({
      name,
      value: params[name] !== null ? String(params[name]) : params[name],
    }))
  }

  /**
   * «Рассчитать» — ChoiceDistribution по строкам `needUpdate` (п.16 §5.1; легаси `checkDistribution`).
   *
   * @returns {Promise<void>}
   */
  async handleCheckDistribution() {
    if (!this.sessionContext) {
      this._showErrorDialog(SelectDistributionValidator.SOMETHING_WENT_WRONG)
      return
    }

    const indicatorType = this.view.getSelectedParameterType()

    this.sessionContext = {
      ...this.sessionContext,
      indicatorType,
    }

    this.view.showGridWaiter()

    try {
      const result = await this.service.choiceDistribution(this.sessionContext, this.getParams(), {
        indicatorType,
        dist_type: this._collectDistributionTypesToCalculate(),
      })

      if (result.fault) {
        this._showApiError(result, SelectDistributionValidator.COULD_NOT_GET_CHOICE_DISTRIBUTION)
        return
      }

      if (!result.ok) {
        this._showApiError(result, null)
        return
      }

      this.mergeChoiceDistributionResponse(result.data)
      this.view.updateCalculatedRows(this.distributionState.results, this.distributionState.unable_to_fit)
    } finally {
      this.view.hideGridWaiter()
    }
  }

  /**
   * `dist_type` для ChoiceDistribution: только новые строки, которым нужны параметры с сервера.
   * Legacy: `distributionObj.results.map(el => el.getParamFromRequest === true ? el.dist_type : null)`.
   *
   * @returns {string[]}
   */
  _collectDistributionTypesToCalculate() {
    return this.distributionState.results
      .filter((item) => item.getParamFromRequest === true && item.dist_type != null)
      .map((item) => String(item.dist_type))
  }

  /**
   * Очистить список распределений (п.16 §4.8; легаси `clearList`).
   */
  handleClearList() {
    const run = () => {
      this._deleteCurrentDistributionKeys()
      this._clearDistributionListLocal()
    }

    if (this._showConfirmDialog) {
      this._showConfirmDialog(SelectDistributionValidator.CONFIRM_DELETE_ALL_RECORDS, run)
      return
    }

    run()
  }

  /**
   * Легаси `clearList` отправлял `DeleteDistribution` для уже рассчитанных строк и сразу чистил UI.
   */
  _deleteCurrentDistributionKeys() {
    const params = this.getParams()
    const keys = []

    this.distributionState.results.forEach((item) => {
      if (item.key != null && item.getParamFromRequest !== true) {
        keys.push(item.key)
      }
    })

    this.distributionState.unable_to_fit.forEach((item) => {
      if (item.key != null) {
        keys.push(item.key)
      }
    })

    keys.forEach((key) => {
      void this.service.deleteDistribution(key, params).catch(() => {})
    })
  }

  /**
   * Локальная очистка таблицы и графика после `clearList`.
   */
  _clearDistributionListLocal() {
    this.clearDistributionTableState()
    this.chartCheckedSeries = []
    this.view.clearTableBody()
    this.view.clearChart()
  }

  /**
   * Добавить все распределения/модели из справочника, которых ещё нет в таблице (п.16 §4.4).
   * Legacy: `addAllDistributionToList` + `customePopUp.getUnselectedItems`.
   */
  handleAddAllDistributionToList() {
    const message = SelectDistributionValidator.CONFIRM_ADD_ALL_INDICATORS
    const run = () => {
      this._addAllDistributionToListConfirmed()
    }

    if (this._showConfirmDialog) {
      this._showConfirmDialog(message, run)
      return
    }

    run()
  }

  /**
   * @private
   */
  _addAllDistributionToListConfirmed() {
    if (!this._hasDistributionOptions()) {
      this._showErrorDialog(SelectDistributionValidator.DISTRIBUTION_LIST_EMPTY)
      return
    }

    const unselected = this._getUnselectedDistributionOptions()

    if (unselected.length === 0) {
      return
    }

    const startIdx = this.view.getTableRowCount()

    unselected.forEach((el, index) => {
      this._addNewDistributionOption(el, startIdx + index)
    })
  }

  /**
   * @returns {boolean}
   */
  _hasDistributionOptions() {
    const options = this.getDistributionOptions()

    return Array.isArray(options) && options.length > 0
  }

  /**
   * @returns {Array<{ id: *, name: string, distributionType?: 1|2 }>}
   */
  _getUnselectedDistributionOptions() {
    const indicatorType = this.view.getSelectedParameterType()
    const existingNames = this._collectTableDistributionNames()

    return (this.getDistributionOptions() || []).filter(
      (item) =>
        (item.distributionType === 2 ? 2 : 1) === indicatorType &&
        !existingNames.has(item.name),
    )
  }

  /**
   * @param {{ id: *, name: string }} option
   * @param {number} index
   */
  _addNewDistributionOption(option, index) {
    const item = {
      key: option.id,
      dist_type: option.name,
      info_criteria: { AIC: '-', HQIC: '-', LR: '-', SIC: '-' },
      params: { p: 1 },
      getParamFromRequest: true,
    }

    this.distributionState.results.push(item)
    this.view.renderTableRow(item, index, 'new')
  }

  /**
   * Имена распределений, уже присутствующих в таблице (легаси `dateFormat` в `addAllDistributionToList`).
   *
   * @returns {Set<string>}
   */
  _collectTableDistributionNames() {
    const names = new Set()
    const state = this.distributionState

    state.results.forEach((item) => {
      if (item.dist_type != null) {
        names.add(String(item.dist_type))
      }
    })

    state.unable_to_fit.forEach((item) => {
      if (item.dist_type != null) {
        names.add(String(item.dist_type))
      }
    })

    return names
  }

  /**
   * Удаление строки таблицы (п.16 §4.7; легаси `.removeRow` click + `DeleteDistribution`).
   *
   * @param {string} distType
   * @param {'fit'|'unable_to_fit'|'new'} status
   */
  onRemoveDistributionRow(distType, status) {
    if (!distType) {
      return
    }

    if (status === 'new') {
      this._removeNewDistributionRow(distType)
      return
    }

    if (status === 'fit') {
      const message = SelectDistributionValidator.CONFIRM_DELETE_CALC_INDICATOR
      const run = () => {
        void this._removeDistributionRowViaApi(distType, 'fit')
      }

      if (this._showConfirmDialog) {
        this._showConfirmDialog(message, run)
        return
      }

      run()
      return
    }

    if (status === 'unable_to_fit') {
      void this._removeDistributionRowViaApi(distType, 'unable_to_fit')
    }
  }

  /**
   * Строка `new` — только локально, без API (легаси `status === "new"`).
   *
   * @param {string} distType
   */
  _removeNewDistributionRow(distType) {
    const index = this.distributionState.results.findIndex((item) => item.dist_type === distType)

    if (index === -1) {
      return
    }

    this.distributionState.results.splice(index, 1)
    this._finalizeDistributionRowRemoval(distType)
  }

  /**
   * @param {string} distType
   * @param {'fit'|'unable_to_fit'} status
   */
  async _removeDistributionRowViaApi(distType, status) {
    const session = this.sessionContext

    if (!session || session.indicatorId == null || String(session.indicatorId) === '') {
      return
    }

    let distributionKey = null

    if (status === 'fit') {
      const row = this.findResultByDistType(distType)
      distributionKey = row != null ? row.key : null
    } else {
      const row = this.distributionState.unable_to_fit.find((item) => item.dist_type === distType)
      distributionKey = row != null ? row.key : null
    }

    if (distributionKey == null) {
      return
    }

    this.view.showGridWaiter()

    try {
      const result = await this.service.deleteDistribution(distributionKey, this.getParams())

      if (!result.ok) {
        this._showApiError(result, null)
        return
      }

      if (status === 'fit') {
        const index = this.distributionState.results.findIndex((item) => item.dist_type === distType)

        if (index !== -1) {
          this.distributionState.results.splice(index, 1)
        }
      } else {
        const index = this.distributionState.unable_to_fit.findIndex(
          (item) => item.dist_type === distType,
        )

        if (index !== -1) {
          this.distributionState.unable_to_fit.splice(index, 1)
        }
      }

      this._finalizeDistributionRowRemoval(distType)
    } finally {
      this.view.hideGridWaiter()
    }
  }

  /**
   * DOM + серии графика после успешного удаления (легаси `handleRemoveDistributionResponse`).
   *
   * @param {string} distType
   */
  _finalizeDistributionRowRemoval(distType) {
    this.unregisterCheckedChartSeries(distType)
    this.view.removeChartSeries(distType)
    this.view.removeTableRowByDistType(distType)
  }

  /**
   * Открыть popup добавления одного распределения/модели (п.16 §4.6, минимальный CustomePopUp).
   */
  handleAddDistributionToList() {
    if (!this._hasDistributionOptions()) {
      this._showErrorDialog(SelectDistributionValidator.DISTRIBUTION_LIST_EMPTY)
      return
    }

    this.view.showAddDistributionPopup(this._getUnselectedDistributionOptions())
  }

  /**
   * @param {string} name
   */
  onAddDistributionPopupSelect(name) {
    const option = this._getUnselectedDistributionOptions().find((item) => item.name === name)

    if (!option) {
      return
    }

    this._addNewDistributionOption(option, this.view.getTableRowCount())
  }

  /**
   * Тип показателя для графика из `sessionContext` (легаси `loadingData(indicatorType)`).
   *
   * @returns {1|2}
   */
  _resolveChartIndicatorType() {
    const session = this.sessionContext

    return session && Number(session.indicatorType) === 2 ? 2 : 1
  }

  /**
   * Контекст строки Input для подписей графика type 2 (легаси `inputDataRows` → ExcelType / ExcelGUID).
   *
   * @returns {ChartPayloadRowContext}
   */
  _buildChartRowContext() {
    const session = this.sessionContext || {}
    const excelGuid = session.excelGuid

    return {
      excelType: session.excelType != null ? Number(session.excelType) : null,
      excelGuid: excelGuid != null && String(excelGuid) !== '' ? String(excelGuid) : '',
    }
  }

  /**
   * Базовая серия рисуется только при непустой таблице (легаси `dist.results.length > 0`).
   *
   * @returns {boolean}
   */
  _hasChartBaseData() {
    return this.distributionState.results.length > 0
  }

  /**
   * Spec линии распределения для `view.addChartSeries` (легаси checkbox → `addSeries(name, value, …)`).
   *
   * @param {string} distType
   * @returns {ChartSeriesSpec|null}
   */
  buildChartSeriesSpec(distType) {
    const result = this.findResultByDistType(distType)

    if (!result || !Array.isArray(result.points) || result.points.length === 0) {
      return null
    }

    return {
      name: distType,
      points: result.points,
    }
  }

  /**
   * Запомнить отмеченную checkbox серию (§4.3 → `checkedSeries` в payload).
   *
   * @param {string} distType
   * @param {string} [color]
   * @returns {ChartSeriesSpec|null}
   */
  registerCheckedChartSeries(distType, color) {
    const spec = this.buildChartSeriesSpec(distType)

    if (!spec) {
      return null
    }

    if (color) {
      spec.color = color
    }

    const index = this.chartCheckedSeries.findIndex((item) => item.name === distType)

    if (index === -1) {
      this.chartCheckedSeries.push(spec)
    } else {
      this.chartCheckedSeries[index] = spec
    }

    return spec
  }

  /**
   * Снять серию с checkbox (§4.3).
   *
   * @param {string} distType
   */
  unregisterCheckedChartSeries(distType) {
    this.chartCheckedSeries = this.chartCheckedSeries.filter((item) => item.name !== distType)
  }

  /**
   * Сборка payload для графика — **единственное** место (п.16 §2.2, контракт `chartPayload`).
   *
   * @returns {ChartPayload}
   */
  buildChartPayload() {
    const state = this.distributionState
    const hasBaseData = this._hasChartBaseData()

    /** @type {ChartPayload} */
    const payload = {
      indicatorType: this._resolveChartIndicatorType(),
      binCenters: hasBaseData ? state.bin_centers.slice() : [],
      binHeights: hasBaseData ? state.bin_heights.slice() : [],
      rowContext: this._buildChartRowContext(),
    }

    if (this.chartCheckedSeries.length > 0) {
      payload.checkedSeries = this.chartCheckedSeries.map((item) => ({
        name: item.name,
        points: item.points,
        ...(item.color ? { color: item.color } : {}),
      }))
    }

    return payload
  }

  /**
   * Перерисовать базовую серию графика из `buildChartPayload()` (п.16 §2.3; легаси `chart.loadingData`).
   */
  _refreshChart() {
    this.view.updateChart(this.buildChartPayload())
  }

  /**
   * ChoiceDistribution / choose из таблицы.
   *
   * @param {string|number} idIndicator
   * @param {*} selectedDistribution
   */
  confirmSelection(idIndicator, selectedDistribution) {
    const v = this.validator.validate(selectedDistribution)

    if (!v.isValid) {
      return
    }

    if (this.onApply) {
      this.onApply({ idIndicator, selectedDistribution })
    }
  }
}
