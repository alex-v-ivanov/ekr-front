/**
 * ParamsView — DOM и виджеты блока параметров отчёта.
 * jQuery, Select2, AirDatepicker; состояние и запросы — в ParamsController.
 */

/* global $, AirDatepicker, tippy */

export class ParamsView {

  constructor(paramsController) {
    this.controller = paramsController
    this.dateParamFromDp = null
    this.dateParamToDp = null
    this.prognozVersionCombo$ = null
    this._lastPrognozVersionSelect2Data = []
    this.iterationCountCombo$ = null
    this._lastIterationCountSelect2Data = []
    this.simulationCountCombo$ = null
    this._lastSimulationCountSelect2Data = []
    this.paramsMessagesEl = null
  }

  /** Находит поля на странице, подключает виджеты, передаёт начальные значения в контроллер. */
  bind(root) {
    this._initParamsMessagesHost(root)

    this.startDateEl = root.querySelector('#DateParamFrom')
    this.endDateEl = root.querySelector('#DateParamTo')
    this.versionIdEl = root.querySelector('#PrognozVersionCombo')
    this.iterationsEl = root.querySelector('#IterationCountCombo')
    this.simulationsEl = root.querySelector('#SimulationCount')
    this.stressTestNameEl = root.querySelector('#stress_test_name')

    const periodPickerBase = {
      view: 'months',
      minView: 'months',
      dateFormat: 'MMMM yyyy',
    }
    this._suppressPeriodPickerSelect = false

    this.dateParamToDp = new AirDatepicker(this.endDateEl, {
      ...periodPickerBase,
      onSelect: () => {
        if (this._suppressPeriodPickerSelect) {
          return
        }

        void this.controller.onDateParamToSelected()
      },
    })
    this.dateParamFromDp = new AirDatepicker(this.startDateEl, {
      ...periodPickerBase,
      onSelect: () => {
        if (this._suppressPeriodPickerSelect) {
          return
        }

        const from = this.dateParamFromDp.selectedDates[0]

        if (from) {
          this.dateParamToDp.update({ minDate: from })
        }

        this._clearEndDatePickerSilently()
        void this.controller.onDateParamFromSelected()
      },
    })
    this.setPeriodDates('2024-01-01', '2024-12-31')

    this._initPrognozVersionCombo()
    this._initIterationCountCombo()
    this._initSimulationCountCombo()
    this._initStressTestName()

    this._initTooltips(root)
  }

  /** Значения полей params после bind; читает ParamsController.initOnPageLoad. */
  getBindFormValues() {
    return {
      versionId: this._getPrognozVersionComboValue(),
      iterations: this._getIterationCountComboValue(),
      simulations: this._getSimulationCountComboValue(),
      stressTestName: this._getStressTestNameValue(),
    }
  }

  /**
   * Подсказки tippy на иконках блока параметров (легаси StressUI.initTooltip).
   *
   * @param {HTMLElement|Document} root
   */
  _initTooltips(root) {
    if (typeof tippy !== 'function') {
      return
    }

    const scope = root.querySelector('.block-parameters') || root

    scope.querySelectorAll('[tooltipe]').forEach((element) => {
      const text = element.getAttribute('tooltipe')

      if (text == null || text === '') {
        return
      }

      if (element._tippy) {
        element._tippy.destroy()
      }

      tippy(element, {
        content: '<p class="tooltipe__text">' + text + '</p>',
        animation: 'fade',
        followCursor: true,
        arrow: false,
        allowHTML: true,
      })
    })
  }

  /**
   * Контейнер сообщений зоны params: `[data-params-messages]` или `.block-parameters__messages`;
   * иначе создаётся в начале `.block-parameters`.
   */
  _initParamsMessagesHost(root) {
    this.paramsMessagesEl =
      root.querySelector('[data-params-messages]') ||
      root.querySelector('.block-parameters__messages')

    if (this.paramsMessagesEl) {
      return
    }

    const block = root.querySelector('.block-parameters')
    if (!block) {
      return
    }

    this.paramsMessagesEl = document.createElement('div')
    this.paramsMessagesEl.className = 'block-parameters__messages'
    this.paramsMessagesEl.setAttribute('data-params-messages', '')
    block.insertBefore(this.paramsMessagesEl, block.firstChild)
  }

  /** Поле имени сценария: change → params (в легаси читается при RunTest). */
  _initStressTestName() {
    this.stressTestNameEl.addEventListener('change', () => {
      void this.controller.onChangeParam('stressTestName', this._getStressTestNameValue())
    })
  }

