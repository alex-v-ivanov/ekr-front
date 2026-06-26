/**
 * AnalysisPopUpView — DOM модалки «Анализ списка» (`#select_Analysis_block`).
 * jQuery, Select2 (фильтры) — только здесь;
 * список, фильтрация и удаление строк — в `AnalysisPopUpController`.
 *
 * Разметка: `.modal-custom__analysis`, `.SelectAnalysisContent`, `.SelectAnalysisBody`,
 * фильтры `#analysis__product` … `#analysis__lt_st`.
 */

/* global $, tippy */

import { ANALYSIS_FILTER_FIELD_NAMES } from './AnalysisPopUpService.js'

export { ANALYSIS_FILTER_FIELD_NAMES }

export class AnalysisPopUpView {

  /**
   * @param {import('./AnalysisPopUpController.js').AnalysisPopUpController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.contentEl = null
    this.bodyEl = null
    this.$modal = null
    this.$content = null
    this.$body = null
    /** @type {Record<string, JQuery>} */
    this.$filterSelects = {}
  }

  /**
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document
    this.modalEl = scope.querySelector('#select_Analysis_block')
    this.contentEl = this.modalEl
      ? this.modalEl.querySelector('.SelectAnalysisContent')
      : null
    this.bodyEl = this.modalEl
      ? this.modalEl.querySelector('.SelectAnalysisBody')
      : null

    this.$modal = $(this.modalEl)
    this.$content = $(this.contentEl)
    this.$body = $(this.bodyEl)

    this.$filterSelects = {
      product: this.$modal.find('#analysis__product'),
      movementType: this.$modal.find('#analysis__movementType'),
      company: this.$modal.find('#analysis__company'),
      trCurrency: this.$modal.find('#analysis__trCurrency'),
      lt_st: this.$modal.find('#analysis__lt_st'),
    }

    this._bindCloseButton()
    this._bindFilterButtons()
  }

  /**
   * Крестик в `.modal-custom__nav` (п.18 §4.4; легаси `Reports.Stress.analysisPopUp.closeModal`).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.analysisPopUpClose')
      .on('click.analysisPopUpClose', (ev) => {
        ev.preventDefault()
        this.controller.closeModal()
      })
  }

  /**
   * «Применить» / «Очистить фильтр» (п.18 §4.5; легаси `analysisPopUp.applyFilter` / `clearFilter`).
   */
  _bindFilterButtons() {
    this.$modal
      .find('.analysis-popUp-apply')
      .off('click.analysisPopUpApply')
      .on('click.analysisPopUpApply', (ev) => {
        ev.preventDefault()
        this.controller.applyFilter()
      })

    this.$modal
      .find('.analysis-popUp-clear')
      .off('click.analysisPopUpClear')
      .on('click.analysisPopUpClear', (ev) => {
        ev.preventDefault()
        this.controller.clearFilter()
      })
  }

  /**
   * @param {string} fieldName
   * @returns {JQuery}
   */
  getFilterSelect(fieldName) {
    return this.$filterSelects[fieldName] || $()
  }

  /**
   * Колонки только для Input (легаси `openModal` + `table === 'Input'`).
   *
   * @param {boolean} isInput
   */
  setInputColumnsVisible(isInput) {
    const $cols = this.$modal.find(
      '[field="Distribution"], [field="HistoricalRange"], [field="AcceptableRange"]',
    )

    if (isInput) {
      $cols.removeClass('invisibility')
    } else {
      $cols.addClass('invisibility')
    }
  }

  /**
   * Select2 на фильтрах с полным справочником Dim (легаси `initSelect2Field` на `#analysis__*`).
   *
   * @param {Record<string, Array<{ id: *, text: string }>>} filterOptionsByField
   */
  renderFilterSelects(filterOptionsByField) {
    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      const $select = this.getFilterSelect(fieldName)
      const options = filterOptionsByField[fieldName] || []

      if ($select.hasClass('select2-hidden-accessible')) {
        $select.off('.analysisFilterSelect2')
        $select.select2('destroy')
      }

      $select.empty()
      this._initFilterSelect2($select, options)
    })
  }

  /**
   * Select2 на поле фильтра (легаси `initSelect2Field` на `#analysis__*`, width 170px).
   *
   * @param {JQuery} $select
   * @param {Array<{ id: *, text: string }>} selectItems
   */
  _initFilterSelect2($select, selectItems) {
    $select.select2({
      data: selectItems,
      templateResult: (state) => this._formatFilterSelect2Result(state),
      templateSelection: (state) => this._formatFilterSelect2Selection(state),
      width: '170px',
      dropdownAutoWidth: false,
      dropdownParent: this.$modal,
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
      matcher: (params, data) => this._matcherFilterSelect2(params, data),
    })

    this._bindFilterSelect2UiEvents($select)
  }

  _formatFilterSelect2Result(state) {
    if (!state.id) {
      return state.text
    }

    const parts = String(state.text || '').split('#;')
    const text = parts.length > 1 ? parts[1] : parts[0]

    return $('<p class="dropdown__text">' + text + '</p>')
  }

  _formatFilterSelect2Selection(state) {
    if (!state.id) {
      return state.text
    }

    if (state.text && state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }

    return state.text
  }

  _matcherFilterSelect2(params, data) {
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

  /**
   * Строки в `.SelectAnalysisBody` (п.18 §5.1; легаси `AnalysisPopUp.render`).
   *
   * @param {{ table: 'Input'|'Output', rows: Array }} model
   */
  render(model) {
    this.$body.empty()

    if (!model.rows || model.rows.length === 0) {
      return
    }

    model.rows.forEach((row) => {
      this.$body.append(this._buildRowElement(row, model.table))
    })
  }

  /**
   * @param {Object} row
   * @param {'Input'|'Output'} table
   * @returns {JQuery}
   */
  _buildRowElement(row, table) {
    const $row = this._getRowTemplate()

    $row.attr({ 'row-id': row.number, table })

    if (row.excelState != null && row.excelState.rowColorClass) {
      $row.addClass(row.excelState.rowColorClass)
    }

    $row.find('[field="Number"] .SelectAnalysisFieldText').text(row.number)
    $row.find('[field="Indicator"] .SelectAnalysisFieldText').text(row.indicatorName)

    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      const field = row.analyticsFields[fieldName]
      const $field = $row.find('[field="' + fieldName + '"]')

      if (field != null && field.value !== '') {
        $field.attr('value', field.value)
        $field.find('.SelectAnalysisFieldText').text(field.label)
      }
    })

    if (table === 'Input') {
      const $distribution = $row.find('[field="Distribution"]')
      const $historicalRange = $row.find('[field="HistoricalRange"]')
      const $acceptableRange = $row.find('[field="AcceptableRange"]')

      $distribution.find('.SelectAnalysisFieldText').text(row.distributionName || '')

      if (row.excelState != null && row.excelState.hideDistribution) {
        $distribution.addClass('invisibility')
      }

      $historicalRange.find('.SelectAnalysisFieldText').text(row.historicalRangeLabel || '')

      if (row.excelState != null && row.excelState.hideHistoricalRange) {
        $historicalRange.addClass('invisibility')
      }

      const $acceptableText = $acceptableRange.find('.SelectAnalysisFieldText')
      $acceptableText.text(row.acceptableRangeLabel || '')

      if (row.acceptableRangeError) {
        $acceptableText.addClass('error__message')
      } else {
        $acceptableText.removeClass('error__message')
      }
    }

    if (row.excelState != null && row.excelState.showFileButtons) {
      const $fileInfo = $row.find('[data-rowBtn="fileInfo"]')

      $fileInfo.removeClass('invisibility')

      if (row.excelState.fileInfoTooltip != null && typeof tippy !== 'undefined') {
        const el = $fileInfo[0]

        if (el._tippy !== undefined) {
          el._tippy.setProps({
            content: '<p class="tooltipe__text">' + row.excelState.fileInfoTooltip + '</p>',
          })
        } else {
          tippy(el, {
            content: '<p class="tooltipe__text">' + row.excelState.fileInfoTooltip + '</p>',
            animation: 'fade',
            followCursor: true,
            arrow: false,
            allowHTML: true,
          })
        }
      }
    }

    $row
      .find('[data-rowbtn="removeRow"]')
      .off('click.analysisPopUpRemoveRow')
      .on('click.analysisPopUpRemoveRow', (ev) => {
        ev.preventDefault()
        const rowId = Number($row.attr('row-id'))

        if (!Number.isNaN(rowId)) {
          this.controller.handleRemoveRow(rowId)
        }
      })

    return $row
  }

  /**
   * Восстановить выбранные фильтры после `renderFilterSelects` (п.18 §5.4).
   *
   * @param {Array<{ field: string, value: string }>} filters
   * @param {Record<string, Array<{ id: *, text: string }>>} filterOptionsByField
   */
  restoreFilterSelections(filters, filterOptionsByField) {
    if (!filters || filters.length === 0) {
      return
    }

    filters.forEach((filter) => {
      const $select = this.getFilterSelect(filter.field)
      const options = filterOptionsByField[filter.field] || []

      if ($select.length === 0 || !$select.hasClass('select2-hidden-accessible')) {
        return
      }

      let selectedItem = null
      let selectVal = null

      options.forEach((option) => {
        if (String(option.text).split('#;')[0] === filter.value) {
          const name = String(option.text).split('#;')[1]
          selectVal = option.id
          selectedItem = {
            id: option.id,
            text: filter.value + '#;' + name,
          }
        }
      })

      if (selectedItem == null || selectVal == null) {
        return
      }

      $select.val([selectVal]).trigger('change')

      const select2Event = $.Event('select2:select')
      select2Event.params = { data: selectedItem }
      $select.trigger(select2Event)
    })
  }

  /** Шаблон строки (копия легаси `AnalysisPopUp.getRowTemplate`). */
  _getRowTemplate() {
    return $(`
      <div class="SelectAnalysisRow">
        <div class="SelectAnalysisField" field="Number"><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="Indicator"><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="product" value=""><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="movementType" value=""><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="company" value=""><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="trCurrency" value=""><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="lt_st" value=""><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" field="Distribution"><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField SelectAnalysisField_center" field="HistoricalRange"><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField SelectAnalysisField_center" field="AcceptableRange"><span class="SelectAnalysisFieldText"></span></div>
        <div class="SelectAnalysisField" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <svg data-rowBtn="fileInfo" class="invisibility" width="24" height="24" tooltipe="файл" fill="#004c97" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M26.2075 15.2925C26.3005 15.3854 26.3742 15.4957 26.4245 15.6171C26.4749 15.7384 26.5008 15.8686 26.5008 16C26.5008 16.1314 26.4749 16.2615 26.4245 16.3829C26.3742 16.5043 26.3005 16.6146 26.2075 16.7075L15.9512 26.9575C14.6382 28.2703 12.8575 29.0078 11.0008 29.0077C9.14406 29.0075 7.36342 28.2699 6.0506 26.9569C4.73778 25.6439 4.00031 23.8632 4.00043 22.0064C4.00054 20.1497 4.73824 18.3691 6.05123 17.0562L18.4587 4.46624C19.3961 3.52787 20.6678 3.00031 21.9942 2.9996C23.3206 2.9989 24.5929 3.52512 25.5312 4.46249C26.4696 5.39987 26.9972 6.67161 26.9979 7.99796C26.9986 9.32432 26.4724 10.5966 25.535 11.535L13.125 24.125C12.5614 24.6886 11.797 25.0052 11 25.0052C10.2029 25.0052 9.43856 24.6886 8.87498 24.125C8.31139 23.5614 7.99477 22.797 7.99477 22C7.99477 21.203 8.31139 20.4386 8.87498 19.875L19.2875 9.29749C19.3787 9.20019 19.4884 9.12211 19.6103 9.06786C19.7321 9.01361 19.8636 8.98428 19.9969 8.9816C20.1303 8.97892 20.2628 9.00293 20.3867 9.05224C20.5106 9.10154 20.6234 9.17513 20.7185 9.26869C20.8136 9.36224 20.8889 9.47386 20.9402 9.59698C20.9915 9.72011 21.0176 9.85224 21.017 9.98561C21.0165 10.119 20.9892 10.2509 20.9369 10.3736C20.8846 10.4963 20.8083 10.6072 20.7125 10.7L10.2987 21.2887C10.2055 21.3812 10.1314 21.4912 10.0806 21.6123C10.0299 21.7335 10.0035 21.8634 10.003 21.9948C10.0025 22.1261 10.0278 22.2563 10.0776 22.3778C10.1274 22.4993 10.2006 22.6099 10.2931 22.7031C10.3856 22.7964 10.4956 22.8705 10.6167 22.9212C10.7378 22.9719 10.8678 22.9983 10.9991 22.9989C11.1305 22.9994 11.2606 22.974 11.3822 22.9242C11.5037 22.8745 11.6142 22.8012 11.7075 22.7087L24.1162 10.125C24.6798 9.56257 24.9969 8.79929 24.9977 8.00309C24.9985 7.20688 24.683 6.44295 24.1206 5.87937C23.5582 5.31578 22.7949 4.9987 21.9987 4.99788C21.2025 4.99706 20.4386 5.31257 19.875 5.87499L7.46998 18.46C7.00526 18.924 6.63648 19.4749 6.3847 20.0814C6.13291 20.6879 6.00305 21.3381 6.00253 21.9948C6.00201 22.6514 6.13083 23.3018 6.38165 23.9087C6.63247 24.5156 7.00037 25.0672 7.46435 25.5319C7.92833 25.9966 8.47929 26.3654 9.08579 26.6171C9.69229 26.8689 10.3424 26.9988 10.9991 26.9993C11.6558 26.9998 12.3062 26.871 12.9131 26.6202C13.52 26.3694 14.0715 26.0015 14.5362 25.5375L24.7937 15.2875C24.9819 15.1008 25.2365 14.9964 25.5016 14.9973C25.7667 14.9983 26.0206 15.1044 26.2075 15.2925Z" /></svg>
          <svg data-rowbtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить показатель" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z"></path></svg>
        </div>
      </div>`)
  }

  _bindFilterSelect2UiEvents($el) {
    $el.off('.analysisFilterSelect2')

    $el.on('select2:open.analysisFilterSelect2', function () {
      const $input = $(this)
      const $dropdownBtn = $input.closest('.dropdown').find('svg')

      if ($dropdownBtn.length > 0) {
        $dropdownBtn.css('transform', 'rotate(180deg)')
      }
    })

    $el.on('select2:select.analysisFilterSelect2', function () {
      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }
    })

    $el.on('select2:close.analysisFilterSelect2', function () {
      const $input = $(this)
      const $dropdownBtn = $input.closest('.dropdown').find('svg')

      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }

      if ($dropdownBtn.length > 0) {
        $dropdownBtn.css('transform', 'rotate(0deg)')
      }
    })

    $el.on('select2:unselect.analysisFilterSelect2', function () {
      if ($(this).val().length < 1) {
        $(this).next('.select2-container').find('.select2-search--inline').show()
      }
    })
  }

  /**
   * Выбранные значения фильтров Select2 (п.18 §5.2; легаси `applyFilter`).
   *
   * @returns {Array<{ field: string, value: string }>}
   */
  collectFilterValues() {
    /** @type {Array<{ field: string, value: string }>} */
    const filters = []

    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      const $select = this.getFilterSelect(fieldName)

      if ($select.length === 0 || !$select.hasClass('select2-hidden-accessible')) {
        return
      }

      const selectedValue = $select.select2('data')

      if (selectedValue != null && selectedValue.length > 0) {
        filters.push({
          field: fieldName,
          value: String(selectedValue[0].text).split('#;')[0],
        })
      }
    })

    return filters
  }

  /**
   * Показать/скрыть строки по активным фильтрам (легаси: класс `Hidden` на `.SelectAnalysisRow`).
   *
   * @param {Array<{ field: string, value: string }>} filters
   */
  applyRowVisibility(filters) {
    if (!filters || filters.length === 0) {
      this.showAllRows()
      return
    }

    this.$body.find('.SelectAnalysisRow').each((_, rowEl) => {
      const $row = $(rowEl)
      let shouldHide = false

      for (const filter of filters) {
        const fieldValue = $row.find('[field="' + filter.field + '"]').attr('value')

        if (fieldValue !== filter.value && filter.value !== '0') {
          shouldHide = true
          break
        }
      }

      $row.toggleClass('Hidden', shouldHide)
    })
  }

  /** Сброс Select2 на `#analysis__*` (легаси `clearFilter`). */
  clearFilterSelects() {
    ANALYSIS_FILTER_FIELD_NAMES.forEach((fieldName) => {
      const $select = this.getFilterSelect(fieldName)

      if ($select.length === 0 || !$select.hasClass('select2-hidden-accessible')) {
        return
      }

      $select.val(null).trigger('change')
    })
  }

  /** Снять `Hidden` со всех строк таблицы. */
  showAllRows() {
    this.$body.find('.SelectAnalysisRow').removeClass('Hidden')
  }

  /** Показать модалку (легаси: снять `Hidden`, scroll top). */
  openModal() {
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /** Скрыть модалку (легаси: `Hidden` + очистка `.SelectAnalysisBody`; clearFilter — §4.5). */
  closeModal() {
    this.$body.empty()
    this.$modal.addClass('Hidden')
  }
}
