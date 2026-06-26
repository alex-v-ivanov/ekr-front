/**
 * OutputView — DOM и виджеты блока строк вывода отчёта.
 * jQuery, Select2, tippy; состояние и запросы — в OutputController.
 */

/* global $, tippy */

function getOutputTemplate() {
  return $(`
      <li class="ListRow" isActive="false">
          <div class="RowItem RowInlineContent LongItem" field="Number" style="border:unset;">
              <div mode="view" class="hidden">
                  <span class="RowItemName">0</span>
              </div>
              <div mode="editor">
                  <span class="RowItemName">0</span>
              </div>
          </div>
          <div class="RowItem RowInlineContent LongItem" field="Indicator" style="border:unset;">
              <span class="RowItemName hidden" mode="view"></span>
              <div mode="editor" style="display: flex; gap: 0.5rem; align-items: center;">
                  <label class="dropdown">
                      <select class="indicator"></select>
                      <svg width="18" height="18" viewBox="0 0 32 32" fill="#004C97" xmlns="http://www.w3.org/2000/svg">
                          <path d="M26.7074 12.7075L16.7074 22.7075C16.6146 22.8005 16.5043 22.8742 16.3829 22.9246C16.2615 22.9749 16.1314 23.0008 15.9999 23.0008C15.8685 23.0008 15.7384 22.9749 15.617 22.9246C15.4956 22.8742 15.3853 22.8005 15.2924 22.7075L5.29245 12.7075C5.1048 12.5199 4.99939 12.2654 4.99939 12C4.99939 11.7346 5.1048 11.4801 5.29245 11.2925C5.48009 11.1049 5.73458 10.9995 5.99995 10.9995C6.26531 10.9995 6.5198 11.1049 6.70745 11.2925L15.9999 20.5863L25.2924 11.2925C25.3854 11.1996 25.4957 11.1259 25.6171 11.0756C25.7384 11.0253 25.8686 10.9995 25.9999 10.9995C26.1313 10.9995 26.2614 11.0253 26.3828 11.0756C26.5042 11.1259 26.6145 11.1996 26.7074 11.2925C26.8004 11.3854 26.8741 11.4957 26.9243 11.6171C26.9746 11.7385 27.0005 11.8686 27.0005 12C27.0005 12.1314 26.9746 12.2615 26.9243 12.3829C26.8741 12.5043 26.8004 12.6146 26.7074 12.7075Z" />
                      </svg>
                  </label>
                  <svg data-rowBtn="filteringIndicator" width="24" height="24" style="cursor: pointer;" tooltipe="Фильтр" fill="#004c97" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28.825 6.19125C28.6711 5.83564 28.4161 5.53312 28.0916 5.32132C27.7671 5.10952 27.3875 4.99778 27 5H5.00003C4.61294 5.00076 4.23439 5.11384 3.91031 5.32551C3.58622 5.53718 3.33053 5.83835 3.17424 6.19248C3.01795 6.54661 2.96778 6.93849 3.02983 7.32057C3.09187 7.70265 3.26346 8.05852 3.52378 8.345L3.53378 8.35625L12 17.3963V27C11.9999 27.362 12.0981 27.7172 12.284 28.0278C12.4699 28.3383 12.7367 28.5926 13.0558 28.7635C13.3749 28.9344 13.7343 29.0155 14.0959 28.9982C14.4574 28.9808 14.8075 28.8657 15.1088 28.665L19.1088 25.9975C19.383 25.8149 19.6078 25.5673 19.7633 25.2768C19.9188 24.9864 20.0001 24.662 20 24.3325V17.3963L28.4675 8.35625L28.4775 8.345C28.7406 8.05983 28.9138 7.70349 28.9756 7.32046C29.0374 6.93744 28.9851 6.54469 28.825 6.19125ZM18.5425 16.035C18.1951 16.4032 18.0011 16.89 18 17.3963V24.3325L14 27V17.3963C14.0012 16.8882 13.808 16.3989 13.46 16.0288L5.00003 7H27L18.5425 16.035Z" />
                  </svg>
              </div>
          </div>
          <div class="RowItem RowInlineContent " field="Product" style="border:unset;">
              <span class="RowItemName hidden" mode="view"></span>
              <span class="RowItemName" mode="editor"></span>
          </div>
          <div class="RowItem RowInlineContent" style="border:unset;">
              <div style="margin-left: auto; display:flex; gap: 0.5rem; align-items: center;">
                  <svg data-rowBtn="analytics" class="invisibility" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Аналитики" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28 25H27V5C27 4.73478 26.8946 4.48043 26.7071 4.29289C26.5196 4.10536 26.2652 4 26 4H19C18.7348 4 18.4804 4.10536 18.2929 4.29289C18.1054 4.48043 18 4.73478 18 5V10H12C11.7348 10 11.4804 10.1054 11.2929 10.2929C11.1054 10.4804 11 10.7348 11 11V16H6C5.73478 16 5.48043 16.1054 5.29289 16.2929C5.10536 16.4804 5 16.7348 5 17V25H4C3.73478 25 3.48043 25.1054 3.29289 25.2929C3.10536 25.4804 3 25.7348 3 26C3 26.2652 3.10536 26.5196 3.29289 26.7071C3.48043 26.8946 3.73478 27 4 27H28C28.2652 27 28.5196 26.8946 28.7071 26.7071C28.8946 26.5196 29 26.2652 29 26C29 25.7348 28.8946 25.4804 28.7071 25.2929C28.5196 25.1054 28.2652 25 28 25ZM20 6H25V25H20V6ZM13 12H18V25H13V12ZM7 18H11V25H7V18Z" />
                  </svg>
                  <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                  <div class="">
                      <div mode="view" class="hidden" style="display:flex; gap: 0.5rem; align-items: center;">
                          <svg data-rowBtn="editeRow" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Редактировать" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                              <path d="M28.415 9.17125L22.8288 3.58625C22.643 3.40049 22.4225 3.25313 22.1799 3.15259C21.9372 3.05205 21.6771 3.00031 21.4144 3.00031C21.1517 3.00031 20.8916 3.05205 20.6489 3.15259C20.4062 3.25313 20.1857 3.40049 20 3.58625L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H27C27.2652 28 27.5196 27.8946 27.7071 27.7071C27.8947 27.5196 28 27.2652 28 27C28 26.7348 27.8947 26.4804 27.7071 26.2929C27.5196 26.1054 27.2652 26 27 26H14.415L28.415 12C28.6008 11.8143 28.7481 11.5938 28.8487 11.3511C28.9492 11.1084 29.001 10.8483 29.001 10.5856C29.001 10.3229 28.9492 10.0628 28.8487 9.82016C28.7481 9.57747 28.6008 9.35698 28.415 9.17125ZM11.5863 26H6.00001V20.4138L17 9.41375L22.5863 15L11.5863 26ZM24 13.5863L18.415 8L21.415 5L27 10.5863L24 13.5863Z" />
                          </svg>
                      </div>
                      <div mode="editor" style="display:flex; gap: 0.5rem; align-items: center;">
                          <svg data-rowBtn="cancel" width="24" height="24" viewBox="0 0 32 32" style="cursor: pointer;" tooltipe="Сохранить" fill="#004c97" xmlns="http://www.w3.org/2000/svg">
                              <path d="M28.7074 9.70751L12.7074 25.7075C12.6146 25.8005 12.5043 25.8742 12.3829 25.9246C12.2615 25.9749 12.1314 26.0008 11.9999 26.0008C11.8685 26.0008 11.7384 25.9749 11.617 25.9246C11.4956 25.8742 11.3853 25.8005 11.2924 25.7075L4.29245 18.7075C4.1048 18.5199 3.99939 18.2654 3.99939 18C3.99939 17.7346 4.1048 17.4801 4.29245 17.2925C4.48009 17.1049 4.73458 16.9994 4.99995 16.9994C5.26531 16.9994 5.5198 17.1049 5.70745 17.2925L11.9999 23.5863L27.2924 8.29251C27.4801 8.10487 27.7346 7.99945 27.9999 7.99945C28.2653 7.99945 28.5198 8.10487 28.7074 8.29251C28.8951 8.48015 29.0005 8.73464 29.0005 9.00001C29.0005 9.26537 28.8951 9.51987 28.7074 9.70751Z" />
                          </svg>
                      </div>
                  </div>
                  <div class="Rectangle1" style="width: 2px; height: 20px; background: #ccd0d4; border-radius: 10px"></div>
                  <svg data-rowBtn="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить показатель" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />
                  </svg>
              </div>
          </div>
      </li>`)
}

