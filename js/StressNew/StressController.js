import { StressApi } from './StressApi.js'
import { StressService } from './StressService.js'
import { StressValidator } from './StressValidator.js'
import { ParamsController } from './ParamsComponent/ParamsController.js'
import { ParamsService } from './ParamsComponent/ParamsService.js'
import { InputController } from './InputComponent/InputController.js'
import { InputService } from './InputComponent/InputService.js'
import { OutputController } from './OutputComponent/OutputController.js'
import { OutputService } from './OutputComponent/OutputService.js'
import { StressView } from './StressView.js'
import { StressScenarioResult } from './StressScenarioResult.js'

/**
 * Координатор StressNew. Не импортирует `ScenarioNodes/` (п.19 §7.5):
 * UploadFilePopUp / ArrayDataPopUp и остальные попапы — только в `InputController` / `OutputController`.
 */
class StressController {

  /** Легаси `StressModes.RUN_TEST` — режим запуска теста (п.15 §5.1). */
  static MODE_RUN_TEST = 'runTest'

  /** Легаси `StressModes.SAVE` — режим сохранения конфигурации (п.15 §5.1). */
  static MODE_SAVE = 'save'

  /**
   * @param {Object} bi
   * @param {Object} foreKeys — ключи модулей
   */
  constructor(bi, foreKeys) {
    if (!bi) {
      throw new Error('StressController: необходимо передать bi')
    }

    const foreKeysResolved = foreKeys || {}
    this._scenarioUi = null
    this._showDialog = null
    this.apiClient = new StressApi(bi, foreKeysResolved)
    this.stressService = new StressService(this.apiClient)
    this.stressValidator = new StressValidator(this.apiClient)

    this.paramsController = new ParamsController(new ParamsService(this.apiClient), (params) => {
      return this.onParamsChanged(params)
    })

    this.inputController = new InputController(new InputService(this.apiClient), (indicators) => {
      this.onInputChanged(indicators)
    })

    this.outputController = new OutputController(new OutputService(this.apiClient), (indicators) => {
      this.onOutputChanged(indicators)
    })

    this.view = new StressView(this)
    this._wireWaiterUi()

    this.bindParams(document)
    this.bindInput(document)
    this.bindOutput(document)
  }

  /**
   * Справочники Input/Output и загрузка структуры при старте (легаси initVersion).
   * Вызывать после setUserId / setUserName и bindView.
   *
   * @returns {Promise<void>}
   */
  async initVersion() {
    this.view.showWaiter('initVersion')

    try {
      await this.inputController.onBind()
      await this.outputController.onBind()

      await this.paramsController.initOnPageLoad()
      await this.applyStructureRowsFromParams()
    } finally {
      this.view.hideWaiter('initVersion')
    }
  }

  /**
   * Один раз при старте: Input/Output из `structureRaw` (легаси `renderInput` / `renderOutput` после initVersion).
   * При смене версии прогноза строки не перезагружаются — только `recheckAllIndicators` в `setParams`.
   *
   * @returns {Promise<void>}
   */
  async applyStructureRowsFromParams() {
    const source = this.paramsController.getStructureSource()

    if (!source) {
      await Promise.all([
        this.inputController.applyLoadedIndicatorRows([]),
        this.outputController.applyLoadedIndicatorRows([]),
      ])
      return
    }

    const inputRows = Array.isArray(source.Input)
      ? source.Input
      : Array.isArray(source.input)
        ? source.input
        : []
    const outputRows = Array.isArray(source.Output)
      ? source.Output
      : Array.isArray(source.output)
        ? source.output
        : []

    await Promise.all([
      this.inputController.applyLoadedIndicatorRows(inputRows),
      this.outputController.applyLoadedIndicatorRows(outputRows),
    ])
  }

  /**
   * Кнопки шапки и прочий DOM уровня страницы (как bindParams / bindInput).
   *
   * @param {HTMLElement|Document|undefined} [root]
   */
  bindView(root) {
    this.view.bind(root)
  }

