/**
 * InputService — запросы к Fore через StressApi. Без DOM и без jQuery.
 */
export class InputService {

  /** Дефолты analytics в JSON модуля (как `DEFAULT_ANALYTICS` в `StressService`; копия, без import). */
  static _MODULE_ANALYTICS_DEFAULTS = {
    product: '-1',
    movementType: '-1',
    company: '-1',
    trCurrency: '-1',
    lt_st: '-1',
  }

  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * Справочники для строк input: показатели, распределения/модели, продукты.
   * @returns {Promise<{ indicators: Array<{ id: *, name: * }>, distributions: Array<{ id: *, name: *, distributionType: 1|2 }>, products: Array<{ id: *, name: * }> }>}
   */
  async loadInputDimLists() {
    const indicatorsRaw = await this.apiClient.getStressPoksIndicators(1)
    const distributionsRaw = await this.apiClient.getDistributionComboElements(1)
    const modelsRaw = await this.apiClient.getDistributionComboElements(2)
    const productsRaw = await this.apiClient.getProductsDimElements()

    const distributions = this._normalizeDimItems(distributionsRaw).map((item) => ({
      ...item,
      distributionType: 1,
    }))
    const models = this._normalizeDimItems(modelsRaw).map((item) => ({
      ...item,
      distributionType: 2,
    }))

    return {
      indicators: this._normalizeDimItems(indicatorsRaw),
      distributions: [...distributions, ...models],
      products: this._normalizeDimItems(productsRaw),
    }
  }

  /**
   * BI { k, n } → { id, name } для Select2 (как ParamsService.loadForecastVersions).
   *
   * @param {Array<{ k: *, n: * }>} items
   * @returns {Array<{ id: *, name: * }>}
   */
  _normalizeDimItems(items) {
    return (items || [])
      .filter((item) => item != null && item.k != null && item.k !== '')
      .map((item) => ({
        id: item.k,
        name: item.n != null ? item.n : '',
      }))
  }

  /**
   * Параметры распределения с сервера → `{ name, value, isCheckValidValue }` (легаси normalizeDistributionParams).
   *
   * @param {Array} params
   * @returns {Array<{ name: string, value: string, isCheckValidValue?: boolean }>}
   */
  /**
   * Поля распределения из JSON структуры → модель строки (легаси renderInput ~97–98).
   * В модуле: `distribution` — id, `distributionId` — имя; в модели: `distributionId` — id, `distributionName` — имя.
   *
   * @param {Object} source
   * @returns {{ distributionId: *|null, distributionName: string|null }}
   */
  resolveDistributionFields(source) {
    const row = source && typeof source === 'object' ? source : {}
    const moduleDistribution = row.distribution
    const hasModuleDistribution =
      moduleDistribution != null &&
      moduleDistribution !== '' &&
      Number(moduleDistribution) !== -1

    if (hasModuleDistribution) {
      let distributionName = null

      if (row.distributionName != null && String(row.distributionName) !== '') {
        distributionName = String(row.distributionName)
      } else if (row.distributionId != null && String(row.distributionId) !== '') {
        distributionName = String(row.distributionId)
      }

      return {
        distributionId: moduleDistribution,
        distributionName,
      }
    }

    return {
      distributionId: row.distributionId != null ? row.distributionId : null,
      distributionName: row.distributionName != null ? String(row.distributionName) : null,
    }
  }

  normalizeDistributionParams(params) {
    if (!params || !Array.isArray(params)) {
      return []
    }

    return params.map((el) => {
      const name =
        el.name != null
          ? el.name
          : el.paramName != null
            ? el.paramName
            : el.n != null
              ? el.n
              : ''
      const val =
        el.value != null
          ? el.value
          : el.paramValue != null
            ? el.paramValue
            : el.v != null
              ? el.v
              : el['@v'] != null
                ? el['@v']
                : '0'

      return {
        name: String(name),
        value: String(val),
        isCheckValidValue: el.isCheckValidValue === true,
      }
    })
  }

  /**
   * Отображение числового параметра без округления (легаси toFixedNoRounding).
   *
   * @param {string|number} num
   * @param {number} [decimals]
   * @returns {string}
   */
  formatOptionValueDisplay(num, decimals = 3) {
    const str = String(num)
    const dotIndex = str.indexOf('.')

    if (dotIndex === -1) {
      return str
    }

    return str.substring(0, dotIndex + decimals + 1)
  }

