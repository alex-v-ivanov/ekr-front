/**
 * DOM модалки «Выбрать массив данных» (`#select_ArrayData_block`).
 * jQuery / Select2 — только здесь; GetExcelDataSets — в controller / service.
 *
 * Legacy: `ArrayDataPopUp.init` / `openModal` / `closeModal` в `stress-popups.js`.
 */

/* global $ */

export class ArrayDataPopUpView {

  /**
   * @param {import('./ArrayDataPopUpController.js').ArrayDataPopUpController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.$modal = null
    this.$control = null
    this.$parameterTypeRadios = null
    this._select2Bound = false
    this._bound = false
  }

  /**
   * Привязка модалки, Select2, radio типа и кнопки «Выбрать» (п.19 §4.1).
   *
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document

    this.modalEl =
      scope.querySelector('#select_ArrayData_block') ||
      scope.querySelector('.modal-custom__ArrayData')

    this.$modal = $(this.modalEl)
    this.$control = this.$modal.find('#ArrayDataSelect')
    this.$parameterTypeRadios = this.$modal.find('[name="parameterTypeFileData"]')

    this._stripLegacyOnclick()
    this._initArrayDataSelect2()

    if (this._bound) {
      return
    }

    this._bindCloseButton()
    this._bindParameterTypeRadios()
    this._bindSelectedButton()
    this._bound = true
  }

  /**
   * Базовый Select2 на `#ArrayDataSelect` (п.19 §4.1–4.2; легасi `init`).
   */
  _initArrayDataSelect2() {
    if (this._select2Bound) {
      return
    }

    if (this.$control.hasClass('select2-hidden-accessible')) {
      this._select2Bound = true
      return
    }

    this.$control.select2(this._arrayDataSelect2Options([]))
    this._bindSelect2DropdownUi(this.$control)
    this._select2Bound = true
  }

