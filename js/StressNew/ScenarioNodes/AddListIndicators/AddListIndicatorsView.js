/**
 * AddListIndicatorsView — DOM модалки «Добавить список» (`#select_AddListIndicators_block`).
 * jQuery, Select2 — только здесь; API и copy — в `AddListIndicatorsController` / `AddListIndicatorsService`.
 *
 * Разметка: `.modal-custom__AddListIndicators`, `#AddListIndicatorsSelect`, кнопка `[data-btn="copy"]`.
 */

/* global $ */

export class AddListIndicatorsView {

  /** @type {import('./AddListIndicatorsController.js').AddListIndicatorsController|null} */
  static _activeController = null

  /**
   * @param {import('./AddListIndicatorsController.js').AddListIndicatorsController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.contentEl = null
    this.selectEl = null
    this.$modal = null
    this.$content = null
    this.$select = null
    this._versionSelect2Bound = false
  }

  /**
   * Привязка к `#select_AddListIndicators_block` и `#AddListIndicatorsSelect` (п.17 §1.1).
   *
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document
    this.modalEl = scope.querySelector('#select_AddListIndicators_block')
    this.contentEl = this.modalEl
      ? this.modalEl.querySelector('.SelectAddListIndicatorsContent')
      : null
    this.selectEl = scope.querySelector('#AddListIndicatorsSelect')
    this.$modal = $(this.modalEl)
    this.$content = $(this.contentEl)
    this.$select = $(this.selectEl)
    this._initVersionSelect2()
    this._bindCloseButton()
    this._bindCopyButton()
  }

  /**
   * Экземпляр блока, открывший модалку (п.17 §5.2; легаси `this.table` в `openModal`).
   * Input и Output — разные контроллеры на одну модалку в DOM.
   */
  setAsActive() {
    AddListIndicatorsView._activeController = this.controller
  }

  /**
   * @returns {import('./AddListIndicatorsController.js').AddListIndicatorsController|null}
   */
  _getActiveController() {
    return AddListIndicatorsView._activeController
  }

  /**
   * Крестик в `.modal-custom__nav` (п.17 §1.3; легаси `Reports.Stress.addListIndicators.closeModal`).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.addListIndicatorsClose')
      .on('click.addListIndicatorsClose', (ev) => {
        ev.preventDefault()
        const active = this._getActiveController()
        if (active) {
          active.closeModal()
        }
      })
  }

  /**
   * Кнопка «Скопировать» (п.17 §3.3; легаси `Reports.Stress.addListIndicators.copy`).
   */
  _bindCopyButton() {
    this.$modal
      .find('[data-btn="copy"]')
      .off('click.addListIndicatorsCopy')
      .on('click.addListIndicatorsCopy', (ev) => {
        ev.preventDefault()
        const active = this._getActiveController()
        if (active) {
          void active.handleCopy()
        }
      })
  }

  /**
   * Базовый Select2 на комбо версий (п.17 §1.2; легаси `init()` + `initSelect2Event`).
   * `templateResult` / `templateSelection` / `matcher` — §2.2 (копия `utils.js` `formatState` / `formatSelected`).
   */
  _initVersionSelect2() {
    if (this._versionSelect2Bound) {
      return
    }

    // Одна модалка в DOM — Input и Output вызывают `bind` на разных экземплярах view (§5.2).
    if (this.$select.hasClass('select2-hidden-accessible')) {
      this._versionSelect2Bound = true
      return
    }

    this.$select.select2(this._stressTestVersionSelect2Options([], { width: '100%' }))
    this._bindSelect2DropdownUi(this.$select)
    this._versionSelect2Bound = true
  }

  /**
   * Обновить опции комбо версий стресс-теста (легаси `openModal` + `PrognozVersionEls`; §2.1–2.2).
   *
   * @param {Array<{ id: string|number, name: string }>} versions
   */
  setStressTestVersionOptions(versions) {
    const data = (Array.isArray(versions) ? versions : []).map((item, index) => ({
      id: index,
      text: `${item.id}#;${item.name}`,
    }))

    if (this.$select.hasClass('select2-hidden-accessible')) {
      this.$select.select2('destroy')
    }

    this.$select.empty().select2(this._stressTestVersionSelect2Options(data))
    this._bindSelect2DropdownUi(this.$select)
  }