export class OutputView {

  constructor(outputController) {
    this.controller = outputController
    this.list = null
    this._indicatorSelect2Data = []
    this.outputMessagesEl = null
  }

  /**
   * Привязка к элементам страницы.
   *
   * @param {HTMLElement|Document} root
   */
  bind(root) {
    this.list = root.querySelector('#output_block_list')
    this._initOutputMessagesHost(root)
    this._bindBlockToolbarActions(root)
    this._bindHeaderFilterButtons(root)
    this._initOutputBlockTooltips(root)
  }

  /**
   * Кнопки шапки блока Output (`data-stress-action`, п. 6.2; легаси addNewOutput / clearOutputList).
   *
   * @param {HTMLElement|Document} root
   */
  _bindBlockToolbarActions(root) {
    const actions = {
      addOutputIndicator: () => {
        void this.controller.addNewIndicator()
      },
      clearOutputIndicators: () => {
        this.controller.onClearAllIndicators()
      },
      openOutputIndicatorsList: () => {
        this.controller.openIndicatorsList('Output')
      },
      openOutputIndicatorsAnalysis: () => {
        this.controller.openIndicatorsAnalysis('Output')
      },
    }

    Object.keys(actions).forEach((action) => {
      const el = root.querySelector(`[data-stress-action="${action}"]`)

      if (!el) {
        return
      }

      el.addEventListener('click', (ev) => {
        if (ev && typeof ev.preventDefault === 'function') {
          ev.preventDefault()
        }

        actions[action]()
      })
    })
  }

