import { ParamsView } from './ParamsView.js'
import { ParamsValidator } from './ParamsValidator.js'

/**
 * ParamsController — состояние params, запросы через ParamsService, обновление ParamsView.
 */
export class ParamsController {

  /**
   * @param {ParamsService} paramsService
   * @param {Function} onChangeCallback
   */
  constructor(paramsService, onChangeCallback) {
    this.service = paramsService
    this.onChangeCallback = onChangeCallback

    this.params = this.defaultParams()
    this.stressTestVersions = []
    this.structureRaw = null
    this.validator = new ParamsValidator()
    this.view = new ParamsView(this)
    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null
  }

  /**
   * Оверлей загрузки (легасi `common.waiter` / `STRESS_VERSIONS` в `getVersionsCombo`).
   *
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
   * @param {() => Promise<T>} fn
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
   * @returns {Object}
   */
  defaultParams() {
    return {
      startDate: null,
      endDate: null,
      versionId: null,
      stressTestVersionId: null,
      iterations: null,
      simulations: null,
      stressTestName: ''
    }
  }

  /**
   * @param {Object} params
   */
  setParams(params) {
    this.params = { ...this.defaultParams(), ...(params || {}) }

    if (this.onChangeCallback) {
      this.onChangeCallback(this.params)
    }
  }

  /**
   * @param {Object} partial
   * @param {{ silent?: boolean }} [options]
   */
  async patchParams(partial, options) {
    this.params = { ...this.params, ...(partial || {}) }

    if (!options?.silent && this.onChangeCallback) {
      await this.onChangeCallback(this.params)
    }
  }

  /** Один колбек координатору после пакетного обновления params (инициализация, структура). */
  async notifyParamsChanged() {
    if (this.onChangeCallback) {
      await this.onChangeCallback(this.params)
    }
  }

  bindView(root) {
    this.view.bind(root)
  }

  /**
   * Реакция на изменение поля с формы.
   *
   * @param {string} name
   * @param {string|Object} value
   */
  async onChangeParam(name, value) {
    switch (name) {
      case 'versionId':
        await this.onPrognozVersionChanged(value)
        break
      case 'iterations':
        this.patchParams({ iterations: value })
        break
      case 'simulations':
        this.patchParams({ simulations: value })
        break
      case 'stressTestName':
        this.patchParams({ stressTestName: value != null ? String(value) : '' })
        break
      default:
        break
    }
  }

  /**
   * Старт страницы: сначала сохранённая структура (getStructure "-1"), иначе дефолтный период.
   */
  async initOnPageLoad() {
    const savedLoaded = await this.tryLoadSavedUserStructure()

    if (savedLoaded) {
      await this._finishInitWithLoadedStructure()
      await this.notifyParamsChanged()
      return
    }

    const formValues = this.view.getBindFormValues()
    await this._initWithDefaultPeriod(formValues)
  }

  /**
   * Загрузка и разбор сохранённой структуры пользователя (легаси initVersion).
   *
   * @returns {Promise<boolean>}
   */
  async tryLoadSavedUserStructure() {
    const raw = await this.service.loadSavedUserStructure()

    if (raw == null || raw === 'error') {
      return false
    }

    if (raw.faultstring && String(raw.faultstring).length > 0) {
      return false
    }

    const resolved = await this._resolveLoadedStructure(raw)
    if (!resolved) {
      return false
    }

    // Строки Input/Output — в ответе getValidData (легаси initVersion: res после parse message).
    this.structureRaw = resolved.storage
    const source = resolved.source

    this.patchParams({
      startDate: this._normalizeStructureMonthDate(source.dateFrom),
      endDate: this._normalizeStructureMonthDate(source.dateTo),
      versionId: source.prognozVersion != null ? String(source.prognozVersion) : null,
      iterations: source.IterationCount != null ? String(source.IterationCount) : null,
      simulations:
        source.SimulationCount != null && String(source.SimulationCount) !== ''
          ? String(source.SimulationCount)
          : null,
      stressTestName: source.Name || '',
    }, { silent: true })

    this.syncPeriodDatesToView()

    return true
  }