  /** Select2 на комбо версии прогноза: UI-события и пустой список до первой загрузки. */
  _initPrognozVersionCombo() {
    this.prognozVersionCombo$ = $(this.versionIdEl)
    this._bindSelect2DropdownUi(this.prognozVersionCombo$)
    this.prognozVersionCombo$.on('select2:select', (e) => {
      const res = $(e.target).select2('data')
      if (res.length > 0) {
        const versionId = String(res[0].text).split('#;')[0]
        void this.controller.onChangeParam('versionId', versionId)
      }
    })
    this.prognozVersionCombo$.on('select2:unselect', () => {
      void this.controller.onChangeParam('versionId', null)
    })
    this.setForecastVersionOptions([], null)
  }

  /** Select2 на комбо итераций: пустой список до загрузки Dim. */
  _initIterationCountCombo() {
    this.iterationCountCombo$ = $(this.iterationsEl)
    this._bindSelect2DropdownUi(this.iterationCountCombo$)
    this.iterationCountCombo$.on('select2:select', (e) => {
      const res = $(e.target).select2('data')
      if (res.length > 0) {
        void this.controller.onChangeParam('iterations', String(res[0].text))
      }
    })
    this.iterationCountCombo$.on('select2:unselect', () => {
      void this.controller.onChangeParam('iterations', null)
    })
    this.setIterationCountOptions([], null)
  }

  /** Select2 на комбо симуляций: пустой список до refreshSimulationCountCombo. */
  _initSimulationCountCombo() {
    this.simulationCountCombo$ = $(this.simulationsEl)
    this._bindSelect2DropdownUi(this.simulationCountCombo$)
    this.simulationCountCombo$.on('select2:select', (e) => {
      const res = $(e.target).select2('data')
      if (res.length > 0) {
        void this.controller.onChangeParam('simulations', String(res[0].text))
      }
    })
    this.simulationCountCombo$.on('select2:unselect', () => {
      void this.controller.onChangeParam('simulations', null)
    })
    this.setSimulationCountOptions([], null)
  }