  /**
   * Опции Select2 комбо версий (п.17 §2.2; легаси `openModal` select2 + `utils.js`).
   *
   * @param {Array<{ id: number, text: string }>} data
   * @param {{ width?: string }} [options] — `init()` → `100%`, `openModal` → `320px`
   * @returns {Object}
   */
  _stressTestVersionSelect2Options(data, options) {
    const width = options && options.width != null ? options.width : '320px'

    return {
      data,
      templateResult: (state) => this._formatVersionState(state),
      templateSelection: (state) => this._formatVersionSelected(state),
      width,
      dropdownAutoWidth: false,
      placeholder: '',
      multiple: true,
      allowClear: true,
      maximumSelectionLength: 1,
      dropdownParent: this.$select.parent(),
      language: {
        noResults: () => 'Ничего не найдено',
        maximumSelected: (args) =>
          args.maximum > 1
            ? `Можно выбрать только ${args.maximum} элемента`
            : 'Можно выбрать только 1 элемент',
      },
      adaptDropdownCssClass: () => '',
      matcher: (params, option) => this._matcherVersion(params, option),
    }
  }

  /**
   * Пункт выпадающего списка (копия легаси `formatState` из `utils.js`).
   *
   * @param {*} state
   * @returns {*}
   */
  _formatVersionState(state) {
    if (!state.id) {
      return state.text
    }

    const text = state.text.split('#;')[1]
    return $('<p class="dropdown__text">' + text + '</p>')
  }

  /**
   * Выбранное значение в поле (копия легаси `formatSelected` из `utils.js`).
   *
   * @param {*} state
   * @returns {*}
   */
  _formatVersionSelected(state) {
    if (!state.id) {
      return state.text
    }

    if (state.text.includes('#;')) {
      return state.text.split('#;')[1]
    }

    return state.text
  }

  /**
   * Поиск по названию версии (копия `matcher` в легаси `openModal` / `stress-add-list.js`).
   *
   * @param {{ term?: string }} params
   * @param {{ text?: string }} data
   * @returns {*|null}
   */
  _matcherVersion(params, data) {
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
   * Стрелка dropdown и скрытие inline-поиска Select2 (легаси `initSelect2Event`).
   *
   * @param {JQuery} $el
   */
  _bindSelect2DropdownUi($el) {
    $el.off('.addListIndicatorsSelect2')

    $el.on('select2:open.addListIndicatorsSelect2', () => {
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(180deg)')
    })

    $el.on('select2:select.addListIndicatorsSelect2', () => {
      this._hideSelect2InlineSearch($el)
    })

    $el.on('select2:close.addListIndicatorsSelect2', () => {
      this._hideSelect2InlineSearch($el)
      $el.closest('.dropdown').find('svg').css('transform', 'rotate(0deg)')
    })

    $el.on('select2:unselect.addListIndicatorsSelect2', () => {
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
   * Id выбранной версии стресс-теста из Select2 (легаси `copy`: `text.split('#;')[0]`).
   *
   * @returns {string|null}
   */
  collectSelectedStressVersionId() {
    const selected = this.$select.select2('data')

    if (!Array.isArray(selected) || selected.length === 0) {
      return null
    }

    const text = selected[0].text != null ? String(selected[0].text) : ''

    if (!text.includes('#;')) {
      return null
    }

    return text.split('#;')[0]
  }

  /**
   * Inline-ошибка при пустом выборе (легаси `copy()` else-branch; текст — `AddListIndicatorsValidator`).
   *
   * @param {string} message
   */
  showFieldRequiredError(message) {
    const $block = this.$select.closest('.SelectAnalysisItem')

    if (!$block.find('.dropdown').hasClass('error')) {
      $block.find('.dropdown').addClass('error')
      $block.append('<p class="error__message">' + message + '</p>')
    }
  }

  /** Снять inline-ошибку (легаси `closeModal` / успешный `copy`). */
  clearFieldError() {
    const $block = this.$select.closest('.SelectAnalysisItem')
    $block.find('.dropdown').removeClass('error')
    $block.find('.error__message').remove()
  }

  /** Показать модалку (легаси: scroll top + снять `Hidden`, п.17 §2.3). */
  openModal() {
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /** Скрыть модалку (легаси: `Hidden`, сброс select, снять error). */
  closeModal() {
    if (this.$select.hasClass('select2-hidden-accessible')) {
      this.$select.val(null).trigger('change')
    } else {
      this.$select.val('')
    }

    this.clearFieldError()
    this.$modal.addClass('Hidden')
  }
}