  /**
   * После успешной загрузки "-1": комбо по периоду/версии, структура уже в structureRaw.
   */
  async _finishInitWithLoadedStructure() {
    if (this.checkDateParam()) {
      const versions = await this.reloadForecastVersions(this.params.startDate, this.params.endDate)
      const versionId = this.params.versionId
      let selectId = null

      if (versions.length > 0) {
        const hasPreferred =
          versionId != null && versions.some((item) => String(item.id) === String(versionId))
        selectId = hasPreferred ? String(versionId) : String(versions[0].id)
        this.view.setForecastVersionOptions(versions, selectId)
        await this.reloadStressTestVersions(selectId, { keepStructure: true })
      } else {
        this.view.setForecastVersionOptions(versions)
      }
    }

    await this.refreshIterationCountCombo({ silent: true })
    await this.refreshSimulationCountCombo({ silent: true })
    this.view.renderParams(this.params)
  }

  /**
   * Нет сохранённой структуры — дефолтный период с формы и первая версия из списка.
   *
   * @param {Object} formValues
   */
  async _initWithDefaultPeriod(formValues) {
    const { from, to } = this.view.getSelectedPeriodDates()

    this.patchParams(
      {
        ...formValues,
        startDate: this._normalizeDateParam(from),
        endDate: this._normalizeDateParam(to),
      },
      { silent: true },
    )

    await this.refreshIterationCountCombo({ silent: true })
    await this.refreshSimulationCountCombo({ silent: true })

    if (!this.checkDateParam()) {
      await this.notifyParamsChanged()
      return
    }

    const versions = await this.reloadForecastVersions(this.params.startDate, this.params.endDate)

    if (versions.length === 0) {
      this.view.setForecastVersionOptions(versions)
      await this.notifyParamsChanged()
      return
    }

    const firstId = String(versions[0].id)
    this.view.setForecastVersionOptions(versions, firstId)
    await this.reloadStressTestVersions(firstId)
  }

  /**
   * @param {Object} raw — ответ getStructure
   * @returns {Promise<{ storage: Object, source: Object }|null>}
   */
  async _resolveLoadedStructure(raw) {
    let validStructure = await this.service.loadValidStructure(raw)

    if (validStructure && (validStructure.status === 'ERROR' || (validStructure.faultstring && validStructure.faultstring.length > 0))) {
      validStructure = raw
    }

    let source = validStructure
    if (source && source.message) {
      try {
        source = JSON.parse(source.message)
      } catch {
        return null
      }
    } else if (raw.message) {
      try {
        source = JSON.parse(raw.message)
      } catch {
        return null
      }
    }

    if (!source || !source.dateFrom || !source.dateTo) {
      return null
    }

    const storage =
      validStructure && validStructure.message ? validStructure : raw

    return { storage, source }
  }

  /**
   * Смена даты «от» (легасi `initDateParam` onSelect from): сброс «до», без запроса версий.
   */
  async onDateParamFromSelected() {
    const startDate = this._normalizeDateParam(this.view.getSelectedPeriodDates().from)

    if (!startDate) {
      await this.patchParams({ startDate: null, endDate: null }, { silent: true })
      return
    }

    await this.patchParams({ startDate, endDate: null }, { silent: true })
  }

  /**
   * Смена даты «до» (легасi onSelect to + `getVersionsCombo`): перезагрузка комбо при полном периоде.
   */
  async onDateParamToSelected() {
    const { from, to } = this.view.getSelectedPeriodDates()
    const startDate = this._normalizeDateParam(from)
    const endDate = this._normalizeDateParam(to)

    if (!endDate) {
      await this.patchParams({ endDate: null }, { silent: true })
      return
    }

    if (!startDate || !endDate) {
      return
    }

    await this.patchParams({ startDate, endDate }, { silent: true })

    await this._withWaiter('STRESS_VERSIONS', async () => {
      await this.refreshPrognozVersionsCombo()
    })

    await this.notifyParamsChanged()
  }

  /**
   * Загрузить версии прогноза по периоду и обновить комбо (легасi `getVersionsCombo` из onSelect дат).
   * В легаси `selectId` не передаётся — всегда первый элемент списка и `select2:select`.
   */
  async refreshPrognozVersionsCombo() {
    const { from, to } = this.view.getSelectedPeriodDates()
    const startDate = this._normalizeDateParam(from)
    const endDate = this._normalizeDateParam(to)

    if (!startDate || !endDate) {
      return
    }

    await this.patchParams({ startDate, endDate }, { silent: true })

    const versions = await this.reloadForecastVersions(startDate, endDate)

    if (versions.length === 0) {
      this.view.setForecastVersionOptions(versions)
      await this.patchParams({ versionId: null, stressTestVersionId: null }, { silent: true })
      this.structureRaw = null
      this.stressTestVersions = []
      return
    }

    const selectId = String(versions[0].id)

    this.view.setForecastVersionOptions(versions, selectId)

    // Легасi: select2:select → GetStressTestVersions + checkIndicator по строкам; без getStructure / renderInput.
    await this.reloadStressTestVersions(selectId, { loadStructure: false })
  }