  /**
   * Фильтр списка в шапке блока Output (C.3 §3.2; легасi `initFilterOutputIndicator`).
   *
   * @param {HTMLElement|Document} root
   */
  _bindHeaderFilterButtons(root) {
    const outputBlock = root.querySelector('#output_block')

    if (!outputBlock) {
      return
    }

    const $nav = $('#output_block .ListHeadlines')

    $(outputBlock)
      .find('[data-rowBtn="filteringOutput"]')
      .off('click.filterPopUpHeader')
      .on('click.filterPopUpHeader', (ev) => {
        const $btn = $(ev.currentTarget)
        const headerColumn = $btn.attr('mode')

        if (!headerColumn) {
          return
        }

        this.controller.openHeaderFilter(headerColumn, $btn, $nav)
      })
  }

  /**
   * Скрыть/показать строки по фильтру шапки (C.3 §3.4; легасi `createSerachOutputItems`).
   * Модель `indicators` не меняется — только DOM.
   *
   * @param {'Number'|'Name'|'Product'} headerColumn
   * @param {string|number} value
   */
  applyHeaderRowFilter(headerColumn, value) {
    if (!this.list) {
      return
    }

    const $parent = $(this.list)

    $parent.find('.hidden__row').removeClass('hidden__row')

    const name = value != null ? String(value) : ''

    if (name === '' || name === 'Все') {
      return
    }

    $parent.find('[row-id]').addClass('hidden__row')

    let $match = null

    if (headerColumn === 'Number') {
      $match = $parent.find(`[row-id="${name}"]`)
    } else if (headerColumn === 'Name') {
      const $text = $parent.find(`[field="Indicator"] [mode="view"]:contains("${name}")`)
      $match = $text.closest('[row-id]')
    } else if (headerColumn === 'Product') {
      const $text = $parent.find(`[field="Product"] [mode="view"]:contains("${name}")`)
      $match = $text.closest('[row-id]')
    }

    if ($match != null && $match.length > 0) {
      $match.removeClass('hidden__row')
    }
  }

  /**
   * Перезагрузить select2 показателя в строке после фильтра по блоку (C.3 §5.4; легасi `applyIndicatorOptionsFromData`).
   * Модель `indicators` не меняется — только options в комбо текущей строки.
   *
   * @param {number} rowNumber
   * @param {Array<{ id: *, name: string }>} options
   */
  refreshRowIndicatorSelect2(rowNumber, options) {
    const $row = this._findRowByNumber(rowNumber)

    if (!$row || $row.length === 0) {
      return
    }

    const $indicator = $row.find('[field="Indicator"] .indicator')
    const data = this._toSelect2Data(options)

    this._destroySelect2($indicator)
    $indicator.empty().select2(this._outputIndicatorSelect2Options(data))
    this._bindSelect2DropdownUi($indicator)
    this._bindIndicatorSelect2Change($row, $indicator, rowNumber)
  }