  /**
   * Подпись допустимого диапазона дат (легаси renderInput ~177–181, sanitizeDateRangeText).
   *
   * @param {*} validDateFrom
   * @param {*} validDateTo
   * @returns {string|null} `null` — даты не заданы, view оставляет поле пустым
   */
  formatAcceptableRange(validDateFrom, validDateTo) {
    if (validDateFrom === undefined || validDateTo === undefined) {
      return null
    }

    const from = this._sanitizeDateRangeText(String(validDateFrom))
    const to = this._sanitizeDateRangeText(String(validDateTo))

    return `${from} - ${to}`
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  _sanitizeDateRangeText(str) {
    if (typeof str !== 'string') {
      return ''
    }

    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  }

  /**
   * `MM.YYYY` или `DD.MM.YYYY` → `Date` (копия `parseDate` из легаси utils.js).
   *
   * @param {string|null|undefined} dateStr
   * @returns {Date|null}
   */
  parseStressMonthDate(dateStr) {
    if (dateStr == null || dateStr === '') {
      return null
    }

    const parts = String(dateStr).split('.')

    if (parts.length !== 3) {
      const month = parseInt(parts[0], 10) - 1
      const year = parseInt(parts[1], 10)

      if (Number.isNaN(month) || Number.isNaN(year)) {
        return null
      }

      return new Date(year, month, 1)
    }

    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)

    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      return null
    }