  /**
   * Смена версии прогноза: params.versionId и цепочка стресс-тестов + структура.
   * View передаёт только id (`onChangeParam('versionId')`), без вызовов API.
   *
   * @param {string|number|null} prognozVersionId
   * @returns {Promise<Array>}
   */
  async onPrognozVersionChanged(prognozVersionId) {
    const id =
      prognozVersionId != null && String(prognozVersionId) !== ''
        ? String(prognozVersionId)
        : null

    if (id == null) {
      await this.patchParams({ versionId: null, stressTestVersionId: null })
      this.structureRaw = null
      this.stressTestVersions = []
      return []
    }

    await this.patchParams({ versionId: id }, { silent: true })
    return await this.reloadStressTestVersions(id, { loadStructure: false })
  }

  /**
   * Сообщения по зоне Params
   *
   * @param {Array<{ type: string, text: string, meta?: Object }>} items
   */
  setMessages(items) {
    this.view.setMessages(Array.isArray(items) ? items : [])
  }

  getData() {
    return this.params
  }

  getStructureSource() {
    if (!this.structureRaw) return null
    let source = this.structureRaw
    if (source.message) {
      source = JSON.parse(source.message)
    }
    return source
  }

  /**
   * @returns {import('./ParamsValidator.js').ParamsValidationResult}
   */
  validate() {
    return this.validator.validate(this.params, this.view.getValidationSnapshot())
  }

  /**
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async reloadForecastVersions(startDate, endDate) {
    return await this.service.loadForecastVersions(startDate, endDate)
  }

  /**
   * Загрузить справочник итераций и обновить комбо на странице.
   *
   * @param {{ silent?: boolean }} [options]
   */
  async refreshIterationCountCombo(options) {
    const items = await this.service.loadIterationCounts()
    const selected = this.params.iterations
    this.view.setIterationCountOptions(items, selected != null ? selected : null)

    if (selected == null && items.length > 0) {
      this.patchParams({ iterations: String(items[0].id) }, options)
    }

    return items
  }

  /**
   * Заполнить комбо симуляций (статический список) и выставить значение в params.
   *
   * @param {{ silent?: boolean }} [options]
   */
  async refreshSimulationCountCombo(options) {
    const items = await this.service.loadSimulationCounts()
    const raw = this.params.simulations
    const selected = raw != null && String(raw) !== '' ? String(raw) : null

    this.view.setSimulationCountOptions(items, selected != null ? selected : null)

    if (selected == null && items.length > 0) {
      this.patchParams({ simulations: String(items[0].id) }, options)
    }

    return items
  }

  /**
   * @param {string} prognozVersionId
   * @param {{ keepStructure?: boolean, loadStructure?: boolean, preferredStressTestVersionId?: string|number }} [options]
   *   `loadStructure: false` — только комбо стресс-тестов (легаси `loadingSaveStressIdByPrognozVersionid` при смене версии прогноза).
   * @returns {Promise<Array>}
   */
  async reloadStressTestVersions(prognozVersionId, options) {
    const keepStructure = options?.keepStructure === true
    const loadStructure = options?.loadStructure !== false && !keepStructure

    this.stressTestVersions = await this.service.loadStressTestVersions(prognozVersionId)

    if (this.stressTestVersions.length === 0) {
      await this.patchParams(
        { stressTestVersionId: null, versionId: String(prognozVersionId) },
        { silent: keepStructure },
      )
      if (loadStructure) {
        this.structureRaw = null
      }
      return this.stressTestVersions
    }

    const preferred =
      options?.preferredStressTestVersionId ?? this.params.stressTestVersionId
    const stressTestVersionId = this._pickStressTestVersionId(preferred)

    if (keepStructure) {
      await this.patchParams(
        { stressTestVersionId, versionId: String(prognozVersionId) },
        { silent: true },
      )
      return this.stressTestVersions
    }

    if (!loadStructure) {
      await this.patchParams({
        stressTestVersionId,
        versionId: String(prognozVersionId),
      })
      return this.stressTestVersions
    }

    const structureRaw = await this.service.loadStructure(stressTestVersionId)
    const validStructure = await this.service.loadValidStructure(structureRaw)
    this.structureRaw =
      !validStructure || validStructure.status === 'ERROR' || validStructure.faultstring
        ? structureRaw
        : validStructure

    this.applyParamsFromStructureRaw({ silent: true })
    await this.patchParams({ stressTestVersionId, versionId: String(prognozVersionId) })

    return this.stressTestVersions
  }