  /**
   * Подсказки tippy на шапке и легенде блока Output (п. 6.4; легаси initTooltip).
   * Только `.block-parameters__nav` — строки списка инициализируются в `_initRowTooltips`.
   *
   * @param {HTMLElement|Document} root
   */
  _initOutputBlockTooltips(root) {
    if (typeof tippy !== 'function') {
      return
    }

    const outputBlock = root.querySelector('#output_block')

    if (!outputBlock) {
      return
    }

    const section = outputBlock.closest('section')
    const nav = section != null ? section.querySelector('.block-parameters__nav') : null

    if (!nav) {
      return
    }

    nav.querySelectorAll('[tooltipe]').forEach((element) => {
      this._mountTippyOnElement(element)
    })
  }

  /**
   * @param {Element} element
   */
  _mountTippyOnElement(element) {
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
  }

  /**
   * Перерисовать список строк output.
   *
   * @param {Array<Object>} viewRows — DTO из OutputController._toViewRow
   * @param {number} [scrollToNumber] — прокрутка к строке после render (добавление строки, п. 2.2).
   */
  renderIndicators(viewRows, scrollToNumber) {
    const list = Array.isArray(viewRows) ? viewRows : []
    this._releaseListTooltips()
    this.list.innerHTML = ''

    list.forEach((viewRow) => {
      const number = viewRow.number
      const $item = getOutputTemplate()

      this._renderRowNumber($item, viewRow)
      this._renderRowViewMode($item, viewRow.isViewMode)

      $item.find('[field="Indicator"] [mode="view"]').text(viewRow.indicatorName)
      this._renderRowProduct($item, viewRow)
      this._renderRowErrorState($item, viewRow.rowErrorState)
      this._renderAnalyticsButton($item, viewRow.analyticsButton)

      if (viewRow.indicatorId != null) {
        $item.find('[field="Indicator"]').attr('id', String(viewRow.indicatorId))
      }

      this._initOutputIndicatorSelect2($item, viewRow)

      $item.find('[data-rowBtn="editeRow"]').on('click', () => {
        this.controller.onEditRow(number)
      })

      $item.find('[data-rowBtn="cancel"]').on('click', () => {
        this.controller.onCancelRow(number)
      })

      $item.find('[data-rowBtn="removeRow"]').on('click', () => {
        this.controller.onRemoveRow(number)
      })

      $item.find('[data-rowBtn="analytics"]').on('click', (e) => {
        const $btn = $(e.currentTarget)

        if ($btn.hasClass('disabled')) {
          return
        }

        this.controller.openAnalyticsForRow(number)
      })

      $item.find('[data-rowBtn="filteringIndicator"]').on('click', (e) => {
        const $btn = $(e.currentTarget)

        void this.controller.openIndicatorBlockFilter(number, $btn, $btn.parent())
      })

      this.list.appendChild($item.get(0))
      this._initRowTooltips($item)
    })

    if (scrollToNumber != null) {
      this._scrollToRow(scrollToNumber)
    }
  }

  /**
   * Колонка «№» и атрибут row-id (легаси renderOutput ~70–71).
   *
   * @param {JQuery} $row
   * @param {{ number: number }} viewRow
   */
  _renderRowNumber($row, viewRow) {
    $row.attr('row-id', String(viewRow.number))
    $row.find('[field="Number"] .RowItemName').text(String(viewRow.number))
  }

  /**
   * Режим view/editor (п. 3.4; легаси renderOutput ~61–62).
   *
   * @param {JQuery} $row
   * @param {boolean} isViewMode
   */
  _renderRowViewMode($row, isViewMode) {
    if (isViewMode) {
      $row.find('[mode="view"]').removeClass('hidden')
      $row.find('[mode="editor"]').addClass('hidden')
    } else {
      $row.find('[mode="view"]').addClass('hidden')
      $row.find('[mode="editor"]').removeClass('hidden')
    }
  }

  /**
   * Переключить строку в editor / view (п. 5.1–5.2).
   *
   * @param {number} rowNumber
   * @param {boolean} isEditorMode
   * @returns {boolean}
   */
  setRowEditMode(rowNumber, isEditorMode) {
    const $row = this._findRowByNumber(rowNumber)

    if (!$row || !$row.length) {
      return false
    }

    this._renderRowViewMode($row, !isEditorMode)

    return true
  }

  /**
   * @param {number} rowNumber
   * @returns {JQuery|null}
   */
  _findRowByNumber(rowNumber) {
    if (!this.list) {
      return null
    }

    const el = this.list.querySelector('.ListRow[row-id="' + String(rowNumber) + '"]')

    return el ? $(el) : null
  }