  /** Проброс оверлея `.waiter` в блоки Input/Output (легаси `common.waiter`). */
  _wireWaiterUi() {
    const show = (token) => this.view.showWaiter(token)
    const hide = (token) => this.view.hideWaiter(token)

    this.inputController.setWaiter(show, hide)
    this.outputController.setWaiter(show, hide)
    this.paramsController.setWaiter(show, hide)
  }

  /**
   * @param {string} userName
   */
  setUserName(userName) {
    this.apiClient.setUserName(userName)
  }

  /**
   * @param {string} userId
   */
  setUserId(userId) {
    this.apiClient.setUserId(userId)
  }

  /**
   * @param {{Function}|null} ui
   */
  setScenarioUi(ui) {
    this._scenarioUi = ui || null
  }

  /**
   * Информационные / ошибочные диалоги уровня сценария (легаси `common.showDialog` в `handleSaveUserStructureResponse`).
   *
   * @param {((message: string, type?: string) => void)|null} fn
   */
  setShowDialog(fn) {
    this._showDialog = fn || null
    this.inputController.setShowDialog(fn)
    this.outputController.setShowDialog(fn)
  }

  /**
   * Confirm-диалоги блоков (легаси `common.showDialog`, п.15 §6.5). Без import из `Stress/`.
   *
   * @param {((message: string, onConfirm: () => void) => void)|null} fn
   */
  setShowConfirmDialog(fn) {
    this.inputController.setShowConfirmDialog(fn)
    this.outputController.setShowConfirmDialog(fn)
  }

  /**
   * PutBin: проброс `ClientServiceUrl` / `Moniker` в `InputController` (п.19 §0.5, §7.5).
   * Координатор не импортирует `UploadFilePopUp`; конфиг доходит до попапа через `InputController.setPutBinConfig`.
   *
   * @param {{ ClientServiceUrl?: string|null, Moniker?: string|null }|null|undefined} config
   */
  setPutBinConfig(config) {
    this.inputController.setPutBinConfig(() => {
      if (
        !config
        || config.ClientServiceUrl == null
        || String(config.ClientServiceUrl) === ''
        || config.Moniker == null
        || String(config.Moniker) === ''
      ) {
        return null
      }

      return {
        clientServiceUrl: String(config.ClientServiceUrl),
        moniker: String(config.Moniker),
      }
    })
  }

  /**
   * @param {HTMLElement|Document|undefined} [root]
   */
  bindParams(root) {
    this.paramsController.bindView(root)
  }

  /**
   * @param {HTMLElement|Document|undefined} [root]
   */
  bindInput(root) {
    this.inputController.bindView(root)
  }

  /**
   * @param {HTMLElement|Document|undefined} [root]
   */
  bindOutput(root) {
    this.outputController.bindView(root)
  }

  async onParamsChanged(params) {
    await Promise.all([
      this.inputController.setParams(params),
      this.outputController.setParams(params),
    ])
  }

  /**
   * Колбек Input при изменении списка строк. Данные — `inputController.getData()`.
   * Авто-validate сценария отложен (input.md §«П. 7.2 — отложено»); save/run вызывают `validate()`.
   *
   * @param {Array} _indicators
   */
  onInputChanged(_indicators) {
  }

  /**
   * Колбек Output — симметрично `onInputChanged` (отложено, input.md §«П. 7.2 — отложено»).
   *
   * @param {Array} _indicators
   */
  onOutputChanged(_indicators) {
  }

  getData() {
    return {
      params: this.paramsController.getData(),
      input: this.inputController.getData(),
      output: this.outputController.getData()
    }
  }