  /**
   * @param {string|number|null|undefined} preferred
   * @returns {string}
   */
  _pickStressTestVersionId(preferred) {
    if (
      preferred != null &&
      String(preferred) !== '' &&
      this.stressTestVersions.some((item) => String(item.id) === String(preferred))
    ) {
      return String(preferred)
    }

    return String(this.stressTestVersions[0].id)
  }

  /**
   * Взять поля из загруженной структуры и отразить их в params и на форме.
   *
   * @param {{ silent?: boolean }} [options]
   */
  applyParamsFromStructureRaw(options) {
    let source = this.structureRaw
    if (source.message) {
      source = JSON.parse(source.message)
    }

    this.patchParams(
      {
        startDate: this._normalizeStructureMonthDate(source.dateFrom),
        endDate: this._normalizeStructureMonthDate(source.dateTo),
        versionId:
          source.prognozVersion != null ? String(source.prognozVersion) : this.params.versionId,
        iterations:
          source.IterationCount != null ? String(source.IterationCount) : this.params.iterations,
        simulations:
          source.SimulationCount != null && String(source.SimulationCount) !== ''
            ? String(source.SimulationCount)
            : this.params.simulations,
        stressTestName: source.Name || '',
      },
      options,
    )
    this.syncPeriodDatesToView()
    this.view.renderParams(this.params)
  }

  /**
   * Дата из структуры → YYYY-MM-01 (легаси initVersion: split/reverse + "-01").
   *
   * @param {string} value
   * @returns {string}
   */
  _normalizeStructureMonthDate(value) {
    const s = String(value).trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s
    }

    if (/^\d{2}\.\d{4}$/.test(s)) {
      return `${s.split('.').reverse().join('-')}-01`
    }

    if (/^01\.\d{2}\.\d{4}$/.test(s)) {
      const [dd, mo, y] = s.split('.').map(Number)
      const m = String(mo).padStart(2, '0')
      return `${y}-${m}-01`
    }

    return s
  }

  /** Передать даты из params в календари на странице. */
  syncPeriodDatesToView() {
    this.view.setPeriodDates(
      this._toPickerDateString(this.params.startDate),
      this._toPickerDateString(this.params.endDate),
    )
  }

  /** Строка YYYY-MM-01 для AirDatepicker. */
  _toPickerDateString(value) {
    const dt = new Date(this._parseMonthParamToTime(value))
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }

  /** Обе даты выбраны в календарях — можно запрашивать список версий (легасi `CheckDateParam`). */
  checkDateParam() {
    const { from, to } = this.view.getSelectedPeriodDates()

    if (from && to) {
      return true
    }

    const { startDate, endDate } = this.params

    return Boolean(startDate && endDate)
  }

  /** Date с пикера или строка с формы → YYYY-MM-01 в params. */
  _normalizeDateParam(value) {
    if (value == null) {
      return null
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null
      }

      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}-01`
    }

    const trimmed = String(value).trim()

    return trimmed !== '' ? trimmed : null
  }

  /** Сравнение дат в разных строковых форматах. */
  _parseMonthParamToTime(value) {
    const s = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, mo, dd] = s.split('-').map(Number)
      return new Date(y, mo - 1, dd).getTime()
    }
    if (/^01\.\d{2}\.\d{4}$/.test(s)) {
      const [dd, mo, y] = s.split('.').map(Number)
      return new Date(y, mo - 1, dd).getTime()
    }
    if (/^\d{2}\.\d{4}$/.test(s)) {
      const [mo, y] = s.split('.').map(Number)
      return new Date(y, mo - 1, 1).getTime()
    }
    return null
  }
}