  /**
   * Опции Select2 для списка наборов Excel (п.19 §4.2; легасi `init` / `handleGetExcelDataSetsResponse`).
   *
   * @param {Array<{ id: number, text: string }>} [data]
   * @returns {Object}
   */
  _arrayDataSelect2Options(data = []) {
    return {
      data,
      templateResult: (state) => this._formatDatasetState(state),
      templateSelection: (state) => this._formatDatasetSelected(state),
      width: '320px',
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) =>
          args.maximum > 1
            ? `Можно выбрать только ${args.maximum} элемента`
            : 'Можно выбрать только 1 элемент',
      },
      adaptDropdownCssClass: () => '',
      matcher: (params, option) => this._matcherDataset(params, option),
    }
  }

  /**
   * Пункт выпадающего списка (копия легасi `formatState` из `utils.js`).
   *
   * @param {*} state
   * @returns {*}
   */
  _formatDatasetState(state) {
    if (!state.id) {
      return state.text
    }

    const text = state.text.split('#;')[1]
    return $('<p class="dropdown__text">' + text + '</p>')
  }

  /**
   * Выбранное значение в поле (копия легасi `formatSelected` из `utils.js`).
   *
   * @param {*} state
   * @returns {*}
   */
  _formatDatasetSelected(state) {
    if (!state.id) {
      return state.text
    }

    if (state.text && state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }

    return state.text
  }

  /**
   * Поиск по имени набора (копия matcher в `handleGetExcelDataSetsResponse`).
   *
   * @param {*} params
   * @param {*} data
   * @returns {*|null}
   */
  _matcherDataset(params, data) {
    if ($.trim(params.term) === '') {
      return data
    }

    const parts = data.text.split(';')
    const valuePart = parts.length > 1 ? parts[1] : parts[0]

    return valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0 ? data : null
  }

  /**
   * Данные Select2 из ответа API (п.19 §5.3; легасi `index + "#;" + item.ExcelName`).
   *
   * @param {Array<{ ExcelName: string }>} datasets
   * @returns {Array<{ id: number, text: string }>}
   */
  _buildDatasetSelect2Data(datasets) {
    return (datasets || []).map((item, index) => ({
      id: index,
      text: index + '#;' + item.ExcelName,
    }))
  }

  /**
   * Индекс выбранного набора из Select2 (п.19 §5.4; легасi `selected` → `res[0].text.split('#;')[0]`).
   *
   * @returns {number|null}
   */
  getSelectedDatasetIndex() {
    const selected = this.$control.select2('data')

    if (!selected || selected.length === 0) {
      return null
    }

    const index = Number(String(selected[0].text).split('#;')[0])

    return Number.isNaN(index) ? null : index
  }

  /**
   * Переinit Select2 списка наборов (п.19 §5.3; легасi `handleGetExcelDataSetsResponse`).
   *
   * @param {Array<{ ExcelName: string }>} datasets
   */
  renderDatasetOptions(datasets) {
    const data = this._buildDatasetSelect2Data(datasets)

    this.$control.empty().select2(this._arrayDataSelect2Options(data))
    this._bindSelect2DropdownUi(this.$control)
    this._select2Bound = true
  }

  /**
   * Radio «Скалярный» / «Матрица» → `onParameterTypeChange` (п.19 §4.3).
   */
  _bindParameterTypeRadios() {
    this.$parameterTypeRadios
      .off('change.arrayDataPopUpType')
      .on('change.arrayDataPopUpType', (e) => {
        const type = Number($(e.currentTarget).attr('typeId'))
        this.controller.onParameterTypeChange(type === 2 ? 2 : 1)
      })
  }

  /**
   * Кнопка «Выбрать» (п.19 §4.1; легасi `Reports.Stress.arrayDataPopUp.selected`).
   */
  _bindSelectedButton() {
    this.$modal
      .find('[data-btn="selected"]')
      .off('click.arrayDataPopUpSelect')
      .on('click.arrayDataPopUpSelect', (ev) => {
        ev.preventDefault()
        void this.controller.handleSelect()
      })
  }

  /**
   * Крестик в `.modal-custom__nav` (п.19 §4.5; легасi `Reports.Stress.arrayDataPopUp.closeModal`).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.arrayDataPopUpClose')
      .on('click.arrayDataPopUpClose', (ev) => {
        ev.preventDefault()
        this.controller.closeModal()
      })
  }

  /**
   * Снять legacy onclick на модалке ArrayData (п.19 §4.5).
   */
  _stripLegacyOnclick() {
    if (!this.$modal || !this.$modal.length) {
      return
    }

    this.$modal.find('[onclick*="arrayDataPopUp"]').removeAttr('onclick')
    this.$modal.find('[data-btn][onclick]').removeAttr('onclick')
  }

  /**
   * Стрелка dropdown и скрытие inline-поиска Select2 (легасi `initSelect2Event`).
   *
   * @param {JQuery} $el
   */
  _bindSelect2DropdownUi($el) {
    $el.off('.arrayDataPopUpSelect2')

    $el.on('select2:open.arrayDataPopUpSelect2', () => {
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(180deg)')
    })

    $el.on('select2:select.arrayDataPopUpSelect2', () => {
      this._hideSelect2InlineSearch($el)
    })

    $el.on('select2:close.arrayDataPopUpSelect2', () => {
      this._hideSelect2InlineSearch($el)
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(0deg)')
    })

    $el.on('select2:unselect.arrayDataPopUpSelect2', () => {
      if ($el.val().length < 1) {
        $el.next('.select2-container').find('.select2-search--inline').show()
      }
    })
  }

  /**
   * @param {JQuery} $el
   */
  _hideSelect2InlineSearch($el) {
    if ($el.val().length >= 1) {
      $el.next('.select2-container').find('.select2-search--inline').hide()
    }
  }

  /**
   * Показать модалку, pre-select radio, прокрутка вверх (п.19 §4.4; легасi `openModal`).
   * Загрузка списка — §5.1 (`loadDatasetsForType`).
   *
   * @param {1|2|number|string} [excelType]
   */
  openModal(excelType = 1) {
    this.clearDropdownValidationErrors()
    this._selectParameterTypeFileData(excelType)
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /**
   * Radio «Скалярный» / «Матрица» (п.19 §4.4; легасi `[name="parameterTypeFileData"][typeid]`).
   *
   * @param {*} excelType
   */
  _selectParameterTypeFileData(excelType) {
    const type = excelType !== undefined && excelType !== '' ? Number(excelType) : 1
    this.$parameterTypeRadios.filter(`[typeId="${type}"]`).prop('checked', true)
  }

  /**
   * Inline-ошибка на пустом select (п.19 §5.5; легасi `selected` else-branch).
   *
   * @param {string} message
   */
  showEmptySelectionError(message) {
    const $block = this.$control.closest('.SelectAnalysisItem')

    if (!$block.find('.dropdown').hasClass('error')) {
      $block.find('.dropdown').addClass('error')
      $block.append('<p class="error__message">' + message + '</p>')
    }
  }

  /**
   * Сброс inline-ошибки на dropdown (п.19 §4.4; легасi `closeModal` / `selected` success).
   */
  clearDropdownValidationErrors() {
    this.$modal.find('.dropdown').removeClass('error')
    this.$modal.find('.error__message').remove()
  }

  /**
   * Закрыть модалку (п.19 §4.4; легасi `closeModal`).
   */
  closeModal() {
    this.clearDropdownValidationErrors()
    this.$modal.addClass('Hidden')
  }
}
