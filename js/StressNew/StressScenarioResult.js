/**
 * Единый контракт результата сценария стресс-теста: ok + messages
 */
export class StressScenarioResult {

  /**
   * @returns {{ scenario: Array, params: Array, input: Array, output: Array }}
   */
  static emptyMessages() {
    return {
      scenario: [],
      params: [],
      input: [],
      output: [],
    }
  }

  /**
   * @param {Object} [messages]
   * @returns {{ scenario: Array, params: Array, input: Array, output: Array }}
   */
  static mergeMessageZones(messages) {
    const base = StressScenarioResult.emptyMessages()

    if (!messages) {
      return base
    }

    if (messages.scenario && messages.scenario.length) {
      base.scenario = messages.scenario.slice()
    }

    if (messages.params && messages.params.length) {
      base.params = messages.params.slice()
    }

    if (messages.input && messages.input.length) {
      base.input = messages.input.slice()
    }

    if (messages.output && messages.output.length) {
      base.output = messages.output.slice()
    }

    return base
  }

  /**
   * Все четыре зоны явно: отсутствующий ключ → `[]` (очистка блоков во view, п.15 §5.5).
   *
   * @param {Object} [messages]
   * @returns {{ scenario: Array, params: Array, input: Array, output: Array }}
   */
  static normalizeMessageZones(messages) {
    const base = StressScenarioResult.emptyMessages()

    if (!messages || typeof messages !== 'object') {
      return base
    }

    ;['scenario', 'params', 'input', 'output'].forEach((zone) => {
      if (Array.isArray(messages[zone])) {
        base[zone] = messages[zone].slice()
      }
    })

    return base
  }

  /**
   * @param {boolean} ok
   * @param {Object} messages
   * @param {Object} [extra]
   * @returns {{ ok: boolean, messages: Object } & Object}
   */
  static result(ok, messages, extra) {
    return Object.assign({ ok, messages: StressScenarioResult.mergeMessageZones(messages) }, extra || {})
  }

  /**
   * @param {{ isValid: boolean, errors?: Object }} validation
   * @returns {Object}
   */
  static messagesFromValidation(validation) {
    const out = StressScenarioResult.emptyMessages()

    if (!validation || validation.isValid) {
      return out
    }

    const err = validation.errors || {}

    StressScenarioResult._pushParamsErrors(err.params, out.params)
    StressScenarioResult._pushKeyedErrors(err.input, out.input)
    StressScenarioResult._pushKeyedErrors(err.output, out.output)

    if (err.scenario && Array.isArray(err.scenario)) {
      err.scenario.forEach((item) => {
        const text = typeof item === 'string' ? item : (item && item.text) ? item.text : JSON.stringify(item)

        out.scenario.push({ type: 'error', text })
      })
    }

    return out
  }

  /**
   * @param {*} paramsErrors — массив строк или одно значение
   * @param {Array} target
   */
  static _pushParamsErrors(paramsErrors, target) {
    if (paramsErrors == null) {
      return
    }

    if (Array.isArray(paramsErrors)) {
      paramsErrors.forEach((item) => {
        target.push({ type: 'error', text: String(item) })
      })

      return
    }

    target.push({ type: 'error', text: String(paramsErrors) })
  }

  /**
   * Ошибки Input/Output: ключ-цифра → `meta.rowIndex`, иначе → `meta.field`.
   *
   * @param {Record<string, string>} [obj]
   * @param {Array<{ type: string, text: string, meta?: { rowIndex?: number, field?: string } }>} target
   */
  static _pushKeyedErrors(obj, target) {
    if (!obj || typeof obj !== 'object') {
      return
    }

    Object.keys(obj).forEach((key) => {
      const val = obj[key]
      const text = typeof val === 'string' ? val : JSON.stringify(val)
      const meta = {}

      if (/^\d+$/.test(key)) {
        meta.rowIndex = Number(key)
      } else {
        meta.field = key
      }

      target.push({ type: 'error', text, meta })
    })
  }

  /**
   * @param {*} checkResponse
   * @param {Object} [_payload]
   * @returns {Object}
   */
  static messagesFromCheckFullStructureFailure(checkResponse, _payload) {
    const scenario = []
    const text = StressScenarioResult.extractModuleErrorText(checkResponse) || 'Ошибка проверки структуры (CheckFullStructure)'

    scenario.push({
      type: 'error',
      text,
      meta: { source: 'CheckFullStructure' },
    })

    return { scenario, params: [], input: [], output: [] }
  }

  /**
   * Post-check по status строк (легасi `sendTest`: «Проверка не пройдена.»).
   *
   * @returns {Object}
   */
  static messagesFromStructureRowCheckFailure() {
    return {
      scenario: [{
        type: 'error',
        text: 'Проверка не пройдена.',
        meta: { source: 'CheckFullStructure' },
      }],
      params: [],
      input: [],
      output: [],
    }
  }

  /**
   * @param {*} raw
   * @param {boolean} ok
   * @param {string} source
   * @param {string} [defaultSuccessText]
   * @param {string} [defaultErrorText]
   * @returns {Object}
   */
  static messagesFromModuleCall(raw, ok, source, defaultSuccessText, defaultErrorText) {
    const scenario = []

    if (ok) {
      const text = defaultSuccessText || StressScenarioResult.extractSuccessText(raw) || 'Готово'

      scenario.push({
        type: 'success',
        text,
        meta: { source },
      })
    } else {
      const text = StressScenarioResult.extractModuleErrorText(raw) || defaultErrorText || 'Ошибка при вызове модуля'

      scenario.push({
        type: 'error',
        text,
        meta: { source },
      })
    }

    return { scenario, params: [], input: [], output: [] }
  }

  /**
   * @param {*} res
   * @returns {string}
   */
  static extractModuleErrorText(res) {
    if (!res) {
      return ''
    }

    if (res.faultstring && String(res.faultstring).length > 0) {
      return String(res.faultstring)
    }

    if (res.message != null && String(res.message).length > 0) {
      return String(res.message)
    }

    return ''
  }

  /**
   * @param {*} res
   * @returns {string}
   */
  static extractSuccessText(res) {
    if (!res) {
      return ''
    }

    if (res.message != null && String(res.message).length > 0) {
      return String(res.message)
    }

    return ''
  }
}
