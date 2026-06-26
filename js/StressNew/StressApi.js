import { Dims } from '../Common/config.js' // ключи справочников
import { ApiStatus } from '../Common/constants.js'

export class StressApi {

  /**
   * @param {Object} bi
   * @param {Object} foreKeys
   */
  constructor(bi, foreKeys) {
    this.bi = bi
    this.userName = ''
    this.foreKeys = foreKeys
    this.userId = ''
  }

  /**
   * @param {string} userId
   */
  setUserId(userId) {
    this.userId = String(userId)
  }

  /**
   * @returns {string}
   */
  getUserId() {
    return this.userId
  }

  /**
   * @param {string} userName
   */
  setUserName(userName) {
    this.userName = userName
  }

  /**
   * Проверка поля `status` ответа Fore (легаси: `x.status !== ApiStatus.ERROR`).
   *
   * @param {string|undefined|null} status — `response.status` из сервиса (Input, Output, попап)
   * @returns {boolean} `true` — проверка прошла; `false` — ошибка (`ERROR` / `error`)
   */
  checkApiStatus(status) {
    return status !== ApiStatus.ERROR && status !== ApiStatus.ERROR_LOWER
  }

  /**
   * @param {*} response — объект ответа `getResultForeModule`
   * @returns {boolean} `true` — ответ есть и статус успешный; `false` — нет ответа или ошибка
   */
  checkModuleResponse(response) {
    if (response == null) {
      return false
    }

    return this.checkApiStatus(response.status)
  }

  /**
   * Ответ модуля на верхнем уровне считается ошибочным
   * (легасi `getValidData`: `faultstring` или `ERROR` → fallback на исходный json).
   *
   * @param {*} response
   * @returns {boolean}
   */
  isModuleResponseFailed(response) {
    if (response == null) {
      return true
    }

    if (response.faultstring && String(response.faultstring).length > 0) {
      return true
    }

    return !this.checkApiStatus(response.status)
  }

  _moduleKey() {
    return this.foreKeys.DK_STRESS_1144013
  }

  _requireBi() {
    const bi = this.bi

    if (!bi) {
      throw new Error('StressApi: не передан bi')
    }

    return bi
  }

  /**
   * @param {string} methodName
   * @param {Array} args
   * @returns {Promise<*>}
   */
  callModule(methodName, args) {
    const bi = this._requireBi()

    return bi.getResultForeModule({
      moduleKey: this._moduleKey(),
      methodName,
      args,
    })
  }

  /**
   * @param {Object|string} jsonPayload
   * @param {string} userIdOrName
   * @param {string|number} versionId
   * @returns {Array}
   */
  _argsJsonUserVersion(jsonPayload, userIdOrName, versionId) {
    const bi = this._requireBi()
    const jsonStr = typeof jsonPayload === 'string' ? jsonPayload : JSON.stringify(jsonPayload)

    return [
      bi.OpenArgs('json', jsonStr, bi.ItDataType.String),
      bi.OpenArgs('userName', userIdOrName != null ? String(userIdOrName) : '', bi.ItDataType.String),
      bi.OpenArgs('version', versionId != null ? String(versionId) : '', bi.ItDataType.String),
    ]
  }

  /**
   * @param {string} userIdOrName
   * @param {string|number} versionId
   * @returns {Array}
   */
  _argsUserVersion(userIdOrName, versionId) {
    const bi = this._requireBi()

    return [
      bi.OpenArgs('userName', userIdOrName != null ? String(userIdOrName) : '', bi.ItDataType.String),
      bi.OpenArgs('version', versionId != null ? String(versionId) : '', bi.ItDataType.String),
    ]
  }

