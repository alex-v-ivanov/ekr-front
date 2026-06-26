/**
 * @typedef {Object} FilterPopUpListOptions
 * @property {import('jquery')} $anchor — SVG-кнопка фильтра
 * @property {import('jquery')} $nav — контейнер для append (`.ListHeadlines` или parent строки)
 * @property {Array<*>} items
 * @property {(item: *) => void|Promise<void>} onSelect
 * @property {'header'|'row'} layout — позиционирование popup (шапка vs строка; легасi разные `top` в `render`)
 * @property {'contains'|'exact'} [searchMatch] — поиск в поле «Найти» (header Number — exact)
 * @property {(item: *) => string} [getItemLabel]
 * @property {(item: *) => string|number|undefined} [getItemKey] — для подсветки `data-selected` на кнопке
 */

/**
 * FilterPopUpView — floating popup `.custom-popup` у кнопок `filtering*`.
 *
 * jQuery — только здесь; API и side-effects строк — в `FilterPopUpController` + колбеки блока.
 * **Без dispatch по строковым «режимам»** — только UI-опции (`layout`, `searchMatch`); см. `filter-popup.md` §«Отказ от mode».
 *
 * Handler'ы клика по `[data-rowBtn="filtering*"]` — в `InputView` / `OutputView` (§3–5).
 */

/* global $ */

export class FilterPopUpView {

  /**
   * @param {import('./FilterPopUpController.js').FilterPopUpController} controller
   */
  constructor(controller) {
    this.controller = controller

    /** @type {import('jquery')|null} */
    this._$openPopup = null

    /** @type {import('jquery')|null} */
    this._$openPopupNav = null
  }

  /**
   * Привязка view (C.3 §0.3). Popup создаётся динамически в `showListPopup`.
   *
   * @param {HTMLElement|Document} [_root]
   */
  bind(_root) {
    void _root
  }

  /**
   * Универсальный список с поиском (§1). Без параметра `mode` — поведение задаёт `layout` / `searchMatch`.
   *
   * @param {FilterPopUpListOptions} options
   */
  showListPopup(options) {
    const $anchor = options.$anchor
    const $nav = options.$nav

    if (!$anchor || !$anchor.length || !$nav || !$nav.length) {
      return
    }

    this._removePopupInNav($nav)

    const { $popUp, $popUpBody } = this._createPopupShell()

    this._positionListPopup($popUp, $anchor, options.layout)

    $nav.append($popUp)

    this._$openPopup = $popUp
    this._$openPopupNav = $nav

    this._prependSearchInput($popUp, $popUpBody, options)

    this._bindClickOutside($anchor, $popUp)
  }

  /**
   * Удалить все открытые `.custom-popup` (легасi `$('.custom-popup').remove()`).
   */
  closeAllPopups() {
    this._unbindClickOutside()
    $('.custom-popup').remove()
    this._$openPopup = null
    this._$openPopupNav = null
  }

  /**
   * Подсветка кнопки фильтра и tippy (легасi — в каждом `createfiltering*` / `createSerach*`).
   * §1.6.
   *
   * @param {import('jquery')} $anchor
   * @param {string} name — выбранное значение или «Все»
   */
  updateFilterButtonState($anchor, name) {
    if (!$anchor || !$anchor.length) {
      return
    }

    const selectedName = name != null ? String(name) : ''
    let color = '#004c97'
    let textInfo = 'Фильтр'

    if (selectedName !== '' && selectedName !== 'Все') {
      color = '#00972e'
      textInfo = selectedName
      $anchor.attr('data-selected', selectedName)
    } else {
      $anchor.removeAttr('data-selected')
    }

    $anchor.css('fill', color)

    const anchorEl = $anchor[0]

    if (anchorEl && anchorEl._tippy !== undefined) {
      anchorEl._tippy.setProps({
        content: '<p class="tooltipe__text">' + textInfo + '</p>',
      })
    }
  }

  /**
   * @param {import('jquery')} $nav
   */
  _removePopupInNav($nav) {
    this._unbindClickOutside()
    $nav.find('.custom-popup').remove()

    if (this._$openPopupNav && this._$openPopupNav.is($nav)) {
      this._$openPopup = null
      this._$openPopupNav = null
    }
  }

  /**
   * Позиция popup относительно кнопки (легасi `CustomePopUp.render` + `SelectDistributionView` §4.5).
   *
   * @param {import('jquery')} $popUp
   * @param {import('jquery')} $anchor
   * @param {'header'|'row'} layout
   */
  _positionListPopup($popUp, $anchor, layout) {
    const elPosition = $anchor.position()
    const offsetRight = 24
    const elWidth = this._getAnchorWidth($anchor)
    const left = elPosition.left - elWidth - offsetRight

    if (layout === 'row') {
      $popUp.css({
        top: `${elPosition.top + offsetRight}px`,
        left: `${left}px`,
      })
      return
    }

    $popUp.css({
      top: '2.125rem',
      left: `${left}px`,
    })
  }

  /**
   * Ширина SVG-кнопки для расчёта `left` (легасi `getBBox().width`).
   *
   * @param {import('jquery')} $anchor
   * @returns {number}
   */
  _getAnchorWidth($anchor) {
    const anchorEl = $anchor[0]

    if (anchorEl && typeof anchorEl.getBBox === 'function') {
      return anchorEl.getBBox().width
    }

    const outerWidth = $anchor.outerWidth()

    return outerWidth != null && outerWidth > 0 ? outerWidth : 24
  }

