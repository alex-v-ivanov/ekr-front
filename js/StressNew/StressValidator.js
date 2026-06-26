import { NEW_LINE } from '../Common/constants.js'

/**
 * Сквозная валидация сценария: агрегация локальных блоков + правила между блоками (п.15).
 * Без DOM и без `StressService`: координатор передаёт уже собранный `rez` (как в легаси `getStressParams`).
 *
 * @typedef {Object} ParamsValidationResult
 * @property {boolean} isValid
 * @property {string[]} errors
 *
 * @typedef {Object} KeyedValidationResult
 * @property {boolean} isValid
 * @property {Record<string, string>} errors
 *
 * @typedef {Object} LocalValidationBundle
 * @property {ParamsValidationResult} params — результат `ParamsController.validate()`.
 * @property {KeyedValidationResult} input — результат `InputController.validate()`.
 * @property {KeyedValidationResult} output — результат `OutputController.validate()`.
 *
 * @typedef {Object} DuplicateCheckResult
 * @property {boolean} duplicateInputsWithSameAnalytics
 * @property {boolean} duplicateInputsWithoutAnalytics
 * @property {boolean} duplicateOutputsWithSameAnalytics
 * @property {boolean} duplicateOutputsWithoutAnalytics
 * @property {string[]} details
 *
 * @typedef {Object} InputParametersValidationResult
 * @property {boolean} isValid
 * @property {Record<string, string>} errors — ключ `"3"` = номер строки; `form` — ошибка структуры.
 *
 * @typedef {Object} ScenarioValidationErrors
 * @property {string[]} params — копия/агрегат из локального params (массив текстов).
 * @property {Record<string, string>} input — ошибки по строкам/полям Input.
 * @property {Record<string, string>} output — ошибки по строкам/полям Output.
 * @property {string[]} [scenario] — сквозные сообщения (дубли, DOM-run и т.д., п.15 §4–5).
 *
 * @typedef {Object} ScenarioValidationResult
 * @property {boolean} isValid — итог для `sendTest` / `saveTestState` до вызова Fore.
 * @property {ScenarioValidationErrors} errors — раскладка для `StressScenarioResult.messagesFromValidation`.
 */

export class StressValidator {

  /** Легаси `validateInputParameters` — нет массива Input (`stress-validator.js`). */
  static INPUT_CONFIG_INVALID = 'Неверная структура конфигурации: отсутствуют INPUT-параметры'

  /** Легаси `StressValidationMessages.INDICATORS_NOT_SUPPORTED` (`getStressParams` ~245–247). */
  static INDICATORS_NOT_SUPPORTED =
    'Некоторые из выбранных показателей не поддерживаются в текущей версии прогноза. \n\n' +
    'Пожалуйста, измените набор показателей или выберите другую версию прогноза из списка доступных.'

  /** Легаси `StressValidationMessages.INVALID_HISTORICAL_RANGE` (`getStressParams` ~248–250). */
  static INVALID_HISTORICAL_RANGE = 'У некоторых выбранных показателей некорректный исторический диапазон'