    return new Date(year, month, day)
  }

  /**
   * Границы исторического диапазона из модели (легаси: `dateFrom`/`dateTo` в структуре, `historicalRange*` после fillHistoricalRange).
   *
   * @param {Object} row
   * @returns {{ from: *, to: * }}
   */
  resolveHistoricalRangeBounds(row) {
    const from =
      row.historicalRangeFrom != null && row.historicalRangeFrom !== ''
        ? row.historicalRangeFrom
        : row.dateFrom
    const to =
      row.historicalRangeTo != null && row.historicalRangeTo !== ''
        ? row.historicalRangeTo
        : row.dateTo

    return { from, to }
  }

  /**
   * Сообщения об ошибках исторического диапазона (легаси checkRangeDate ~810–846). Без DOM.
   *
   * @param {Object} row
   * @returns {{ historicalErrorMessages: string[], acceptableRangeHasError: boolean }}
   */
  resolveRangeDateValidation(row) {
    const historicalErrorMessages = []
    let acceptableRangeHasError = false
    const { from: historicalRangeFrom, to: historicalRangeTo } = this.resolveHistoricalRangeBounds(row)

    if (row.validDateFrom === undefined || row.validDateTo === undefined) {
      acceptableRangeHasError = true
    }

    if (historicalRangeFrom === undefined || historicalRangeFrom === null || historicalRangeFrom === '') {
      historicalErrorMessages.push('Нет данных за указанный период')
    } else {
      const hasValidDate = row.validDateFrom !== undefined
      const validFrom = hasValidDate ? this.parseStressMonthDate(row.validDateFrom) : null
      const historicalFrom = this.parseStressMonthDate(historicalRangeFrom)

      if (!hasValidDate || historicalFrom < validFrom) {
        historicalErrorMessages.push(`Нет данных за ${historicalRangeFrom}`)
      }
    }

    if (historicalRangeTo === undefined || historicalRangeTo === null || historicalRangeTo === '') {
      historicalErrorMessages.push('Нет данных за указанный период')
    } else {
      const hasValidDate = row.validDateTo !== undefined
      const validTo = hasValidDate ? this.parseStressMonthDate(row.validDateTo) : null
      const historicalTo = this.parseStressMonthDate(historicalRangeTo)

      if (!hasValidDate || historicalTo > validTo) {
        historicalErrorMessages.push(`Нет данных за ${historicalRangeTo}`)
      }
    }

    return { historicalErrorMessages, acceptableRangeHasError }
  }

  /**
   * Подпись исторического диапазона для mode=view (легаси fillHistoricalRange / initInputHistoricalRange).
   *
   * @param {*} historicalRangeFrom
   * @param {*} historicalRangeTo
   * @returns {string}
   */
  formatHistoricalRangeDisplay(historicalRangeFrom, historicalRangeTo) {
    const from =
      historicalRangeFrom != null && historicalRangeFrom !== ''
        ? String(historicalRangeFrom)
        : ''
    const to =
      historicalRangeTo != null && historicalRangeTo !== ''
        ? String(historicalRangeTo)
        : ''

    if (from === '' && to === '') {
      return ''
    }

    if (from !== '' && to !== '') {
      return `${from} - ${to}`
    }

    if (from !== '') {
      return `${from} - `
    }

    return ` - ${to}`
  }

  /**
   * Значение `MM.YYYY` → ISO-дата первого дня месяца для AirDatepicker (легаси initInputHistoricalRange).
   *
   * @param {string|null|undefined} monthValue
   * @returns {string|null}
   */
  historicalMonthToIsoDate(monthValue) {
    if (monthValue == null || monthValue === '') {
      return null
    }

    const parts = String(monthValue).split('.')

    if (parts.length < 2) {
      return null
    }

    return parts.reverse().join('-') + '-01'
  }

  /**
   * ISO `YYYY-MM-DD` → `MM.YYYY` (легаси дефолты initInputHistoricalRange).
   *
   * @param {string} isoDate
   * @returns {string}
   */
  isoDateToHistoricalMonth(isoDate) {
    const parts = String(isoDate).split('-')

    if (parts.length < 2) {
      return ''
    }

    return `${parts[1]}.${parts[0]}`
  }

  /**
   * `Date` → `MM.YYYY` для модели строки (легаси formatDate в fillHistoricalRange).
   *
   * @param {Date} date
   * @returns {string}
   */
  formatDateToHistoricalMonth(date) {
    return this.isoDateToHistoricalMonth(this._dateToIso(date))
  }

  /**
   * Выбранная дата из экземпляра AirDatepicker.
   *
   * @param {*} picker
   * @returns {Date|undefined}
   */
  getPickerSelectedDate(picker) {
    if (!picker || !picker.selectedDates || picker.selectedDates.length === 0) {
      return undefined
    }

    const raw = picker.selectedDates[0]

    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      return raw
    }

    const parsed = new Date(raw)

    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  /**
   * Состояние пикеров → patch модели и подпись view (легаси fillHistoricalRange ~749–769).
   *
   * @param {*} fromPicker
   * @param {*} toPicker
   * @returns {{ patch: { historicalRangeFrom: string|undefined, historicalRangeTo: string|undefined }, viewLabel: string }}
   */
  buildHistoricalRangePatchFromPickers(fromPicker, toPicker) {
    const fromDate = this.getPickerSelectedDate(fromPicker)
    const toDate = this.getPickerSelectedDate(toPicker)

    /** @type {{ historicalRangeFrom?: string, historicalRangeTo?: string }} */
    const patch = {}
    let historicalRangeFrom
    let historicalRangeTo

    if (fromDate !== undefined) {
      historicalRangeFrom = this.formatDateToHistoricalMonth(fromDate)
      patch.historicalRangeFrom = historicalRangeFrom
    }

    if (toDate !== undefined) {
      historicalRangeTo = this.formatDateToHistoricalMonth(toDate)
      patch.historicalRangeTo = historicalRangeTo
    }

    const rowFrom = patch.historicalRangeFrom
    const rowTo = patch.historicalRangeTo

    return {
      patch,
      viewLabel: this.formatHistoricalRangeDisplay(rowFrom, rowTo),
    }
  }

  /**
   * Дефолтный исторический диапазон для новой строки (легаси moment: −3 года / −1 месяц, 1-е число).
   *
   * @returns {{ from: string, to: string, fromIso: string, toIso: string }}
   */
  getDefaultHistoricalRangeMonths() {
    if (typeof moment === 'function') {
      const fromIso = moment().subtract(3, 'year').date(1).format('YYYY-MM-DD')
      const toIso = moment().subtract(1, 'month').date(1).format('YYYY-MM-DD')

      return {
        from: this.isoDateToHistoricalMonth(fromIso),
        to: this.isoDateToHistoricalMonth(toIso),
        fromIso,
        toIso,
      }
    }

    const now = new Date()
    const from = new Date(now.getFullYear() - 3, now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const fromIso = this._dateToIso(from)
    const toIso = this._dateToIso(to)

    return {
      from: this.isoDateToHistoricalMonth(fromIso),
      to: this.isoDateToHistoricalMonth(toIso),
      fromIso,
      toIso,
    }
  }

  /**
   * @param {Date} date
   * @returns {string}
   */
  _dateToIso(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  /**
   * Подставить дефолты в модель, если граница не задана (легаси initInputHistoricalRange).
   *
   * @param {Object} row
   * @returns {Object|null}
   */
  buildHistoricalRangeDefaultsPatch(row) {
    const from = row.historicalRangeFrom != null ? row.historicalRangeFrom : row.dateFrom
    const to = row.historicalRangeTo != null ? row.historicalRangeTo : row.dateTo
    const patch = {}
    const defaults = this.getDefaultHistoricalRangeMonths()

    if (from == null || from === '') {
      patch.historicalRangeFrom = defaults.from
    }

    if (to == null || to === '') {
      patch.historicalRangeTo = defaults.to
    }

    return Object.keys(patch).length > 0 ? patch : null
  }

  /**
   * ISO-даты и подпись view для инициализации AirDatepicker.
   *
   * @param {Object} row
   * @returns {{ fromIso: string, toIso: string, viewLabel: string }}
   */
  resolveHistoricalRangePickerDates(row) {
    const fromMonth = row.historicalRangeFrom != null ? row.historicalRangeFrom : row.dateFrom
    const toMonth = row.historicalRangeTo != null ? row.historicalRangeTo : row.dateTo
    const defaults = this.getDefaultHistoricalRangeMonths()

    const fromIso = this.historicalMonthToIsoDate(fromMonth) || defaults.fromIso
    const toIso = this.historicalMonthToIsoDate(toMonth) || defaults.toIso

    return {
      fromIso,
      toIso,
      viewLabel: this.formatHistoricalRangeDisplay(
        fromMonth != null && fromMonth !== '' ? String(fromMonth) : this.isoDateToHistoricalMonth(fromIso),
        toMonth != null && toMonth !== '' ? String(toMonth) : this.isoDateToHistoricalMonth(toIso),
      ),
    }
  }

  /**
   * Режим view/editor строки (легаси renderInput ~110–112).
   *
   * @param {Object} row
   * @returns {{ isViewMode: boolean, optionsUseEditorMode: boolean }}
   */
  resolveRowViewMode(row) {
    const isViewMode = this._isLoadedIndicatorRow(row)

    return {
      isViewMode,
      optionsUseEditorMode: !isViewMode,
    }
  }

  /**
   * Режим view: только `getParamFromRequest === false` (после save строки или загрузки из структуры).
   *
   * @param {Object} row
   * @returns {boolean}
   */
  _isLoadedIndicatorRow(row) {
    return row.getParamFromRequest === false
  }

  /**
   * Состояние строки с загруженным Excel для отрисовки (легаси renderInput ~144–171, без кнопок fileInfo).
   *
   * @param {Object} row
   * @returns {{ hasExcel: boolean, rowColorClass: string|null, hideDistribution: boolean, hideHistoricalRange: boolean }}
   */
  resolveExcelRowState(row) {
    const guid = row.ExcelGUID
    const hasExcel = guid !== '' && guid !== undefined && guid !== null

    if (!hasExcel) {
      return {
        hasExcel: false,
        rowColorClass: null,
        hideDistribution: false,
        hideHistoricalRange: false,
      }
    }

    let rowColorClass = null
    let hideDistribution = false

    if (row.ExcelType === 2) {
      rowColorClass = 'ListRow__yellow'
      hideDistribution = true
    } else if (row.ExcelType === 1) {
      rowColorClass = 'ListRow__green'
      hideDistribution = false
    }

    return {
      hasExcel: true,
      rowColorClass,
      hideDistribution,
      hideHistoricalRange: true,
    }
  }

  /**
   * `CheckSingleStructure` для строки Input (легаси `checkIndicator`).
   *
   * @param {Object} row
   * @param {Object|null|undefined} params
   * @returns {Promise<{ missingParams: boolean, isError?: boolean, status?: number, message?: string }>}
   */
  async checkIndicatorStructure(row, params) {
    const payload = this._buildCheckSingleStructurePayload(row, params)

    if (payload == null) {
      return { missingParams: true }
    }

    const response = await this.apiClient.checkSingleStructure(
      payload,
      this.apiClient.getUserId(),
      params.versionId,
    )

    const isError = !this.apiClient.checkModuleResponse(response)

    return {
      missingParams: false,
      isError,
      status: isError ? -1 : 0,
      message: response && response.message != null ? String(response.message) : '',
    }
  }

  /**
   * Класс ошибки строки по полю status (легаси ~146–147).
   *
   * @param {Object} row
   * @returns {{ applyErrorClass: boolean, hasError: boolean }}
   */
  resolveRowErrorState(row) {
    if (row.status === undefined || row.status === null || row.status === '') {
      return { applyErrorClass: false, hasError: false }
    }

    const status = Number(row.status)

    if (Number.isNaN(status)) {
      return { applyErrorClass: false, hasError: false }
    }

    return { applyErrorClass: true, hasError: status !== 0 }
  }

  /**
   * Состояние кнопки analytics (легаси index.initBtnAnalysts ~478–510).
   *
   * @param {Object|null} analytics
   * @returns {{ tooltipText: string, fillColor: string, disabled: boolean }}
   */
  resolveAnalyticsButtonState(analytics) {
    const hasAnalytics =
      analytics != null && typeof analytics === 'object' && Object.keys(analytics).length > 0

    return {
      tooltipText: hasAnalytics ? 'Аналитики' : 'Нет аналитик',
      fillColor: hasAnalytics ? '#004c97' : '#404040',
      disabled: !hasAnalytics,
    }
  }

  /**
   * Кнопки fileInfo / fileRemove при загруженном Excel (легаси ~163–170; без обработчика удаления).
   *
   * @param {Object} row
   * @returns {{ visible: boolean, fileInfoTooltip: string|null }}
   */
  resolveExcelFileButtons(row) {
    const guid = row.ExcelGUID
    const hasExcel = guid !== '' && guid !== undefined && guid !== null

    if (!hasExcel) {
      return { visible: false, fileInfoTooltip: null }
    }

    const name = row.ExcelName
    const fileInfoTooltip =
      name !== undefined && name !== null && String(name) !== '' ? String(name) : null

    return { visible: true, fileInfoTooltip }
  }

  /**
   * Сброс полей Excel в модели (п. 6.4, легаси handleDeleteExcelDataSetResponse без API).
   *
   * @returns {{ ExcelGUID: string, ExcelType: string, ExcelName: string }}
   */
  buildExcelClearPatch() {
    return {
      ExcelGUID: '',
      ExcelType: '',
      ExcelName: '',
    }
  }

  /**
   * DeleteExcelDataSet (п.19 §8.1; легасi `index.removeFile` → `handleDeleteExcelDataSetResponse`).
   *
   * @param {string} excelGuid
   * @param {Object|null|undefined} params — блок Params (`versionId`)
   * @returns {Promise<{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   * }>}
   */
  async deleteExcelDataSet(excelGuid, params) {
    if (excelGuid == null || String(excelGuid) === '') {
      return { ok: false, message: null }
    }

    if (!params || params.versionId == null || String(params.versionId) === '') {
      return { ok: false, message: null }
    }

    const payload = { ExcelGUID: String(excelGuid) }
    const response = await this.apiClient.deleteExcelDataSet(
      payload,
      this.apiClient.getUserId(),
      params.versionId,
    )

    return this._parseDeleteExcelDataSetResponse(response)
  }

  /**
   * @param {*} response
   * @returns {{
   *   ok: boolean,
   *   fault?: boolean,
   *   moduleError?: boolean,
   *   message?: string|null,
   * }}
   */
  _parseDeleteExcelDataSetResponse(response) {
    if (response?.faultstring?.length > 0) {
      return { ok: false, fault: true }
    }

    if (this.apiClient.checkModuleResponse(response)) {
      return { ok: true }
    }

    const message = response?.message != null ? String(response.message) : ''

    return { ok: false, moduleError: true, message }
  }

  /**
   * TYPE распределения/модели по имени (легаси getTypeDistributionByName → distributionEls).
   *
   * @param {string|null|undefined} distributionName
   * @param {Array<{ name: string, distributionType?: 1|2 }>} distributionOptions
   * @returns {1|2|null}
   */
  resolveDistributionTypeByName(distributionName, distributionOptions) {
    if (distributionName == null || distributionName === '') {
      return null
    }

    const item = (distributionOptions || []).find((option) => option.name === distributionName)

    if (item == null || item.distributionType == null) {
      return null
    }

    return item.distributionType === 2 ? 2 : 1
  }

  /**
   * Видимость HistoricalRange после смены распределения (легаси ~558–562).
   *
   * @param {Object} row
   * @returns {{ hideHistoricalRange: boolean, clearDateErrors: boolean }}
   */
  resolveHistoricalRangeAfterDistributionChange(row) {
    const guid = row.ExcelGUID
    const hasExcel = guid !== '' && guid !== undefined && guid !== null

    if (!hasExcel) {
      return { hideHistoricalRange: false, clearDateErrors: false }
    }

    return { hideHistoricalRange: true, clearDateErrors: true }
  }

  /**
   * Разбор выбора показателя из Select2 (легаси initInputIndicator select2:select ~436–447).
   *
   * @param {Object|Array} select2Data — `e.params.data`
   * @returns {{ indicatorId: *|null, indicatorName: string }|null}
   */
  parseIndicatorFromSelect2(select2Data) {
    if (select2Data == null) {
      return null
    }

    let selected = null

    if (Array.isArray(select2Data)) {
      const found = select2Data.find((el) => el.selected === true)
      if (found !== undefined) {
        selected = found.text
      }
    } else if (select2Data.text != null) {
      selected = select2Data.text
    }

    if (!selected || typeof selected !== 'string') {
      return null
    }

    const parts = selected.split('#;')
    const indicatorName = parts.length > 1 ? parts[1] : selected
    const idRaw =
      parts.length > 1 ? parts[0] : select2Data.id != null ? String(select2Data.id) : ''
    const indicatorId =
      idRaw === ''
        ? null
        : Number(idRaw).toString() === idRaw
          ? Number(idRaw)
          : idRaw

    return { indicatorId, indicatorName }
  }

  /**
   * Разбор выбора распределения из Select2 (легаси initInputDistribution select2:select ~529–546).
   *
   * @param {Object|Array} select2Data — `e.params.data`
   * @returns {{ distributionId: *|null, distributionName: string }|null}
   */
  parseDistributionFromSelect2(select2Data) {
    if (select2Data == null) {
      return null
    }

    let selected = null

    if (Array.isArray(select2Data)) {
      const found = select2Data.find((el) => el.selected === true)
      if (found !== undefined) {
        selected = found.text
      }
    } else if (select2Data.text != null) {
      selected = select2Data.text
    }

    if (!selected || typeof selected !== 'string') {
      return null
    }

    const parts = selected.split('#;')
    const distributionName = parts.length > 1 ? parts[1] : selected
    const idRaw =
      parts.length > 1 ? parts[0] : select2Data.id != null ? String(select2Data.id) : ''
    const distributionId =
      idRaw === ''
        ? null
        : Number(idRaw).toString() === idRaw
          ? Number(idRaw)
          : idRaw

    return { distributionId, distributionName }
  }

  /**
   * Элементы справочника DISTRIBUTION_PARAM → параметры строки (легаси applyDistributionParamsData).
   *
   * @param {Array} items
   * @returns {Array<{ name: string, value: string, isCheckValidValue?: boolean }>}
   */
  mapDistributionParamsFromDimElements(items) {
    const params = []

    for (let i = 0; i < (items || []).length; i += 1) {
      const item = items[i]
      const visibleFlag = item != null && item.a != null && item.a.it != null ? item.a.it[5] : null

      if (visibleFlag !== '1' && visibleFlag !== 1) {
        continue
      }

      const eaIt = item.ea != null ? item.ea.it : null
      const checkAttr = Array.isArray(eaIt) && eaIt[4] != null ? eaIt[4]['@v'] : undefined

      params.push({
        name: item.n != null ? String(item.n) : '',
        value: '0',
        isCheckValidValue: checkAttr === '4',
      })
    }

    return this.normalizeDistributionParams(params)
  }

  /**
   * Загрузка параметров распределения по id (легаси fillDistributionOptions).
   *
   * @param {string|number} distributionId
   * @returns {Promise<Array<{ name: string, value: string, isCheckValidValue?: boolean }>>}
   */
  async loadDistributionParams(distributionId) {
    const raw = await this.apiClient.getDistributionParamDimElements(distributionId)
    return this.mapDistributionParamsFromDimElements(raw)
  }

  /**
   * JSON для Fore CheckData — допустимый диапазон дат по показателю (легаси updateInputValidDateRange ~856–871).
   *
   * @param {Object} row
   * @param {Object|null} params — `versionId` (версия прогноза из Params)
   * @returns {Object|null} `null` — нет `versionId`, запрос не выполняется
   */
  buildCheckDataRequestPayload(row, params) {
    if (!params || params.versionId == null || String(params.versionId) === '') {
      return null
    }

    const payload = {
      prognozVersion: Number(params.versionId),
      indicatorId: row.indicatorId,
      analytics: this._mapAnalyticsToModule(row.analytics),
    }

    return payload
  }

  /**
   * Запрос допустимого диапазона дат (StressApi.checkData / CheckData). Без DOM (п. 5.4).
   *
   * @param {Object} row
   * @param {Object|null} params
   * @returns {Promise<*|null>} ответ модуля; `null` — нет `versionId`
   */
  async fetchValidDateRange(row, params) {
    const json = this.buildCheckDataRequestPayload(row, params)

    if (json == null) {
      return null
    }

    const userId = this.apiClient.getUserId()

    return await this.apiClient.checkData(json, userId, params.versionId)
  }

  /**
   * В модели уже есть обе границы — запрос CheckData не нужен (легаси renderInput ~177–184).
   *
   * @param {Object} row
   * @returns {boolean}
   */
  hasStoredValidDateRange(row) {
    return row.validDateFrom !== undefined && row.validDateTo !== undefined
  }

  /**
   * Разбор ответа CheckData (легаси handleCheckDataResponse ~892–909). Без DOM.
   *
   * @param {*} apiResponse
   * @returns {{ ok: true, validDateFrom: *, validDateTo: *, label: string }|{ ok: false, errorLabel: string }}
   */
  parseCheckDataValidRangeResponse(apiResponse) {
    const errorResult = { ok: false, errorLabel: 'Нет данных' }

    if (!this.apiClient.checkModuleResponse(apiResponse)) {
      return errorResult
    }

    try {
      const result =
        typeof apiResponse.message === 'string'
          ? JSON.parse(apiResponse.message)
          : apiResponse.message

      const validDateFrom = result.validDateFrom
      const validDateTo = result.validDateTo
      const label =
        this.formatAcceptableRange(validDateFrom, validDateTo) ??
        `${this._sanitizeDateRangeText(String(validDateFrom || ''))} - ${this._sanitizeDateRangeText(String(validDateTo || ''))}`

      return {
        ok: true,
        validDateFrom,
        validDateTo,
        label,
      }
    } catch (err) {
      console.error('InputService.parseCheckDataValidRangeResponse', err)
      return errorResult
    }
  }

  /**
   * @returns {Promise<Object|null>}
   */
  async loadDistributionPayload() {
    return null
  }

  /**
   * @returns {Promise<Array>}
   */
  async parseUploadedIndicators() {
    return []
  }

  /**
   * JSON для `SaveExcelDataSet` / `GetExcelDataSets` (п.19 §0.4).
   * Legacy: `prop` в `UploadFilePopUp.send` / `ArrayDataPopUp.loadingArrayDataByType`.
   *
   * @param {Object} sessionContext — `indicatorId`, `analytics`, `historicalRangeFrom`, `historicalRangeTo`, `excelType?`
   * @param {Object|null|undefined} params — блок Params (`versionId`, `startDate`, `endDate`, `iterations`, `simulations`)
   * @param {{
   *   excelType?: 1|2,
   *   excelId?: string,
   *   excelName?: string,
   *   excelGuid?: string,
   *   includeIterationCounts?: boolean,
   * }} [extras]
   * @returns {Object|null} `null` — нет `versionId` / `indicatorId` или для Save нет iterations/simulations
   */
  buildExcelRequestPayload(sessionContext, params, extras) {
    if (!sessionContext || !params || params.versionId == null || String(params.versionId) === '') {
      return null
    }

    const indicatorId = sessionContext.indicatorId

    if (indicatorId == null || String(indicatorId) === '') {
      return null
    }

    const { from: historicalFrom, to: historicalTo } = this._resolveCheckHistoricalDates({
      historicalRangeFrom: sessionContext.historicalRangeFrom,
      historicalRangeTo: sessionContext.historicalRangeTo,
    })

    /** @type {Object} */
    const payload = {
      prognozVersion: Number(params.versionId),
      indicatorId,
      forecastData: {
        dateFrom: this._normalizeMonthForModulePayload(params.startDate),
        dateTo: this._normalizeMonthForModulePayload(params.endDate),
      },
      dateFrom: this._normalizeMonthForModulePayload(historicalFrom),
      dateTo: this._normalizeMonthForModulePayload(historicalTo),
      analytics: this._mapAnalyticsToModule(sessionContext.analytics),
    }

    if (extras && extras.includeIterationCounts === true) {
      const iterations = params.iterations
      const simulations = params.simulations

      if (
        iterations == null
        || String(iterations) === ''
        || simulations == null
        || String(simulations) === ''
      ) {
        return null
      }

      payload.IterationCount = String(iterations)
      payload.SimulationCount = String(simulations)
    }

    const excelType =
      extras && extras.excelType != null
        ? extras.excelType
        : sessionContext.excelType

    if (excelType != null && excelType !== '') {
      payload.ExcelType = Number(excelType) === 2 ? 2 : 1
    }

    if (extras) {
      if (extras.excelId != null && String(extras.excelId) !== '') {
        payload.ExcelID = String(extras.excelId)
      }

      if (extras.excelName != null && String(extras.excelName) !== '') {
        payload.ExcelName = String(extras.excelName)
      }

      if (extras.excelGuid != null && String(extras.excelGuid) !== '') {
        payload.ExcelGUID = String(extras.excelGuid)
      }
    }

    return payload
  }

  /**
   * Дата → `MM.YYYY` для `CheckSingleStructure` (легаси `formatDate` в `checkIndicator`).
   *
   * @param {*} value — `YYYY-MM-DD`, `MM.YYYY`, `DD.MM.YYYY`
   * @returns {string}
   */
  _normalizeMonthForModulePayload(value) {
    if (value == null || value === '') {
      return ''
    }

    const s = String(value).trim()
    const isoMatch = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(s)

    if (isoMatch) {
      return `${isoMatch[2]}.${isoMatch[1]}`
    }

    const dotParts = s.split('.')

    if (dotParts.length === 3) {
      const month = dotParts[1]
      const year = dotParts[2]

      if (month && year) {
        return `${month}.${year}`
      }
    }

    if (dotParts.length === 2) {
      return s
    }

    return s
  }

  /**
   * Нормализация analytics из структуры / попапа (дефолты модуля, легаси `item.analytics`).
   *
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  normalizeAnalytics(analytics) {
    return this._mapAnalyticsToModule(analytics)
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  _mapAnalyticsToModule(analytics) {
    const result = { ...InputService._MODULE_ANALYTICS_DEFAULTS }

    if (analytics == null || typeof analytics !== 'object') {
      return result
    }

    Object.keys(InputService._MODULE_ANALYTICS_DEFAULTS).forEach((key) => {
      if (analytics[key] !== undefined && analytics[key] !== null) {
        result[key] = String(analytics[key])
      }
    })

    return result
  }

  /**
   * Граница исторического диапазона для check (пустая строка = не задано).
   *
   * @param {*} value
   * @returns {string|null}
   */
  _pickHistoricalMonthBound(value) {
    if (value == null || String(value).trim() === '') {
      return null
    }

    return String(value).trim()
  }

  /**
   * Исторический диапазон для `CheckSingleStructure` (легаси `renderInput` ~103–104: `dateFrom` → `historicalRange*`).
   *
   * @param {Object} row
   * @returns {{ from: string, to: string }}
   */
  _resolveCheckHistoricalDates(row) {
    const fromBound = this._pickHistoricalMonthBound(
      row.historicalRangeFrom != null ? row.historicalRangeFrom : row.dateFrom,
    )
    const toBound = this._pickHistoricalMonthBound(
      row.historicalRangeTo != null ? row.historicalRangeTo : row.dateTo,
    )

    if (fromBound && toBound) {
      return { from: fromBound, to: toBound }
    }

    const defaults = this.getDefaultHistoricalRangeMonths()

    return {
      from: fromBound || defaults.from,
      to: toBound || defaults.to,
    }
  }

  /**
   * JSON для `CheckSingleStructure` по строке Input (легаси `index.checkIndicator`).
   *
   * @param {Object} row
   * @param {Object|null|undefined} params
   * @returns {Object|null}
   */
  _buildCheckSingleStructurePayload(row, params) {
    if (row == null || params == null) {
      return null
    }

    const versionId = params.versionId
    const iterations = params.iterations
    const simulations = params.simulations
    const indicatorId = row.indicatorId != null ? row.indicatorId : row.key

    if (
      versionId == null
      || String(versionId) === ''
      || iterations == null
      || String(iterations) === ''
      || simulations == null
      || String(simulations) === ''
    ) {
      return null
    }

    const forecastFrom = params.startDate != null ? String(params.startDate) : ''
    const forecastTo = params.endDate != null ? String(params.endDate) : ''
    const { from: historicalFrom, to: historicalTo } = this._resolveCheckHistoricalDates(row)

    /** @type {Object} */
    const json = {
      prognozVersion: Number(versionId),
      indicatorId,
      forecastData: {
        dateFrom: this._normalizeMonthForModulePayload(forecastFrom),
        dateTo: this._normalizeMonthForModulePayload(forecastTo),
      },
      IterationCount: String(iterations),
      SimulationCount: String(simulations),
      analytics: this._mapAnalyticsToModule(row.analytics),
      dateFrom: this._normalizeMonthForModulePayload(historicalFrom),
      dateTo: this._normalizeMonthForModulePayload(historicalTo),
    }

    if (row.ExcelType !== undefined && row.ExcelType === 2) {
      json.ExcelGUID = row.ExcelGUID
      json.ExcelType = row.ExcelType
    }

    return json
  }
}