  /**
   * Разметка shell popup (легасi `CustomePopUp.render` — `.custom-popup` + `__body`).
   *
   * @returns {{ $popUp: import('jquery'), $popUpBody: import('jquery') }}
   */
  _createPopupShell() {
    const $popUp = $('<div class="custom-popup"><div class="custom-popup__body"></div></div>')
    const $popUpBody = $popUp.find('.custom-popup__body')

    return { $popUp, $popUpBody }
  }

  /**
   * Поле «Найти» и перерисовка списка при вводе (§1.3; легасi `$searchInput.on('input')`).
   *
   * @param {import('jquery')} $popUp
   * @param {import('jquery')} $popUpBody
   * @param {FilterPopUpListOptions} options
   */
  _prependSearchInput($popUp, $popUpBody, options) {
    const $searchInput = $('<input type="text" class="custom-popup__input" placeholder="Найти" />')

    $searchInput.on('input.filterPopUp', (ev) => {
      const rawVal = $(ev.currentTarget).val()
      const term = rawVal != null ? String(rawVal) : ''
      const filtered = this._filterItemsForSearch(
        options.items || [],
        term,
        options.searchMatch || 'contains',
        options.getItemLabel,
      )

      this._fillListBody($popUpBody, filtered, options)
    })

    $popUp.prepend($searchInput)
    this._fillListBody($popUpBody, options.items || [], options)
  }

  /**
   * @param {Array<*>} items
   * @param {string} searchTerm
   * @param {'contains'|'exact'} searchMatch
   * @param {FilterPopUpListOptions['getItemLabel']} [getItemLabel]
   * @returns {Array<*>}
   */
  _filterItemsForSearch(items, searchTerm, searchMatch, getItemLabel) {
    if (searchTerm === '') {
      return items
    }

    return items.filter((item) => {
      const label = this._resolveItemLabel(item, getItemLabel)

      if (searchMatch === 'exact') {
        return String(label) === searchTerm
      }

      return label.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }

  /**
   * @param {*} item
   * @param {FilterPopUpListOptions['getItemLabel']} [getItemLabel]
   * @returns {string}
   */
  _resolveItemLabel(item, getItemLabel) {
    if (typeof getItemLabel === 'function') {
      return getItemLabel(item)
    }

    if (item != null && item.name != null) {
      return String(item.name)
    }

    if (item != null && item.text != null) {
      return String(item.text)
    }

    if (item != null && item.indicatorName != null) {
      return String(item.indicatorName)
    }

    return String(item)
  }

  /**
   * Заполнить body пунктами: подсветка `data-selected`, click → `onSelect`, закрыть popup (§1.4).
   *
   * @param {import('jquery')} $body
   * @param {Array<*>} items
   * @param {FilterPopUpListOptions} options
   */
  _fillListBody($body, items, options) {
    const $anchor = options.$anchor
    $body.empty()

    ;(items || []).forEach((item) => {
      const label = this._resolveItemLabel(item, options.getItemLabel)
      const isActive = this._isItemHighlighted($anchor, item, label, options)
      const $item = $('<div class="custom-popup__item"></div>')

      if (isActive) {
        $item.css({
          background: '#004c97',
          color: '#fff',
        })
      }

      const $text = $('<p class="custom-popup__text"></p>').text(label)

      $item.append($text)

      $item.on('click.filterPopUp', () => {
        if (typeof options.onSelect === 'function') {
          options.onSelect(item)
        }

        this.closeAllPopups()
      })

      $body.append($item)
    })
  }

  /**
   * Подсветка пункта, совпадающего с `data-selected` на кнопке (легасi `createfiltering*` / `createSerach*`).
   *
   * @param {import('jquery')} $anchor
   * @param {*} item
   * @param {string} label
   * @param {FilterPopUpListOptions} options
   * @returns {boolean}
   */
  _isItemHighlighted($anchor, item, label, options) {
    if (!$anchor || !$anchor.length) {
      return false
    }

    const oldSelected = $anchor.attr('data-selected')

    if (oldSelected === undefined) {
      return false
    }

    if (typeof options.getItemKey === 'function') {
      const itemKey = options.getItemKey(item)

      if (
        itemKey !== undefined &&
        String(itemKey).toLowerCase() === String(oldSelected).toLowerCase()
      ) {
        return true
      }
    }

    return String(label).toLowerCase() === String(oldSelected).toLowerCase()
  }

  /**
   * Закрытие по клику вне якоря и popup (§1.5; легасi `handleClickOutside`).
   *
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $popUp
   */
  _bindClickOutside($anchor, $popUp) {
    this._unbindClickOutside()

    const handler = (event) => {
      const target = event.target

      if (
        $anchor.is(target) ||
        $anchor.has(target).length > 0 ||
        $popUp.is(target) ||
        $popUp.has(target).length > 0
      ) {
        return
      }

      this.closeAllPopups()
    }

    this._documentClickOutsideHandler = handler

    setTimeout(() => {
      if (this._documentClickOutsideHandler === handler) {
        $(document).on('click.filterPopUpOutside', handler)
      }
    }, 0)
  }

  /**
   * Снять document listener (перед новым open или при close).
   */
  _unbindClickOutside() {
    $(document).off('click.filterPopUpOutside')
    this._documentClickOutsideHandler = null
  }
}
