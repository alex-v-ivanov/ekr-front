/**
 * AnalyticsPopUpView — DOM модалки «Аналитики» (`#select_Analytics_block`).
 * jQuery, Select2 — только здесь; состояние, Dim и save — в `AnalyticsPopUpController` / `AnalyticsPopUpService`.
 *
 * Разметка: `.modal-custom__analytics`, `.SelectAnalyticsContent`, `.SelectAnalyticsForm`.
 */

/* global $ */

/**
 * @typedef {Object} AnalyticsPopUpRenderField
 * @property {string} fieldName
 * @property {string} label
 * @property {*} value
 * @property {Array<{ id: *, text: string }>} options
 */

/**
 * @typedef {Object} AnalyticsPopUpRenderModel
 * @property {'Input'|'Output'} table
 * @property {number} rowNumber
 * @property {string} indicatorName
 * @property {AnalyticsPopUpRenderField[]} fields
 */

const DROPDOWN_SVG = `<svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
  <path d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
</svg>`

export class AnalyticsPopUpView {

  /**
   * @param {import('./AnalyticsPopUpController.js').AnalyticsPopUpController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.contentEl = null
    this.$modal = null
    this.$content = null
  }

  /**
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document
    this.modalEl = scope.querySelector('#select_Analytics_block')
    this.contentEl = this.modalEl
      ? this.modalEl.querySelector('.SelectAnalyticsContent')
      : null
    this.$modal = $(this.modalEl)
    this.$content = $(this.contentEl)
    this._bindCloseButton()
  }

  /**
   * Крестик в `.modal-custom__nav` (п.18 §1.3; легаси `Reports.Stress.analyticsPopUp.closeModal`).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.analyticsPopUpClose')
      .on('click.analyticsPopUpClose', (ev) => {
        ev.preventDefault()
        this.controller.closeModal()
      })
  }

  /**
   * Построить форму в `.SelectAnalyticsContent` (п.18 §3.2–3.3; легаси `AnalyticsPopUp.render` / `getField`).
   * Обработчик «Сохранить» — §3.4.
   *
   * @param {AnalyticsPopUpRenderModel} model
   */
  render(model) {
    this._clearContent()

    const $form = $(`<div class="SelectAnalyticsForm" indicatorBlock="${model.table}" indicatorId="${model.rowNumber}">
      <div class="SelectAnalyticsItem" field="Indicator">
        <p class="SelectAnalyticsText">Показатель</p>
        <p class="SelectAnalyticsText">${model.indicatorName}</p>
      </div>
    </div>`)

    model.fields.forEach((field) => {
      $form.append(this._buildFieldElement(field))
    })

    const $btn = $(`<div class="Button Primary analytics-popUp-save" style="width: max-content; margin-left: auto;">
      <div class="Text"><div>Сохранить</div></div></div>`)

    this.$content.append($form)
    this.$content.append($btn)
    this._bindSaveButton()
  }

  /**
   * Сырые значения Select2 по полям формы (п.18 §3.4; легаси save handler).
   *
   * @returns {{ table: string, rowNumber: number, fields: Array<{ fieldName: string, selectVal: Array }> }|null}
   */
  collectFormFieldValues() {
    const $form = this.$content.find('.SelectAnalyticsForm')

    if ($form.length === 0) {
      return null
    }

    /** @type {Array<{ fieldName: string, selectVal: Array }>} */
    const fields = []

    $form.find('[field]:not([field="Indicator"])').each((_, el) => {
      const $item = $(el)
      const fieldName = $item.attr('field')

      fields.push({
        fieldName,
        selectVal: $item.find('select').select2('data'),
      })
    })

    return {
      table: $form.attr('indicatorBlock'),
      rowNumber: Number($form.attr('indicatorId')),
      fields,
    }
  }

  _bindSaveButton() {
    this.$content
      .find('.analytics-popUp-save')
      .off('click.analyticsPopUpSave')
      .on('click.analyticsPopUpSave', (ev) => {
        ev.preventDefault()
        void this.controller.handleSave()
      })
  }

  /**
   * @param {AnalyticsPopUpRenderField} field
   * @returns {JQuery}
   */
  _buildFieldElement(field) {
    const $field = $(`<div class="SelectAnalyticsItem" field="${field.fieldName}">
      <p class="SelectAnalyticsText">${field.label}</p>
      <label class="dropdown" style="width: max-content; margin-left: auto;">
        <select id="analytics__${field.fieldName}"></select>
        ${DROPDOWN_SVG}
      </label>
    </div>`)

    const $select = $field.find(`#analytics__${field.fieldName}`)

    this._initAnalyticsSelect2($select, field.options)
    this._applySelect2Value($select, field.options, field.value)

    return $field
  }