  /**
   * Колонка Product из analytics.product + справочник продуктов (п. 3.2).
   *
   * @param {JQuery} $row
   * @param {{ productLabel?: string }} viewRow
   */
  _renderRowProduct($row, viewRow) {
    const label = viewRow && viewRow.productLabel != null ? String(viewRow.productLabel) : ''
    $row.find('[field="Product"] [mode="view"]').text(label)
    $row.find('[field="Product"] [mode="editor"]').text(label)
  }

  /**
   * Подсветка строки по status (п. 3.3; легаси ~75–77, без checkIndicator).
   *
   * @param {JQuery} $row
   * @param {{ applyErrorClass: boolean, hasError: boolean }} rowErrorState
   */
  _renderRowErrorState($row, rowErrorState) {
    if (!rowErrorState) {
      $row.removeClass('ListRow__error')
      return
    }

    if (!rowErrorState.applyErrorClass) {
      $row.removeClass('ListRow__error')
      return
    }

    $row.toggleClass('ListRow__error', rowErrorState.hasError)
  }

  /**
   * @param {number} rowNumber
   * @param {{ applyErrorClass: boolean, hasError: boolean }} rowErrorState
   */
  updateRowErrorState(rowNumber, rowErrorState) {
    const $row = this._findRowByNumber(rowNumber)

    if ($row == null || $row.length === 0) {
      return
    }

    this._renderRowErrorState($row, rowErrorState)
  }

  /**
   * Кнопка analytics: цвет, disabled, tooltip, видимость (п. 3.5; легаси initBtnAnalysts).
   *
   * @param {JQuery} $row
   * @param {{ tooltipText: string, fillColor: string, disabled: boolean }} analyticsButton
   */
  _renderAnalyticsButton($row, analyticsButton) {
    const $btn = $row.find('[data-rowBtn="analytics"]')

    if (!$btn.length || !analyticsButton) {
      return
    }

    if (analyticsButton.disabled) {
      $btn.addClass('disabled')
    } else {
      $btn.removeClass('disabled')
    }

    $btn.attr({
      fill: analyticsButton.fillColor,
      tooltipe: analyticsButton.tooltipText,
    })

    $btn.removeClass('invisibility')
  }