  /** Настройки Select2 для списка версий прогноза. */
  _prognozVersionSelect2Options(data) {
    return {
      data,
      templateResult: (state) => this._formatForecastVersionState(state),
      templateSelection: (state) => this._formatForecastVersionSelected(state),
      width: '200px',
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      dropdownParent: this.prognozVersionCombo$.parent(),
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) =>
          args.maximum > 1
            ? `Можно выбрать только ${args.maximum} элемента`
            : 'Можно выбрать только 1 элемент',
      },
      adaptDropdownCssClass: () => '',
    }
  }

  /** Как выглядит пункт в выпадающем списке версий (только название). */
  _formatForecastVersionState(state) {
    if (!state.id) {
      return state.text
    }
    const text = state.text.split('#;')[1]
    return $('<p class="dropdown__text">' + text + '</p>')
  }

  /** Настройки Select2 для списка итераций (Dim + tags). */
  _iterationCountSelect2Options(data) {
    return {
      data,
      templateResult: (state) => this._formatIterationCountState(state),
      width: '200px',
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      dropdownParent: this.iterationCountCombo$.parent(),
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) =>
          args.maximum > 1
            ? `Можно выбрать только ${args.maximum} элемента`
            : 'Можно выбрать только 1 элемент',
      },
      adaptDropdownCssClass: () => '',
      tags: true,
      createTag: (params) => {
        if (!/^[0-9]+$/.test(params.term)) {
          return null
        }
        const number = parseInt(params.term, 10)
        if (Number.isNaN(number) || number <= 0 || number > 100000) {
          return null
        }
        if (params.term !== number.toString()) {
          return null
        }
        return { id: params.term, text: params.term }
      },
    }
  }

  /** Настройки Select2 для списка симуляций (1–10 + tags). */
  _simulationCountSelect2Options(data) {
    return {
      data,
      templateResult: (state) => this._formatSimulationCountState(state),
      width: '200px',
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      dropdownParent: this.simulationCountCombo$.parent(),
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) =>
          args.maximum > 1
            ? `Можно выбрать только ${args.maximum} элемента`
            : 'Можно выбрать только 1 элемент',
      },
      adaptDropdownCssClass: () => '',
      tags: true,
      createTag: (params) => {
        if (!/^[0-9]+$/.test(params.term)) {
          return null
        }
        const number = parseInt(params.term, 10)
        if (Number.isNaN(number) || number <= 0 || number > 10) {
          return null
        }
        if (params.term !== number.toString()) {
          return null
        }
        return { id: params.term, text: params.term }
      },
    }
  }

  /** Пункт списка итераций в выпадающем меню. */
  _formatIterationCountState(state) {
    if (!state.id) {
      return state.text
    }
    return $('<p class="dropdown__text">' + state.text + '</p>')
  }

  /** Пункт списка симуляций в выпадающем меню. */
  _formatSimulationCountState(state) {
    if (!state.id) {
      return state.text
    }
    return $('<p class="dropdown__text">' + state.text + '</p>')
  }

  /** Как выглядит выбранная версия в поле (только название). */
  _formatForecastVersionSelected(state) {
    if (!state.id) {
      return state.text
    }
    if (state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }
    return state.text
  }

  /** Стрелка у dropdown и скрытие строки поиска Select2 после выбора. */
  _bindSelect2DropdownUi($el) {
    $el.on('select2:open', () => {
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(180deg)')
    })
    $el.on('select2:select', () => {
      this._hideSelect2InlineSearch($el)
    })
    $el.on('select2:close', () => {
      this._hideSelect2InlineSearch($el)
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(0deg)')
    })
    $el.on('select2:unselect', () => {
      if ($el.val().length < 1) {
        $el.next('.select2-container').find('.select2-search--inline').show()
      }
    })
  }

  /** Скрыть inline-поиск Select2 (multiple + max 1) после программного выбора. */
  _hideSelect2InlineSearch($el) {
    const val = $el.val()

    if (val != null && (Array.isArray(val) ? val.length >= 1 : String(val) !== '')) {
      $el.next('.select2-container').find('.select2-search--inline').hide()
    }
  }

  /** Текущее значение комбо версии прогноза для стартовой синхронизации. */
  _getPrognozVersionComboValue() {
    const val = this.prognozVersionCombo$.val()
    return Array.isArray(val) ? val[0] : val
  }

  /** Текущее значение комбо итераций. */
  _getIterationCountComboValue() {
    const val = this.iterationCountCombo$.val()
    return Array.isArray(val) ? val[0] : val
  }

  /** Текущее значение комбо симуляций. */
  _getSimulationCountComboValue() {
    const val = this.simulationCountCombo$.val()
    return Array.isArray(val) ? val[0] : val
  }

  /** Текущее значение поля имени сценария. */
  _getStressTestNameValue() {
    return this.stressTestNameEl.value
  }

  /** Выбранные месяцы «от» и «до» из календарей. */
  getSelectedPeriodDates() {
    return {
      from: this.dateParamFromDp.selectedDates[0],
      to: this.dateParamToDp.selectedDates[0],
    }
  }

  /**
   * Срез виджетов для run/save — как легасi `getStressParams` читает DOM, а не только `params`.
   *
   * @returns {import('./ParamsValidator.js').ParamsValidationSnapshot}
   */
  getValidationSnapshot() {
    const { from, to } = this.getSelectedPeriodDates()

    return {
      hasPeriodFrom: Boolean(from),
      hasPeriodTo: Boolean(to),
      versionSelect2Val: this.prognozVersionCombo$.val(),
      versionSelect2Data: this.prognozVersionCombo$.select2('data') || [],
      iterationsSelect2Data: this.iterationCountCombo$.select2('data') || [],
      simulationsSelect2Data: this.simulationCountCombo$.select2('data') || [],
    }
  }

  /** Сброс «до» без onSelect (легасi `DateParamToEl.clear` после смены «от»). */
  _clearEndDatePickerSilently() {
    this._suppressPeriodPickerSelect = true
    this.dateParamToDp.clear()
    this._suppressPeriodPickerSelect = false
  }

  /** Выставить период в календарях без вызова onSelect. */
  setPeriodDates(startDate, endDate) {
    this._suppressPeriodPickerSelect = true

    const silent = { silent: true }
    this.dateParamFromDp.selectDate(startDate, silent)
    this.dateParamFromDp.setViewDate(startDate)
    this.dateParamToDp.update({ minDate: startDate })
    this.dateParamToDp.selectDate(endDate, silent)
    this.dateParamToDp.setViewDate(endDate)

    this._suppressPeriodPickerSelect = false
  }

  /**
   * Заполнить комбо версий прогноза и при необходимости выбрать элемент.
   *
   * @param {Array<{ id: *, name: * }>} versions
   * @param {string|number} [selectedId]
   */
  setForecastVersionOptions(versions, selectedId) {
    const data = versions.map((item) => ({
      id: item.id,
      text: `${item.id}#;${item.name}`,
    }))

    this.prognozVersionCombo$.empty().select2(this._prognozVersionSelect2Options(data))
    this._lastPrognozVersionSelect2Data = data

    if (data.length === 0) {
      this._lastPrognozVersionSelect2Data = []
      this._showPrognozVersionNoDataWarning()
      return
    }

    this._clearPrognozVersionNoDataWarning()

    if (selectedId == null || selectedId === '') {
      return
    }

    this._selectPrognozVersionInCombo(data, selectedId, false)
  }

  /**
   * Заполнить комбо итераций и при необходимости выбрать элемент.
   *
   * @param {Array<{ id: *, name: * }>} items
   * @param {string|number|null|undefined} [selectedId] null — первый из списка, если есть
   */
  setIterationCountOptions(items, selectedId) {
    const data = items.map((item) => ({
      id: String(item.id),
      text: String(item.name),
    }))

    if (selectedId != null && selectedId !== '') {
      const key = String(selectedId)
      const exists = data.some((item) => item.id === key || item.text === key)
      if (!exists) {
        data.push({ id: key, text: key })
      }
    }

    this.iterationCountCombo$.empty().select2(this._iterationCountSelect2Options(data))
    this._lastIterationCountSelect2Data = data

    if (data.length === 0) {
      return
    }

    if (selectedId != null && selectedId !== '') {
      this._selectIterationInCombo(data, selectedId, false)
      return
    }

    if (selectedId === null) {
      this._selectIterationInCombo(data, data[0].id, false)
    }
  }

  /**
   * Заполнить комбо симуляций и при необходимости выбрать элемент.
   *
   * @param {Array<{ id: *, name: * }>} items
   * @param {string|number|null|undefined} [selectedId] null — первый из списка, если есть
   */
  setSimulationCountOptions(items, selectedId) {
    const data = items.map((item) => ({
      id: item.id,
      text: item.name,
    }))

    this.simulationCountCombo$.empty().select2(this._simulationCountSelect2Options(data))
    this._lastSimulationCountSelect2Data = data

    if (data.length === 0) {
      return
    }

    if (selectedId != null && selectedId !== '') {
      this._selectSimulationInCombo(data, selectedId, false)
      return
    }

    if (selectedId === null) {
      this._selectSimulationInCombo(data, data[0].id, false)
    }
  }

  /** Показать на странице значения из params (даты — через setPeriodDates). */
  renderParams(params) {
    if (params.versionId != null && this._lastPrognozVersionSelect2Data.length > 0) {
      this._selectPrognozVersionInCombo(this._lastPrognozVersionSelect2Data, params.versionId, false)
    }
    if (params.iterations != null && this._lastIterationCountSelect2Data.length > 0) {
      this._selectIterationInCombo(this._lastIterationCountSelect2Data, params.iterations, false)
    }
    if (params.simulations != null && String(params.simulations) !== '' && this._lastSimulationCountSelect2Data.length > 0) {
      this._selectSimulationInCombo(this._lastSimulationCountSelect2Data, params.simulations, false)
    }
    if (params.stressTestName != null) this.stressTestNameEl.value = String(params.stressTestName)
  }

  /**
   * Выбрать версию в Select2: val, change; при fireSelectEvent — ещё select2:select.
   * После загрузки структуры fireSelectEvent=false, чтобы не вызвать повторный reload в контроллере.
   *
   * @param {Array<{ id: *, text: string }>} data
   * @param {string|number} versionKey ключ версии (часть text до «#;»)
   * @param {boolean} [fireSelectEvent]
   */
  _selectPrognozVersionInCombo(data, versionKey, fireSelectEvent = false) {
    const key = String(versionKey)
    let pick = data.find((item) => {
      const idPart = String(item.id)
      const textKey = String(item.text).split('#;')[0]

      return (
        idPart === key
        || textKey === key
        || (Number(idPart) === Number(key) && !Number.isNaN(Number(key)))
      )
    })

    if (!pick && data.length > 0) {
      pick = data[0]
    }

    if (!pick) {
      return
    }

    this.prognozVersionCombo$.val([String(pick.id)]).trigger('change')
    this._hideSelect2InlineSearch(this.prognozVersionCombo$)
    this._clampPrognozVersionSelectionText()

    if (fireSelectEvent) {
      const select2Event = $.Event('select2:select')
      select2Event.params = { data: pick }
      this.prognozVersionCombo$.trigger(select2Event)
    }
  }

  /**
   * Выбрать итерацию в Select2; при отсутствии в списке — добавить tag-опцию.
   *
   * @param {Array<{ id: *, text: string }>} data
   * @param {string|number} iterationKey
   * @param {boolean} [fireSelectEvent]
   */
  _selectIterationInCombo(data, iterationKey, fireSelectEvent = false) {
    const key = String(iterationKey)
    let pick = data.find((item) => String(item.id) === key || String(item.text) === key)

    if (!pick && key) {
      const extended = data.concat([{ id: key, text: key }])
      this.iterationCountCombo$.empty().select2(this._iterationCountSelect2Options(extended))
      this._lastIterationCountSelect2Data = extended
      pick = { id: key, text: key }
    } else if (!pick && data.length > 0) {
      pick = data[0]
    }

    if (!pick) {
      return
    }

    this.iterationCountCombo$.val([String(pick.id)]).trigger('change')

    if (fireSelectEvent) {
      const select2Event = $.Event('select2:select')
      select2Event.params = { data: pick }
      this.iterationCountCombo$.trigger(select2Event)
    }
  }

  /**
   * Выбрать число симуляций в Select2; при отсутствии в списке — tag-опция (1–10).
   *
   * @param {Array<{ id: *, text: string }>} data
   * @param {string|number} simulationKey
   * @param {boolean} [fireSelectEvent]
   */
  _selectSimulationInCombo(data, simulationKey, fireSelectEvent = false) {
    const key = String(simulationKey)
    let pick = data.find((item) => String(item.id) === key || String(item.text) === key)

    if (!pick && key) {
      const option = new Option(key, key, true, true)
      this.simulationCountCombo$.append(option)
      pick = { id: key, text: key }
    } else if (!pick && data.length > 0) {
      pick = data[0]
    }

    if (!pick) {
      return
    }

    this.simulationCountCombo$.val([pick.id]).trigger('change')

    if (fireSelectEvent) {
      const select2Event = $.Event('select2:select')
      select2Event.params = { data: pick }
      this.simulationCountCombo$.trigger(select2Event)
    }
  }

  /** Одна строка в поле версии: длинное имя сценария не раздувает высоту блока. */
  _clampPrognozVersionSelectionText() {
    const $container = this.prognozVersionCombo$?.next('.select2-container')

    if (!$container?.length) {
      return
    }

    $container.find('.select2-selection__choice__display, .select2-selection__rendered').css({
      maxWidth: '170px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    })
  }

  /** Обёртка блока параметра «версия прогноза» на странице отчёта. */
  _getPrognozVersionBlock$() {
    return this.prognozVersionCombo$.closest('.block-parameters__item')
  }

  /** Пустой список версий: подсветка dropdown и текст «Нет данных». */
  _showPrognozVersionNoDataWarning() {
    const $parent = this._getPrognozVersionBlock$()
    const $dropdown = $parent.find('.dropdown')
    if (!$dropdown.hasClass('warning__block')) {
      $dropdown.addClass('warning__block')
      $parent.append('<p class="warning__text">Нет данных</p>')
    }
  }

  /** Список версий снова не пустой — убрать предупреждение. */
  _clearPrognozVersionNoDataWarning() {
    const $parent = this._getPrognozVersionBlock$()
    $parent.find('.dropdown').removeClass('warning__block')
    $parent.find('.warning__text').remove()
  }

  /**
   * Сообщения валидации / проверок для блока параметров (координатор → `StressController.setMessages`).
   *
   * @param {Array<{ type: string, text: string, meta?: Object }>} items
   */
  setMessages(items) {
    if (!this.paramsMessagesEl) {
      return
    }

    const list = Array.isArray(items) ? items : []
    this.paramsMessagesEl.replaceChildren()

    if (list.length === 0) {
      this.paramsMessagesEl.hidden = true
      return
    }

    this.paramsMessagesEl.hidden = false

    list.forEach((item) => {
      const p = document.createElement('p')
      p.className = this._paramsMessageClass(item.type)
      p.textContent = String(item.text)

      if (item.meta && item.meta.field != null) {
        p.setAttribute('data-field', String(item.meta.field))
      }

      this.paramsMessagesEl.appendChild(p)
    })
  }

  /** CSS-класс строки сообщения по типу. */
  _paramsMessageClass(type) {
    if (type === 'success') {
      return 'success__text'
    }
    return 'warning__text'
  }
}