  /**
   * Select2 на поле analytics (легаси `getField` + `utils.formatState` / `formatSelected`).
   *
   * @param {JQuery} $select
   * @param {Array<{ id: *, text: string }>} selectItems
   */
  _initAnalyticsSelect2($select, selectItems) {
    $select.select2({
      data: selectItems,
      templateResult: (state) => this._formatAnalyticsSelect2Result(state),
      templateSelection: (state) => this._formatAnalyticsSelect2Selection(state),
      width: '120px',
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) => (
          args.maximum > 1
            ? 'Можно выбрать только ' + args.maximum + ' элемента'
            : 'Можно выбрать только 1 элемент'
        ),
      },
      adaptDropdownCssClass: () => '',
      matcher: (params, data) => this._matcherAnalyticsSelect2(params, data),
    })

    this._bindAnalyticsSelect2UiEvents($select)
  }

  /** Пункт списка (копия `utils.formatState`). */
  _formatAnalyticsSelect2Result(state) {
    if (!state.id) {
      return state.text
    }

    const text = state.text.split('#;')[1]

    return $('<p class="dropdown__text">' + text + '</p>')
  }

  /** Выбранное значение (копия `utils.formatSelected`). */
  _formatAnalyticsSelect2Selection(state) {
    if (!state.id) {
      return state.text
    }

    if (state.text && state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }

    return state.text
  }

  /** Поиск по названию (копия matcher в легаси `getField`). */
  _matcherAnalyticsSelect2(params, data) {
    if ($.trim(params.term) === '') {
      return data
    }

    const parts = data.text.split(';')
    const valuePart = parts.length > 1 ? parts[1] : parts[0]

    if (valuePart.toUpperCase().indexOf(params.term.toUpperCase()) >= 0) {
      return data
    }

    return null
  }

  /** Поворот стрелки и скрытие inline-search (копия `utils.initSelect2Event`). */
  _bindAnalyticsSelect2UiEvents($el) {
    $el.on('select2:open', function () {
      const $input = $(this)
      const $dropdownBtn = $input.closest('.dropdown').find('svg')

      if ($dropdownBtn.length > 0) {
        $dropdownBtn.css('transform', 'rotate(180deg)')
      }
    })

    $el.on('select2:select', function () {
      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }
    })

    $el.on('select2:close', function () {
      const $input = $(this)
      const $dropdownBtn = $input.closest('.dropdown').find('svg')

      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }

      if ($dropdownBtn.length > 0) {
        $dropdownBtn.css('transform', 'rotate(0deg)')
      }
    })

    $el.on('select2:unselect', function () {
      if ($(this).val().length < 1) {
        $(this).next('.select2-container').find('.select2-search--inline').show()
      }
    })
  }

  /**
   * Начальное значение из `row.analytics` (легаси `getField` после Select2).
   *
   * @param {JQuery} $select
   * @param {Array<{ id: *, text: string }>} options
   * @param {*} analyticsValue
   */
  _applySelect2Value($select, options, analyticsValue) {
    const valueStr = analyticsValue !== undefined && analyticsValue !== null
      ? String(analyticsValue)
      : ''

    if (valueStr === '') {
      return
    }

    let selectedItem = null
    let posOptions = null

    options.forEach((option) => {
      if (String(option.text).split('#;')[0] === valueStr) {
        const name = String(option.text).split('#;')[1]
        posOptions = Number(valueStr)
        selectedItem = { id: Number(valueStr), text: valueStr + '#;' + name }
      }
    })

    if (selectedItem !== null) {
      $select.val([posOptions]).trigger('change')

      const select2Event = $.Event('select2:select')
      select2Event.params = { data: selectedItem }
      $select.trigger(select2Event)
    }
  }

  _clearContent() {
    this.$content.empty()
  }

  /** Показать модалку (легаси: снять `Hidden`, scroll top). */
  openModal() {
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /** Скрыть модалку (легаси: `Hidden` + очистка `.SelectAnalyticsContent`). */
  closeModal() {
    this._clearContent()
    this.$modal.addClass('Hidden')
  }
}