  /**
   * Локальная валидация всех блоков + сквозные правила. Режим run/save — п.15 §5.1.
   *
   * @param {{ mode?: 'runTest'|'save' }} [options] — значения `StressController.MODE_RUN_TEST` / `MODE_SAVE`.
   * @returns {import('./StressValidator.js').ScenarioValidationResult}
   */
  validate(options) {
    const data = this.getData()
    const mode = options?.mode === StressController.MODE_SAVE
      ? StressController.MODE_SAVE
      : StressController.MODE_RUN_TEST
    const local = {
      params: this.paramsController.validate(),
      input: this.inputController.validate(),
      output: this.outputController.validate({ mode }),
    }
    const rez = this.stressService.buildStressModulePayload(data, mode)
    const domState = mode === StressController.MODE_RUN_TEST
      ? this.view.getRunDomValidationState()
      : undefined

    return this.stressValidator.validateScenario(local, data, { mode, rez, domState })
  }

  /**
   * Раскладка сообщений по блокам.
   *
   * @param {Object} [messages]
   * @param {{ replaceAllZones?: boolean }} [options]
   *   `replaceAllZones: true` — все зоны из `messages`, пустые ключи очищают блоки (п.15 §5.5, успешный run/save).
   */
  setMessages(messages, options) {
    const zones = options?.replaceAllZones
      ? StressScenarioResult.normalizeMessageZones(messages)
      : StressScenarioResult.mergeMessageZones(messages)

    this.paramsController.setMessages(zones.params)
    this.inputController.setMessages(zones.input)
    this.outputController.setMessages(zones.output)

    if (this._scenarioUi && typeof this._scenarioUi.setScenarioMessages === 'function') {
      this._scenarioUi.setScenarioMessages(zones.scenario)
    }
  }

  /**
   * Локальная валидация run/save — модальный диалог, как легасi `getStressParams` + `showDialog` (не inline в блоках).
   *
   * @param {Object} [messages]
   */
  _notifyValidationDialog(messages) {
    if (!this._showDialog || !messages) {
      return
    }

    const text = this._formatValidationDialogText(messages)

    if (text) {
      this._showDialog(text)
    }
  }

  /**
   * @param {Object} [messages]
   * @returns {string}
   */
  _formatValidationDialogText(messages) {
    if (!messages) {
      return ''
    }

    const scenarioItems = messages.scenario

    if (Array.isArray(scenarioItems) && scenarioItems.length > 1) {
      return scenarioItems
        .map((item) => (item && item.text != null ? String(item.text) : ''))
        .filter((text) => text.length > 0)
        .join('\n')
    }

    const zones = ['params', 'output', 'input', 'scenario']

    for (const zone of zones) {
      const items = messages[zone]

      if (!Array.isArray(items) || items.length === 0) {
        continue
      }

      const item = items[0]

      if (item && item.text != null && String(item.text).length > 0) {
        return String(item.text)
      }
    }

    return ''
  }

  /**
   * Сообщения зоны scenario → модальный диалог, если `setScenarioUi` ещё не подключён (легасi save/run).
   *
   * @param {Array<{ type?: string, text?: string }>} [scenarioItems]
   */
  _notifyScenarioDialog(scenarioItems) {
    if (!this._showDialog || !Array.isArray(scenarioItems) || scenarioItems.length === 0) {
      return
    }

    const item = scenarioItems[0]

    if (!item || item.text == null || String(item.text).length === 0) {
      return
    }

    const dialogType = item.type === 'error' ? 'Error' : undefined

    this._showDialog(String(item.text), dialogType)
  }

  /**
   * Запуск теста с шапки (легаси `RunTest`): при совпадении имени с версией стресс-теста — двухшаговое confirm.
   */
  runTest() {
    this._syncStressTestNameFromRunInput()

    if (this.needsStressIdOverwriteConfirm()) {
      this.view.openStressIdModal(1)
      return
    }

    void this.sendTest()
  }

  /**
   * Актуальное значение `#stress_test_name` → params (легаси читает input при клике RunTest, не только на change).
   */
  _syncStressTestNameFromRunInput() {
    const name = this.view.getStressTestNameInputValue()
    const current = this.paramsController.getData().stressTestName

    if (String(name) !== String(current != null ? current : '')) {
      void this.paramsController.patchParams({ stressTestName: name }, { silent: true })
    }
  }