  /**
   * Прокрутка к строке списка после добавления.
   *
   * @param {number} number
   */
  _scrollToRow(number) {
    const row = this.list.querySelector(`[row-id="${number}"]`)
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  /**
   * Подготовка Select2-справочника показателей Output (п. 0.2, без рендера строк).
   *
   * @param {Array<{ id: *, name: * }>} indicatorOptions
   */
  setIndicatorSelect2Options(indicatorOptions) {
    this._indicatorSelect2Data = this._toSelect2Data(indicatorOptions)
  }

  /**
   * Select2 на комбо показателя (п. 4.1–4.4, легаси initOutputIndicator ~95–162).
   *
   * @param {JQuery} $row
   * @param {{ number: number, indicatorId: *, indicatorName: string }} viewRow
   */
  _initOutputIndicatorSelect2($row, viewRow) {
    const $indicator = $row.find('[field="Indicator"] .indicator')
    const data = this._indicatorSelect2Data

    this._destroySelect2($indicator)
    $indicator.empty().select2(this._outputIndicatorSelect2Options(data))
    this._bindSelect2DropdownUi($indicator)
    this._bindIndicatorSelect2Change($row, $indicator, viewRow.number)

    if (
      viewRow.indicatorId != null &&
      viewRow.indicatorName != null &&
      viewRow.indicatorName !== '' &&
      data.length > 0
    ) {
      this._selectIndicatorInCombo($row, $indicator, viewRow)
    }
  }

  /**
   * Программный выбор показателя в Select2 при render загруженной строки (п. 4.4; легаси ~144–161).
   *
   * @param {JQuery} $row
   * @param {JQuery} $indicator
   * @param {{ indicatorId: *, indicatorName: string }} rowData
   */
  _selectIndicatorInCombo($row, $indicator, rowData) {
    const data = this._indicatorSelect2Data
    let pick = null

    for (let i = 0; i < data.length; i += 1) {
      const d = data[i]
      const idStr = String(d.id)
      const textParts = (d.text || '').split('#;')
      const namePart = textParts[1] || textParts[0] || ''
      const idMatches =
        String(rowData.indicatorId) === idStr ||
        (Number(idStr) === Number(rowData.indicatorId) &&
          !Number.isNaN(Number(rowData.indicatorId)))

      if (idMatches || namePart === rowData.indicatorName) {
        pick = d
        break
      }
    }

    if (!pick) {
      return
    }

    $row.find('[field="Indicator"]').attr('id', String(rowData.indicatorId))
    $indicator.val([String(pick.id)]).trigger('change')
    $indicator.trigger($.Event('select2:close'))
    this._hideSelect2InlineSearch($indicator)
  }

  /** Скрыть inline-поиск Select2 после программного выбора. */
  _hideSelect2InlineSearch($el) {
    if ($el.val().length >= 1) {
      $el.next('.select2-container').find('.select2-search--inline').hide()
    }
  }

  /**
   * @param {JQuery} $row
   * @param {JQuery} $indicator
   * @param {number} rowNumber
   */
  _bindIndicatorSelect2Change($row, $indicator, rowNumber) {
    $indicator.off('select2:select.outputIndicator')
    $indicator.on('select2:select.outputIndicator', (e) => {
      if (!e.params || e.params.data == null) {
        return
      }

      void this.controller.onIndicatorSelect(rowNumber, e.params.data)
    })
  }

  /**
   * Точечное обновление DOM после выбора показателя (без полного re-render).
   *
   * @param {JQuery} $row
   * @param {{ indicatorId: *|null, indicatorName: string, clearProductLabel: boolean }} result
   */
  _applyIndicatorSelectToRow($row, result) {
    const $field = $row.find('[field="Indicator"]')

    $field.find('[mode="view"]').text(result.indicatorName)

    if (result.indicatorId != null) {
      $field.attr('id', String(result.indicatorId))
    }

    if (result.clearProductLabel) {
      this._renderRowProduct($row, { productLabel: '' })
    }
  }

  /**
   * Опции Select2 для показателя Output (копия initOutputIndicator: formatState / formatSelected / matcherTemplate).
   *
   * @param {Array<{ id: *, text: string }>} data
   * @returns {Object}
   */
  _outputIndicatorSelect2Options(data) {
    return {
      data,
      templateResult: (state) => this._formatIndicatorTemplateResult(state),
      templateSelection: (state) => this._formatIndicatorTemplateSelection(state),
      width: '120px',
      dropdownAutoWidth: false,
      placeholder: '',
      matcher: (params, optionData) => this._matcherIndicator(params, optionData),
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
    }
  }

  /**
   * `{ id, name }` → `{ id, text: "id#;name" }` для Select2.
   *
   * @param {Array<{ id: *, name: * }>} options
   * @returns {Array<{ id: *, text: string }>}
   */
  _toSelect2Data(options) {
    const items = Array.isArray(options) ? options : []
    return items.map((item) => ({
      id: item.id,
      text: String(item.id) + '#;' + (item.name != null ? String(item.name) : ''),
    }))
  }

  /** Пункт списка показателя (копия utils.formatState). */
  _formatIndicatorTemplateResult(state) {
    if (!state.id) {
      return state.text
    }

    const parts = String(state.text || '').split('#;')
    const text = parts.length > 1 ? parts[1] : parts[0]
    return $('<p class="dropdown__text">' + text + '</p>')
  }

  /** Выбранный показатель в поле (копия utils.formatSelected). */
  _formatIndicatorTemplateSelection(state) {
    if (!state.id) {
      return state.text
    }

    if (state.text && state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }

    return state.text
  }

  /** Поиск по комбо показателя (копия utils.matcherTemplate). */
  _matcherIndicator(params, data) {
    if (!params.term || $.trim(String(params.term)) === '') {
      return data
    }

    if (!data || data.text == null) {
      return null
    }

    const searchTerm = String(params.term).trim().toLowerCase()
    const dataText = String(data.text).toLowerCase()
    const isNumberInput = /^\d+$/.test(searchTerm)

    if (isNumberInput) {
      const match = dataText.match(/^(\d+)#?/)
      if (match && match[1] === searchTerm) {
        return data
      }
    } else if (dataText.includes(searchTerm)) {
      return data
    }

    return null
  }

  /** Снять Select2 перед повторной инициализацией. */
  _destroySelect2($el) {
    if ($el.hasClass('select2-hidden-accessible')) {
      $el.select2('destroy')
    }
  }

  /** Стрелка dropdown и скрытие строки поиска Select2 (копия initSelect2Event / InputView). */
  _bindSelect2DropdownUi($el) {
    $el.off('.outputIndicatorSelect2Ui')
    $el.on('select2:open.outputIndicatorSelect2Ui', function () {
      $(this).closest('.dropdown').find('svg').css('transform', 'rotate(180deg)')
    })
    $el.on('select2:select.outputIndicatorSelect2Ui', function () {
      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }
    })
    $el.on('select2:close.outputIndicatorSelect2Ui', function () {
      if ($(this).val().length >= 1) {
        $(this).next('.select2-container').find('.select2-search--inline').hide()
      }
      $(this).closest('.dropdown').find('svg').css('transform', 'rotate(0deg)')
    })
    $el.on('select2:unselect.outputIndicatorSelect2Ui', function () {
      if ($(this).val().length < 1) {
        $(this).next('.select2-container').find('.select2-search--inline').show()
      }
    })
  }

  /**
   * Снять tippy со всех подсказок списка перед полным render (п. 3.6).
   */
  _releaseListTooltips() {
    if (!this.list) {
      return
    }

    this.list.querySelectorAll('[tooltipe]').forEach((element) => {
      if (element._tippy) {
        element._tippy.destroy()
      }
    })
  }

  /**
   * Подсказки tippy на элементах с атрибутом tooltipe (п. 3.6; легаси renderOutput ~80–90).
   * Вызывать после установки `tooltipe` на кнопках строки (в т.ч. analytics, п. 3.5).
   *
   * @param {JQuery} $row
   */
  _initRowTooltips($row) {
    if (typeof tippy !== 'function') {
      return
    }

    $row.find('[tooltipe]').each((_i, element) => {
      this._mountTippyOnElement(element)
    })
  }

  /**
   * Контейнер сообщений зоны output: `[data-output-messages]` или `.block-output__messages`;
   * иначе в начале `#output_block` (секция Output) или перед `#output_block_list` (п. 7.3).
   *
   * @param {HTMLElement|Document} root
   */
  _initOutputMessagesHost(root) {
    this.outputMessagesEl =
      root.querySelector('[data-output-messages]') ||
      root.querySelector('.block-output__messages')

    if (this.outputMessagesEl) {
      return
    }

    const block = root.querySelector('#output_block')

    if (block) {
      this.outputMessagesEl = document.createElement('div')
      this.outputMessagesEl.className = 'block-output__messages'
      this.outputMessagesEl.setAttribute('data-output-messages', '')
      this.outputMessagesEl.hidden = true
      block.insertBefore(this.outputMessagesEl, block.firstChild)
      return
    }

    const outputList = this.list || root.querySelector('#output_block_list')

    if (outputList && outputList.parentElement) {
      this.outputMessagesEl = document.createElement('div')
      this.outputMessagesEl.className = 'block-output__messages'
      this.outputMessagesEl.setAttribute('data-output-messages', '')
      this.outputMessagesEl.hidden = true
      outputList.parentElement.insertBefore(this.outputMessagesEl, outputList)
    }
  }

  /**
   * Сообщения валидации / проверок для блока output (п. 7.3, координатор → `StressController.setMessages`).
   *
   * @param {Array<{ type: string, text: string, meta?: { rowIndex?: number, field?: string } }>} items
   *   `meta.rowIndex` — из `StressScenarioResult._pushKeyedErrors`; атрибут `data-row` на `<p>`.
   */
  setMessages(items) {
    if (!this.outputMessagesEl) {
      return
    }

    const list = Array.isArray(items) ? items : []
    this.outputMessagesEl.replaceChildren()

    if (list.length === 0) {
      this.outputMessagesEl.hidden = true
      return
    }

    this.outputMessagesEl.hidden = false

    list.forEach((item) => {
      const p = document.createElement('p')
      p.className = this._outputMessageClass(item && item.type)
      p.textContent = String(item && item.text != null ? item.text : '')

      if (item.meta?.rowIndex != null) {
        p.setAttribute('data-row', String(item.meta.rowIndex))
      }

      if (item.meta?.field != null) {
        p.setAttribute('data-field', String(item.meta.field))
      }

      this.outputMessagesEl.appendChild(p)
    })
  }

  /**
   * @param {string} [type]
   * @returns {string}
   */
  _outputMessageClass(type) {
    if (type === 'success') {
      return 'success__text'
    }

    return 'warning__text'
  }
}