  /**
   * @param {import('./StressApi.js').StressApi} apiClient — для будущих сквозных вызовов Fore (п.15 §4+).
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * Исторический диапазон или Excel по строкам Input (легаси `validateInputParameters`).
   *
   * @param {{ Input?: Array<Object> }} config — `rez` после `buildStressModulePayload`.
   * @returns {InputParametersValidationResult}
   */
  validateInputParameters(config) {
    const errors = {}

    if (!config || !config.Input || !Array.isArray(config.Input)) {
      return {
        isValid: false,
        errors: { form: StressValidator.INPUT_CONFIG_INVALID },
      }
    }

    for (const input of config.Input) {
      const hasDateRange = input.dateFrom && input.dateTo
      const hasExcelMatrix = input.ExcelGUID && input.ExcelType

      if (!hasDateRange && !hasExcelMatrix) {
        errors[String(input.number)] =
          `Не задан исторический диапазон для INPUT-показателя #${input.number} (${input.name})`
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Дубли Input/Output (легаси `Validator.checkForDuplicates`, `stress-validator.js`).
   *
   * @param {{ Input?: Array<Object>, Output?: Array<Object> }} data — как `rez` после маппинга строк.
   * @returns {DuplicateCheckResult}
   */
  checkForDuplicates(data) {
    const results = {
      duplicateInputsWithSameAnalytics: false,
      duplicateInputsWithoutAnalytics: false,
      duplicateOutputsWithSameAnalytics: false,
      duplicateOutputsWithoutAnalytics: false,
      details: [],
    }

    if (data.Input && data.Input.length > 0) {
      const inputKeys = new Map()
      const inputKeysWithoutAnalytics = new Map()

      for (const input of data.Input) {
        const key = input.key
        const hasAnalytics = input.analytics && Object.values(input.analytics).some((val) => val !== '-1')

        if (hasAnalytics) {
          const compositeKey = `${key}_${JSON.stringify(input.analytics)}`

          if (inputKeys.has(compositeKey)) {
            results.duplicateInputsWithSameAnalytics = true
            const originalInput = inputKeys.get(compositeKey)

            results.details.push(
              `Дубль INPUT найден: ${originalInput.name} (№ ${originalInput.number}) с той же аналитикой. ` +
              `Дубль INPUT найден: ${input.name} (№ ${input.number}) с той же аналитикой. `,
            )
          } else {
            inputKeys.set(compositeKey, input)
          }
        } else if (inputKeysWithoutAnalytics.has(key)) {
          results.duplicateInputsWithoutAnalytics = true
          const originalInput = inputKeysWithoutAnalytics.get(key)

          results.details.push(
            `Дубль INPUT найден: ${originalInput.name} (№ ${originalInput.number}) без аналитики.` +
            `Дубль INPUT найден: ${input.name} (№ ${input.number}) без аналитики. `,
          )
        } else {
          inputKeysWithoutAnalytics.set(key, input)
        }
      }
    }

    if (data.Output && data.Output.length > 0) {
      const outputKeys = new Map()
      const outputKeysWithoutAnalytics = new Map()

      for (const output of data.Output) {
        const key = output.key
        const hasAnalytics = output.analytics && Object.values(output.analytics).some((val) => val !== '-1')

        if (hasAnalytics) {
          const compositeKey = `${key}_${JSON.stringify(output.analytics)}`

          if (outputKeys.has(compositeKey)) {
            results.duplicateOutputsWithSameAnalytics = true
            const originalOutput = outputKeys.get(compositeKey)

            results.details.push(
              `Дубль OUTPUT найден: ${output.name} (№ ${output.number}) с той же аналитикой. ` +
              `Оригинал: ${originalOutput.name} (№ ${originalOutput.number})`,
            )
          } else {
            outputKeys.set(compositeKey, output)
          }
        } else if (outputKeysWithoutAnalytics.has(key)) {
          results.duplicateOutputsWithoutAnalytics = true
          const originalOutput = outputKeysWithoutAnalytics.get(key)

          results.details.push(
            `Дубль OUTPUT найден: ${output.name} (№ ${output.number}) без аналитики. ` +
            `Оригинал: ${originalOutput.name} (№ ${originalOutput.number})`,
          )
        } else {
          outputKeysWithoutAnalytics.set(key, output)
        }
      }
    }

    return results
  }

  /**
   * DOM-run: `ListRow__error` / HistoricalRange `.error__message` (легаси ~241–251, приоритет как в if/else).
   *
   * @param {{ hasListRowError?: boolean, hasHistoricalRangeError?: boolean }} [domState] — `StressView.getRunDomValidationState`.
   * @returns {{ isValid: boolean, message?: string }}
   */
  evaluateRunDomChecks(domState) {
    if (!domState) {
      return { isValid: true }
    }

    if (domState.hasListRowError) {
      return { isValid: false, message: StressValidator.INDICATORS_NOT_SUPPORTED }
    }

    if (domState.hasHistoricalRangeError) {
      return { isValid: false, message: StressValidator.INVALID_HISTORICAL_RANGE }
    }

    return { isValid: true }
  }

  /**
   * Итоговая проверка перед запуском / сохранением.
   *
   * @param {LocalValidationBundle} local — результаты `*Controller.validate()`.
   * @param {{ params: Object, input: Array, output: Array }} data — `StressController.getData()`.
   * @param {{ mode?: 'runTest'|'save', rez?: { Input?: Array<Object>, Output?: Array<Object> }, domState?: { hasListRowError?: boolean, hasHistoricalRangeError?: boolean } }} [options]
   *   `rez` — payload как в легаси (`StressService.buildStressModulePayload`); готовит **`StressController`**.
   *   `domState` — только при run, снимок DOM из **`StressView`** (п.15 §5.4).
   * @returns {ScenarioValidationResult}
   */
  validateScenario(local, data, options) {
    const scenarioErrors = []

    const mode = options?.mode === 'save' ? 'save' : 'runTest'

    if (mode === 'runTest') {
      const domCheck = this.evaluateRunDomChecks(options?.domState)

      if (!domCheck.isValid && domCheck.message) {
        scenarioErrors.push(domCheck.message)
      }
    }

    const rez = options?.rez
    const dupCheck = this.checkForDuplicates({
      Input: rez?.Input,
      Output: rez?.Output,
    })

    if (dupCheck.details.length > 0) {
      scenarioErrors.push(dupCheck.details.join(NEW_LINE))
    }

    const inputErrors = { ...(local.input.errors || {}) }
    const inputParamCheck = this.validateInputParameters(rez)

    if (mode === 'runTest' && !inputParamCheck.isValid) {
      Object.assign(inputErrors, inputParamCheck.errors)
    }

    // п. 4.4: итог = params ∧ input ∧ output ∧ scenario (без скрытых флагов)
    const paramsOk = local.params.isValid
    const outputOk = local.output.isValid
    const scenarioOk = scenarioErrors.length === 0
    const inputHistoricalOk = mode === 'save' || inputParamCheck.isValid
    const inputOk = local.input.isValid && inputHistoricalOk
    const isValid = paramsOk && inputOk && outputOk && scenarioOk

    const errors = {
      params: local.params.errors,
      input: inputErrors,
      output: local.output.errors,
    }

    if (scenarioErrors.length > 0) {
      errors.scenario = scenarioErrors
    }

    return {
      isValid,
      errors,
    }
  }
}