  _normalizeMonthDate(value) {
    if (!value) return value
    if (/^01\.\d{2}\.\d{4}$/.test(value)) return value
    if (/^\d{2}\.\d{4}$/.test(value)) return `01.${value}`
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
      const [year, month] = value.split('-')
      return `01.${month}.${year}`
    }
    return value
  }

  /**
   * Открыть справочник, получить элементы, закрыть
   *
   * @param {number} dimKey — ключ из Dims
   * @param {Array|null} params
   * @returns {Promise<Array>}
   */
  async _fetchDimElements(dimKey, params) {
    const bi = this._requireBi()
    const dim = await bi.openDim({
      dimKey,
      params: params || [],
    })

    if (!dim || !dim.id || dim.id.id == null) {
      const fault = dim && dim.faultstring ? dim.faultstring : ''
      throw new Error(`StressApi: openDim(${dimKey})${fault ? ` — ${fault}` : ' — нет id'}`)
    }

    const items = await bi.getFiltredDimElements({ key: dim.id.id })
    await bi.closeDim({ id: dim.id })

    if (!items) {
      return []
    }

    return Array.isArray(items) ? items : [items]
  }

  /**
   * @param {Object} json — объект конфигурации
   * @param {string|number} prognozVersionId
   * @param {string} userId
   * @returns {Promise<*>}
   */
  checkFullStructure(json, prognozVersionId, userId) {
    return this.callModule(StressApi.MODULE_METHOD.CHECK_FULL_STRUCTURE, this._argsJsonUserVersion(json, userId, prognozVersionId))
  }

  /**
   * @param {Object} json
   * @param {string|number} prognozVersionId
   * @param {string} userId
   * @returns {Promise<*>}
   */
  getValidData(json, prognozVersionId, userId) {
    return this.checkFullStructure(json, prognozVersionId, userId)
  }

  /**
   * @param {string} json — JSON-строка конфигурации
   * @param {string} userName
   * @param {string|number} version — id версии прогноза
   * @returns {Promise<*>}
   */
  startModelRisk(json, userName, version) {
    return this.callModule(StressApi.MODULE_METHOD.START_MODEL_RISK, this._argsJsonUserVersion(json, userName, version))
  }

  /**
   * @param {string} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  saveUserStructure(json, userId, versionId) {
    return this.callModule(StressApi.MODULE_METHOD.SAVE_USER_STRUCTURE, this._argsJsonUserVersion(json, userId, versionId))
  }

  /**
   * @param {string} userId
   * @param {string|number} version
   * @returns {Promise<*>}
   */
  getStructure(userId, version) {
    return this.callModule(StressApi.MODULE_METHOD.GET_STRUCTURE, this._argsUserVersion(userId, version))
  }

  /**
   * @param {Object} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  getStressTestVersions(json, userId, versionId) {
    return this.callModule(StressApi.MODULE_METHOD.GET_STRESS_TEST_VERSIONS, this._argsJsonUserVersion(json, userId, versionId))
  }

  /**
   * @param {Object} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  getStressVersion(json, userId, versionId) {
    return this.callModule(StressApi.MODULE_METHOD.GET_STRESS_VERSION, this._argsJsonUserVersion(json, userId, versionId))
  }

  /**
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getForecastVersions(startDate, endDate) {
    const bi = this._requireBi()
    const dateIn = this._normalizeMonthDate(startDate)
    const dateOut = this._normalizeMonthDate(endDate)

    return this._fetchDimElements(Dims.STRESS_VERSIONS, [
      bi.OpenArgs('DATE_IN', dateIn, bi.ItDataType.String),
      bi.OpenArgs('DATE_OUT', dateOut, bi.ItDataType.String),
    ])
  }

  /**
   * Справочник показателей стресс-теста (STRESS_POKS), как в легаси initVersion listData.
   *
   * @param {1|2} indType 1 — input, 2 — output
   * @param {string|number} [blockId=-1] BLOCK_ID для фильтра по блоку (-1 — все блоки)
   * @returns {Promise<Array>}
   */
  async getStressPoksIndicators(indType, blockId = -1) {
    const bi = this._requireBi()

    return this._fetchDimElements(Dims.STRESS_POKS, [
      bi.OpenArgs('IND_TYPE', indType, bi.ItDataType.Integer),
      bi.OpenArgs('BLOCK_ID', Number(blockId), bi.ItDataType.Integer),
    ])
  }

  /**
   * Список распределений или моделей (DK_DISTRIBUTION), TYPE 1 или 2.
   *
   * @param {1|2} type
   * @returns {Promise<Array>}
   */
  async getDistributionComboElements(type) {
    const bi = this._requireBi()

    return this._fetchDimElements(Dims.DK_DISTRIBUTION, [
      bi.OpenArgs('TYPE', type, bi.ItDataType.Integer),
    ])
  }

  /**
   * Справочник числа итераций (DK_ITERATION_COUNT).
   *
   * @returns {Promise<Array>}
   */
  async getIterationCountDimElements() {
    return this._fetchDimElements(Dims.DK_ITERATION_COUNT)
  }

  /**
   * Справочник продуктов для колонки Product (DK_PRODUCTS_NSISPRAV), как ProductsEls в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getProductsDimElements() {
    return this._fetchDimElements(Dims.DK_PRODUCTS_NSISPRAV)
  }

  /**
   * Справочник блоков показателей (DK_MODEL_BLOCK_NSISPRAV), как BlocksIndicatorsData в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getModelBlockDimElements() {
    return this._fetchDimElements(Dims.DK_MODEL_BLOCK_NSISPRAV)
  }

  /**
   * Справочник видов движения (DK_EKR_NSISPRAV_FLOWKIND), как TypeMovementEls в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getMovementTypeDimElements() {
    return this._fetchDimElements(Dims.DK_EKR_NSISPRAV_FLOWKIND)
  }

  /**
   * Справочник компаний (DK_COMPANIES_TABLSPRAV), как CompaniesEls в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getCompaniesDimElements() {
    return this._fetchDimElements(Dims.DK_COMPANIES_TABLSPRAV)
  }

  /**
   * Справочник валют транзакций (DK_TRCURR_NSISPRAV), как TransactionCurrencyEls в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getTransactionCurrencyDimElements() {
    return this._fetchDimElements(Dims.DK_TRCURR_NSISPRAV)
  }

  /**
   * Справочник классификации LT/ST (DK_EKR_NSSPRAV_KLASS_LT_ST), как LTSTDataEls в stress-ui.
   *
   * @returns {Promise<Array>}
   */
  async getLtStDimElements() {
    return this._fetchDimElements(Dims.DK_EKR_NSSPRAV_KLASS_LT_ST)
  }

  /**
   * Справочник аналитик по показателю (EKR_ANALYTICSPOKAZ_TABLSPRAV), как `loadingAnalysts` в легаси.
   *
   * @param {string|number} indicatorId
   * @returns {Promise<Array>}
   */
  async getAnalyticsPokazDimElements(indicatorId) {
    const bi = this._requireBi()

    return this._fetchDimElements(Dims.EKR_ANALYTICSPOKAZ_TABLSPRAV, [
      bi.OpenArgs('INDICATOR', indicatorId, bi.ItDataType.Integer),
    ])
  }

  /**
   * Распределения (TYPE=1) и модели (TYPE=2) одним списком, как distributionEls в легаси.
   *
   * @returns {Promise<Array>}
   */
  async getDistributionComboElementsMerged() {
    const distributions = await this.getDistributionComboElements(1)
    const models = await this.getDistributionComboElements(2)
    return [...distributions, ...models]
  }

  /**
   * Параметры распределения по выбранному id (легаси fillDistributionOptions → DISTRIBUTION_PARAM).
   *
   * @param {string|number} distributionId
   * @returns {Promise<Array>}
   */
  async getDistributionParamDimElements(distributionId) {
    const bi = this._requireBi()

    if (distributionId == null || distributionId === '') {
      return []
    }

    const idStr = String(distributionId)
    const isNumericId =
      (typeof distributionId === 'number' && !Number.isNaN(distributionId)) ||
      (idStr !== '' && Number(idStr).toString() === idStr)

    const value = isNumericId ? Number(idStr) : distributionId

    return this._fetchDimElements(Dims.DISTRIBUTION_PARAM, [
      bi.OpenArgs(
        'PARAM_DISTRIB',
        value,
        isNumericId ? bi.ItDataType.Integer : bi.ItDataType.String,
      ),
    ])
  }

  /**
   * @param {Object} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  checkSingleStructure(json, userId, versionId) {
    return this.callModule(StressApi.MODULE_METHOD.CHECK_SINGLE_STRUCTURE, this._argsJsonUserVersion(json, userId, versionId))
  }

  /**
   * @param {Object} json
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  checkData(json, userId, versionId) {
    return this.callModule(StressApi.MODULE_METHOD.CHECK_DATA, this._argsJsonUserVersion(json, userId, versionId))
  }

  /**
   * @param {string} methodName
   * @param {Object|string} jsonPayload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  callModuleJsonMethod(methodName, jsonPayload, userId, versionId) {
    return this.callModule(methodName, this._argsJsonUserVersion(jsonPayload, userId, versionId))
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  getDistributionData(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.GET_DISTRIBUTION_DATA, payload, userId, versionId)
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  choiceDistribution(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.CHOICE_DISTRIBUTION, payload, userId, versionId)
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  deleteDistribution(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.DELETE_DISTRIBUTION, payload, userId, versionId)
  }

  /**
   * Загрузка файла в хранилище (не Fore-модуль; легасi `UploadFilePopUp.send` → fetch PutBin).
   *
   * @param {FormData} formData
   * @param {{
   *   clientServiceUrl: string,
   *   moniker: string,
   *   format: string,
   *   fileName: string,
   * }} config
   * @returns {Promise<string>} ExcelID — `OBJ` + suffix из PutBinResult
   */
  async putBin(formData, config) {
    const url =
      `${config.clientServiceUrl}/PutBin?createNewDoc=1&format=${config.format}`
      + `&fileName=${config.fileName}`
      + `&mon=${config.moniker}!${Dims.FOLDER_UPDATE}`

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const xmlText = await response.text()
    return this._parsePutBinExcelId(xmlText)
  }

  /**
   * @param {string} xmlText
   * @returns {string}
   */
  _parsePutBinExcelId(xmlText) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const resultNode = xmlDoc.querySelector('PutBinResult')

    if (!resultNode) {
      throw new Error('PutBinResult not found')
    }

    const content = resultNode.textContent.trim()
    return `OBJ${content.split('!').pop()}`
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  saveExcelDataSet(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.SAVE_EXCEL_DATA_SET, payload, userId, versionId)
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  getExcelDataSets(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.GET_EXCEL_DATA_SETS, payload, userId, versionId)
  }

  /**
   * @param {Object} payload
   * @param {string} userId
   * @param {string|number} versionId
   * @returns {Promise<*>}
   */
  deleteExcelDataSet(payload, userId, versionId) {
    return this.callModuleJsonMethod(StressApi.MODULE_METHOD.DELETE_EXCEL_DATA_SET, payload, userId, versionId)
  }
}

/**
 * methodName для getResultForeModule
 */
StressApi.MODULE_METHOD = {
  CHECK_FULL_STRUCTURE: 'CheckFullStructure',
  START_MODEL_RISK: 'startModelRisk',
  SAVE_USER_STRUCTURE: 'SaveUserStructure',
  GET_STRUCTURE: 'getStructure',
  GET_STRESS_TEST_VERSIONS: 'GetStressTestVersions',
  GET_STRESS_VERSION: 'GetStressVersion',
  CHECK_SINGLE_STRUCTURE: 'CheckSingleStructure',
  CHECK_DATA: 'CheckData',
  GET_DISTRIBUTION_DATA: 'GetDistributionData',
  CHOICE_DISTRIBUTION: 'ChoiceDistribution',
  DELETE_DISTRIBUTION: 'DeleteDistribution',
  SAVE_EXCEL_DATA_SET: 'SaveExcelDataSet',
  GET_EXCEL_DATA_SETS: 'GetExcelDataSets',
  DELETE_EXCEL_DATA_SET: 'DeleteExcelDataSet',
}