  /**
   * Имя из `#stress_test_name` совпадает с одной из загруженных версий стресс-теста (легаси `RunTest`).
   *
   * @returns {boolean}
   */
  needsStressIdOverwriteConfirm() {
    const name = this.paramsController.getData().stressTestName

    if (name == null || String(name).trim() === '') {
      return false
    }

    return this._hasStressTestVersionWithName(name)
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  _hasStressTestVersionWithName(name) {
    const normalized = StressController._normalizeStressTestName(name)
    const versions = this.paramsController.stressTestVersions

    return versions.some(
      (item) => item != null
        && item.name != null
        && StressController._normalizeStressTestName(item.name) === normalized,
    )
  }

  /**
   * Паритет легаси `RunTest`: `toUpperCase()` + `replace(' ', '')` (только первый пробел).
   *
   * @param {string} name
   * @returns {string}
   */
  static _normalizeStressTestName(name) {
    return String(name).toUpperCase().replace(' ', '')
  }

  async sendTest() {
    this._syncStressTestNameFromRunInput()

    const validation = this.validate({ mode: StressController.MODE_RUN_TEST })

    if (!validation.isValid) {
      const out = StressScenarioResult.result(false, StressScenarioResult.messagesFromValidation(validation), {
        step: 'validation',
        validation,
      })

      this._notifyValidationDialog(out.messages)

      return out
    }

    const data = this.getData()

    this.view.showWaiter('StressCheckData')

    let check

    try {
      check = await this.stressService.checkFullStructureForRun(data)
    } finally {
      this.view.hideWaiter('StressCheckData')
    }

    if (!check.ok) {
      this._applyStructureCheckRowHighlight(check.invalidRows)

      const out = StressScenarioResult.result(false, check.messages, {
        step: 'checkFullStructure',
        checkResponse: check.checkResponse,
        payload: check.payload,
      })

      this.setMessages(out.messages)
      this._notifyScenarioDialog(out.messages.scenario)

      return out
    }

    this.view.showWaiter('RunTest')

    let run

    try {
      run = await this.stressService.startModelRisk(data, {
        payload: check.payload,
        json: JSON.stringify(check.payload),
      })
    } finally {
      this.view.hideWaiter('RunTest')
    }

    const out = StressScenarioResult.result(run.ok, run.messages, {
      step: 'startModelRisk',
      raw: run.raw,
    })

    this.setMessages(out.messages, { replaceAllZones: out.ok })
    this._notifyScenarioDialog(out.messages.scenario)

    return out
  }

  /**
   * Подсветка строк после CheckFullStructure (легасi `sendTest` → `ListRow__error`).
   *
   * @param {{ input?: number[], output?: number[] }|undefined} invalidRows
   */
  _applyStructureCheckRowHighlight(invalidRows) {
    if (!invalidRows) {
      return
    }

    const rowErrorState = { applyErrorClass: true, hasError: true }

    ;(invalidRows.input || []).forEach((number) => {
      this.inputController.view.updateRowErrorState(number, rowErrorState)
    })

    ;(invalidRows.output || []).forEach((number) => {
      this.outputController.view.updateRowErrorState(number, rowErrorState)
    })
  }

  async saveTestState() {
    const validation = this.validate({ mode: StressController.MODE_SAVE })

    if (!validation.isValid) {
      const out = StressScenarioResult.result(false, StressScenarioResult.messagesFromValidation(validation), {
        step: 'validation',
        validation,
      })

      this._notifyValidationDialog(out.messages)

      return out
    }

    this.view.showWaiter('Save Test')

    let save

    try {
      save = await this.stressService.saveUserStructure(this.getData())
    } finally {
      this.view.hideWaiter('Save Test')
    }

    const out = StressScenarioResult.result(save.ok, save.messages, {
      step: 'saveUserStructure',
      raw: save.raw,
    })

    this.setMessages(out.messages, { replaceAllZones: out.ok })
    this._notifyScenarioDialog(out.messages.scenario)

    return out
  }
}

export { StressController }
