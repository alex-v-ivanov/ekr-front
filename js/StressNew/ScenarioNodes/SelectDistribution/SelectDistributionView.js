/**
 * DOM модалки подбора: таблица `#SelectDistributionGrid` и ECharts `#SelectDistributionChart`.
 * Legacy: `.modal-custom__distribution` + `InputSelectDistribution.init` + `StressChart` (график — §1.2+).
 */

/* global $, echarts, tippy */

/** @type {const} */
const CHART_HEIGHT_PX = '500px'

/** @type {const} */
const CHART_WIDTH_PADDING = 70

/** SVG path icons (легаси `StressChart` constructor). */
const CHART_ICON_FULL =
  'path://M27 6V12C27 12.2652 26.8946 12.5196 26.7071 12.7071C26.5196 12.8946 26.2652 13 26 13C25.7348 13 25.4804 12.8946 25.2929 12.7071C25.1054 12.5196 25 12.2652 25 12V8.41375L18.7075 14.7075C18.5199 14.8951 18.2654 15.0006 18 15.0006C17.7346 15.0006 17.4801 14.8951 17.2925 14.7075C17.1049 14.5199 16.9994 14.2654 16.9994 14C16.9994 13.7346 17.1049 13.4801 17.2925 13.2925L23.5863 7H20C19.7348 7 19.4804 6.89464 19.2929 6.70711C19.1054 6.51957 19 6.26522 19 6C19 5.73478 19.1054 5.48043 19.2929 5.29289C19.4804 5.10536 19.7348 5 20 5H26C26.2652 5 26.5196 5.10536 26.7071 5.29289C26.8946 5.48043 27 5.73478 27 6ZM13.2925 17.2925L7 23.5863V20C7 19.7348 6.89464 19.4804 6.70711 19.2929C6.51957 19.1054 6.26522 19 6 19C5.73478 19 5.48043 19.1054 5.29289 19.2929C5.10536 19.4804 5 19.7348 5 20V26C5 26.2652 5.10536 26.5196 5.29289 26.7071C5.48043 26.8946 5.73478 27 6 27H12C12.2652 27 12.5196 26.8946 12.7071 26.7071C12.8946 26.5196 13 26.2652 13 26C13 25.7348 12.8946 25.4804 12.7071 25.2929C12.5196 25.1054 12.2652 25 12 25H8.41375L14.7075 18.7075C14.8951 18.5199 15.0006 18.2654 15.0006 18C15.0006 17.7346 14.8951 17.4801 14.7075 17.2925C14.5199 17.1049 14.2654 16.9994 14 16.9994C13.7346 16.9994 13.4801 17.1049 13.2925 17.2925Z'

const CHART_ICON_EXIT_FULL =
  'path://M26.7074 6.70751L20.4137 13H23.9999C24.2652 13 24.5195 13.1054 24.7071 13.2929C24.8946 13.4804 24.9999 13.7348 24.9999 14C24.9999 14.2652 24.8946 14.5196 24.7071 14.7071C24.5195 14.8946 24.2652 15 23.9999 15H17.9999C17.7347 15 17.4804 14.8946 17.2928 14.7071C17.1053 14.5196 16.9999 14.2652 16.9999 14V8.00001C16.9999 7.73479 17.1053 7.48044 17.2928 7.2929C17.4804 7.10536 17.7347 7.00001 17.9999 7.00001C18.2652 7.00001 18.5195 7.10536 18.7071 7.2929C18.8946 7.48044 18.9999 7.73479 18.9999 8.00001V11.5863L25.2924 5.29251C25.4801 5.10487 25.7346 4.99945 25.9999 4.99945C26.2653 4.99945 26.5198 5.10487 26.7074 5.29251C26.8951 5.48015 27.0005 5.73464 27.0005 6.00001C27.0005 6.26537 26.8951 6.51987 26.7074 6.70751ZM13.9999 17H7.99995C7.73473 17 7.48038 17.1054 7.29284 17.2929C7.1053 17.4804 6.99995 17.7348 6.99995 18C6.99995 18.2652 7.1053 18.5196 7.29284 18.7071C7.48038 18.8947 7.73473 19 7.99995 19H11.5862L5.29245 25.2925C5.10481 25.4801 4.99939 25.7346 4.99939 26C4.99939 26.2654 5.1048 26.5199 5.29245 26.7075C5.48009 26.8951 5.73458 27.0006 5.99995 27.0006C6.26531 27.0006 6.5198 26.8951 6.70745 26.7075L12.9999 20.4138V24C12.9999 24.2652 13.1053 24.5196 13.2928 24.7071C13.4804 24.8947 13.7347 25 13.9999 25C14.2652 25 14.5195 24.8947 14.7071 24.7071C14.8946 24.5196 14.9999 24.2652 14.9999 24V18C14.9999 17.7348 14.8946 17.4804 14.7071 17.2929C14.5195 17.1054 14.2652 17 13.9999 17Z'

const CHART_ICON_RESTORE =
  'path://M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z'

export class SelectDistributionView {

  /**
   * @param {import('./SelectDistributionController.js').SelectDistributionController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.contentEl = null
    this.gridEl = null
    this.chartEl = null
    this.$modal = null
    this.$content = null
    this.$grid = null
    this.$tableBody = null
    /** @type {import('echarts').ECharts|null} */
    this.chartCanvas = null
    this.chartWidth = null
    this.chartHeight = null
    /** @type {1|2|null} */
    this.indicatorType = null
    /** @type {string[]} */
    this.usedColors = []
    this._bound = false
    this._chartInitialized = false
    /** @type {(() => void)|null} */
    this._onDocumentFullscreenChange = null
  }

  /**
   * Привязка модалки, таблицы, кнопок `[data-btn]`, радио `parameterType` (п.16 §1.1).
   *
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document

    this.modalEl =
      scope.querySelector('#select_Distribution_block') ||
      scope.querySelector('.modal-custom__distribution')

    this.contentEl = this.modalEl
      ? this.modalEl.querySelector('.SelectDistributionContent')
      : null

    this.gridEl = scope.querySelector('#SelectDistributionGrid')
    this.chartEl = scope.querySelector('#SelectDistributionChart')

    this.$modal = $(this.modalEl)
    this.$content = $(this.contentEl)
    this.$grid = $(this.gridEl)
    this.$tableBody = this.$grid.find('tbody')

    // Снять legacy onclick до bind и при каждом повторном bind (иначе onclick + data-btn → двойной вызов).
    this._stripLegacyOnclick()

    if (this._bound) {
      return
    }

    this._initTableSortFlag()
    this._bindTableSort()
    this._initChart()
    this._bindCloseButton()
    this._bindToolbarButtons()
    this._bindParameterTypeChange()
    this._bindSearchInput()
    this._bound = true
  }

  /**
   * Сортировка колонок таблицы (легаси `Common.SortTable` в onclick thead; п.16 — bind во view).
   */
  _bindTableSort() {
    this.$grid
      .find('thead th.sortable')
      .off('click.selectDistributionSort')
      .on('click.selectDistributionSort', (ev) => {
        this._sortTable(ev.currentTarget)
      })
  }

  /**
   * Копия `CommonClass.prototype.SortTable` (`Common.js`).
   *
   * @param {HTMLTableCellElement} th
   */
  _sortTable(th) {
    const table = th.closest('table')
    const tbody = table.querySelector('tbody')
    const columnIndex = Array.from(th.parentNode.children).indexOf(th)

    th.asc = !th.asc

    Array.from(tbody.querySelectorAll('tr'))
      .sort(this._buildRowComparer(columnIndex, th.asc))
      .forEach((tr) => {
        tbody.appendChild(tr)
      })

    $(th).addClass(th.asc ? 'asc' : 'desc')
    $(th).removeClass(th.asc ? 'desc' : 'asc')
  }

  /**
   * @param {number} columnIndex
   * @param {boolean} asc
   * @returns {(a: HTMLTableRowElement, b: HTMLTableRowElement) => number}
   */
  _buildRowComparer(columnIndex, asc) {
    return (rowA, rowB) => {
      const valueA = this._getTableCellText(rowA, columnIndex)
      const valueB = this._getTableCellText(rowB, columnIndex)
      const isXA = valueA === 'x'
      const isXB = valueB === 'x'

      if (isXA && !isXB) {
        return 1
      }

      if (!isXA && isXB) {
        return -1
      }

      if (isXA && isXB) {
        return 0
      }

      const numA = Number.parseFloat(valueA)
      const numB = Number.parseFloat(valueB)

      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return asc ? numA - numB : numB - numA
      }

      return asc
        ? valueA.toString().localeCompare(valueB)
        : valueB.toString().localeCompare(valueA)
    }
  }

  /**
   * @param {HTMLTableRowElement} row
   * @param {number} columnIndex
   * @returns {string}
   */
  _getTableCellText(row, columnIndex) {
    const cell = row.children[columnIndex]

    return cell ? (cell.innerText || cell.textContent || '') : ''
  }

  /**
   * Легаси `stress-ui.run`: `tableLR.asc = true` на колонке LR.
   */
  _initTableSortFlag() {
    if (!this.gridEl) {
      return
    }

    const tableLr = this.gridEl.querySelector('[data-field="LR"]')

    if (tableLr) {
      tableLr.asc = true
    }
  }

  /**
   * Ширина графика: половина `.page__stress` минус padding (легаси `StressChart.init`).
   *
   * @returns {number}
   */
  _resolveChartWidthPx() {
    const pageWidth = $('.page__stress').width()

    if (pageWidth == null || Number.isNaN(Number(pageWidth))) {
      return 400
    }

    return pageWidth / 2 - CHART_WIDTH_PADDING
  }

  /**
   * Базовый `option` с toolbox (п.16 §1.2–1.3).
   *
   * @returns {Object}
   */
  _buildBaseChartOption() {
    return {
      title: { text: 'График', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: [], orient: 'horizontal', bottom: 0, left: 'center', selected: {} },
      grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'value',
        boundaryGap: true,
        data: [],
        name: 'Значения',
        nameLocation: 'center',
        nameGap: 40,
        axisLabel: { rotate: 45 },
      },
      yAxis: [{ type: 'value', name: 'Плотность' }],
      dataZoom: [
        {
          type: 'slider',
          show: true,
          realtime: true,
          height: 20,
          bottom: 40,
          filterMode: 'filter',
        },
        { type: 'inside', realtime: true, xAxisIndex: 0, minSpan: 1 },
      ],
      series: [],
      toolbox: this._buildChartToolbox(),
    }
  }

  /**
   * Toolbox: myRestore, dataView, fullscreen (легаси `StressChart.init` toolbox).
   *
   * @returns {Object}
   */
  _buildChartToolbox() {
    const view = this

    return {
      feature: {
        myRestore: {
          show: true,
          title: 'Отобразить все',
          icon: CHART_ICON_RESTORE,
          onclick() {
            view._onToolboxRestoreAll()
          },
        },
        dataView: {
          show: true,
          readOnly: true,
          title: 'Просмотр данных',
          buttonColor: '#1e90ff',
          lang: ['Просмотр данных', 'Закрыть', 'Обновить'],
          optionToContent(opt) {
            const axisData = opt.xAxis[0].data
            const series = opt.series
            let tableHead = '<th></th>'
            let tableBody = ''

            series.forEach((item) => {
              tableHead +=
                `<th class="font-mono font-semibold text-black text-base" ` +
                'style="width: 200px;overflow: hidden;overflow-wrap: anywhere;">' +
                `${item.name}</th>`
            })

            axisData.forEach((date, index) => {
              tableBody += `<tr><td>${date}</td>`

              series.forEach((item) => {
                const value = item.data[index] !== null ? item.data[index] : '-'

                tableBody +=
                  '<td><p class="font-mono font-normal text-black text-base text-center" ' +
                  'style="width: 200px;overflow: hidden;overflow-wrap: anywhere;">' +
                  `${value}</p></td>`
              })

              tableBody += '</tr>'
            })

            return (
              `<table style="width:max-content;"><thead><tr>${tableHead}</tr></thead>` +
              `<tbody>${tableBody}</tbody></table>`
            )
          },
        },
        myfullscreen: {
          show: true,
          title: 'Полный экран',
          icon: CHART_ICON_FULL,
          onclick(e) {
            view._onToolboxFullscreen(e)
          },
        },
      },
    }
  }

  /**
   * «Отобразить все» — включить все чекбоксы распределений в таблице (легаси myRestore).
   */
  _onToolboxRestoreAll() {
    this.$grid
      .find('[distribution] input[type="checkbox"]:not(:checked)')
      .each(function () {
        $(this).prop('checked', true)
        this.dispatchEvent(new Event('change', { bubbles: true }))
      })
  }

  /**
   * Вход/выход из fullscreen (легаси myfullscreen).
   *
   * @param {{ option: Object }} e
   */
  _onToolboxFullscreen(e) {
    const container = this.chartCanvas.getDom()

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        e.option.toolbox[0].feature.myfullscreen.title = 'Выйти из полного экрана'
        e.option.toolbox[0].feature.myfullscreen.icon = CHART_ICON_EXIT_FULL
        this.chartCanvas.setOption({ backgroundColor: '#ffffff' })
        this.chartCanvas.resize({
          width: window.screen.width + 'px',
          height: window.screen.height + 'px',
        })
      })
      return
    }

    document.exitFullscreen().then(() => {
      setTimeout(() => {
        const widthPx = this._resolveChartWidthPx()

        e.option.toolbox[0].feature.myfullscreen.title = 'Полный экран'
        e.option.toolbox[0].feature.myfullscreen.icon = CHART_ICON_FULL
        this.chartCanvas.setOption({ backgroundColor: '' })
        this.chartCanvas.resize({ width: widthPx + 'px', height: CHART_HEIGHT_PX })
        this.chartCanvas.getDom().offsetHeight
      }, 100)
    })
  }

  /**
   * `echarts.init` + каркас с toolbox (легаси `StressChart.init`).
   */
  _initChart() {
    if (this._chartInitialized || !this.chartEl || typeof echarts === 'undefined') {
      return
    }

    const widthPx = this._resolveChartWidthPx()
    const widthStr = widthPx + 'px'

    this.chartCanvas = echarts.init(this.chartEl, null, {
      width: widthStr,
      height: CHART_HEIGHT_PX,
      renderer: 'canvas',
      useDirtyRect: false,
      locale: 'RU',
    })

    this.chartWidth = this.chartCanvas.getWidth()
    this.chartHeight = this.chartCanvas.getHeight()
    this.chartCanvas.setOption(this._buildBaseChartOption())
    this._bindFullscreenChange()
    this._bindChartResize()
    this._chartInitialized = true
  }

  /** Выход из fullscreen по Esc / системной кнопке (легаси `fullscreenchange`). */
  _bindFullscreenChange() {
    if (this._onDocumentFullscreenChange) {
      document.removeEventListener('fullscreenchange', this._onDocumentFullscreenChange)
    }

    this._onDocumentFullscreenChange = () => {
      if (!document.fullscreenElement && this.chartCanvas) {
        setTimeout(() => {
          this.chartCanvas.setOption({ backgroundColor: '' })
          this.chartCanvas.resize({
            width: this.chartWidth + 'px',
            height: this.chartHeight + 'px',
          })
        }, 100)
      }
    }

    document.addEventListener('fullscreenchange', this._onDocumentFullscreenChange)
  }

  _bindChartResize() {
    $(window)
      .off('resize.selectDistributionChart')
      .on('resize.selectDistributionChart', () => {
        if (this.chartCanvas) {
          this.chartCanvas.resize()
        }
      })
  }

  /**
   * Крестик в `.modal-custom__nav` (п.16 §1.7; легаси `toggleModal` / onclick).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.selectDistributionClose')
      .on('click.selectDistributionClose', (ev) => {
        ev.preventDefault()
        this.controller.closeModal()
      })
  }

  /**
   * Кнопки модалки с `data-btn` (chooseDistribution, checkDistribution, clearList, …) — п.16 §1.7.
   */
  _bindToolbarButtons() {
    this.$modal
      .off('click.selectDistributionToolbar', '[data-btn]')
      .on('click.selectDistributionToolbar', '[data-btn]', (ev) => {
        ev.preventDefault()
        ev.stopImmediatePropagation()
        const $btn = $(ev.currentTarget)
        const action = $btn.attr('data-btn')

        if (action) {
          this.controller.handleModalAction(action)
        }
      })
  }

  /**
   * Снять legacy inline-handlers с модалки (п.16 §1.7).
   * У элементов с `data-btn` onclick тоже убираем — иначе два обработчика на один клик.
   */
  _stripLegacyOnclick() {
    if (!this.$modal || !this.$modal.length) {
      return
    }

    this.$modal.find('[onclick*="InputSelectDistribution"]').removeAttr('onclick')
    this.$modal.find('[data-btn][onclick]').removeAttr('onclick')
  }

  /**
   * Радио «Распределение» / «Модель» (легаси `InputSelectDistribution.init` → `changeType`).
   */
  _bindParameterTypeChange() {
    this.$modal
      .find('[name="parameterType"]')
      .off('change.selectDistributionParameterType')
      .on('change.selectDistributionParameterType', () => {
        this.controller.onParameterTypeChange()
      })
  }

  /**
   * Поиск по таблице (п.16 §4.5; легаси `initSerachDistributionToListPopUp`).
   */
  _bindSearchInput() {
    this.$searchAnchor = this.$modal.find('#serachDistributionToList')
    this.$searchPopupNav = this.$content.find('.FrameLeft .Frame12')

    this.$modal
      .find('.search__input')
      .off('input.selectDistributionSearch')
      .on('input.selectDistributionSearch', (ev) => {
        this.controller.onSearchDistributionInput($(ev.currentTarget).val())
      })
  }

  /**
   * Имена распределений из строк tbody (легаси `serachDistributionToList`).
   *
   * @returns {Array<{ name: string }>}
   */
  collectTableRowNames() {
    /** @type {Array<{ name: string }>} */
    const names = []

    this.$tableBody.find('tr').each((_index, el) => {
      const text = $(el).find('td[field="name"]').text().trim()

      if (text) {
        names.push({ name: text })
      }
    })

    return names
  }

  /**
   * Popup со списком найденных распределений (легаси `CustomePopUp` → `searchDistribution`).
   *
   * @param {Array<{ dist_type: string }>} items
   */
  showSearchDistributionPopup(items) {
    const $anchor = this.$searchAnchor
    const $nav = this.$searchPopupNav

    if (!$anchor.length || !$nav.length) {
      return
    }

    $nav.find('.custom-popup').remove()

    const $popUp = $('<div class="custom-popup"><div class="custom-popup__body"></div></div>')
    const $popUpBody = $popUp.find('.custom-popup__body')
    const elPosition = $anchor.position()
    const elWidth = $anchor[0].getBBox().width
    const offsetRight = 24
    const left = elPosition.left - elWidth - offsetRight

    $popUp.css({
      top: '2.125rem',
      left: `${left}px`,
    })

    const oldSelected = $anchor.attr('data-selected')

    ;(items || []).forEach((res) => {
      const distType = res.dist_type
      const isActive =
        oldSelected !== undefined &&
        oldSelected.toLowerCase() === String(distType).toLowerCase()
      const $item = $(
        `<div class="custom-popup__item"${isActive ? ' style="background: #004c97; color:#fff;"' : ''}>` +
          `<p class="custom-popup__text">${distType}</p>` +
          `</div>`,
      )

      $item.on('click', (ev) => {
        const name = $(ev.currentTarget).find('.custom-popup__text').text()
        let color = '#004c97'
        let textInfo = 'Фильтр'

        if (name !== 'Все') {
          color = '#00972e'
          textInfo = name
          $anchor.attr('data-selected', name)
        } else {
          $anchor.removeAttr('data-selected')
        }

        $anchor.css('fill', color)

        if ($anchor[0]._tippy !== undefined) {
          $anchor[0]._tippy.setProps({
            content: '<p class="tooltipe__text">' + textInfo + '</p>',
          })
        }

        $('.custom-popup').remove()
        this.moveTableRowsToTop(name)
      })

      $popUpBody.append($item)
    })

    $nav.append($popUp)
  }

  /**
   * Popup добавления одного распределения/модели (минимальный вариант CustomePopUp `addNewDistribution`).
   *
   * @param {Array<{ name: string }>} items
   */
  showAddDistributionPopup(items) {
    const $anchor = this.$modal.find('#addDistributionToList')
    const $nav = this.$content.find('.FrameLeft .Frame12')

    if (!$anchor.length || !$nav.length) {
      return
    }

    $nav.find('.custom-popup').remove()

    const $popUp = $('<div class="custom-popup"><div class="custom-popup__body"></div></div>')
    const $popUpBody = $popUp.find('.custom-popup__body')
    const elPosition = $anchor.position()
    const elWidth = $anchor[0].getBBox().width
    const offsetRight = 24
    const left = elPosition.left - elWidth - offsetRight

    $popUp.css({
      top: '2.125rem',
      left: `${left}px`,
    })

    const renderItems = (sourceItems) => {
      $popUpBody.empty()

      ;(sourceItems || []).forEach((item) => {
        const name = item.name
        const $item = $(
          `<div class="custom-popup__item">` +
            `<img class="custom-popup__img" src="img/distribution/${name}.svg" />` +
            `<p class="custom-popup__text">${name}</p>` +
            `</div>`,
        )

        $item.on('click', () => {
          $('.custom-popup').remove()
          this.controller.onAddDistributionPopupSelect(name)
        })

        $popUpBody.append($item)
      })
    }

    const $searchInput = $('<input type="text" class="custom-popup__input" placeholder="Найти" />')

    $searchInput.on('input', (ev) => {
      const val = String($(ev.currentTarget).val() || '').toLowerCase()
      const filteredItems = val === ''
        ? items
        : (items || []).filter((item) => String(item.name || '').toLowerCase().includes(val))

      renderItems(filteredItems)
    })

    $popUp.prepend($searchInput)
    renderItems(items)
    $nav.append($popUp)
  }

  /**
   * Переместить строку распределения в начало tbody (легаси `createSearchItemDistribution` click).
   *
   * @param {string} distType
   */
  moveTableRowsToTop(distType) {
    const $rows = this.$tableBody.find(`tr[distribution="${distType}"]`)

    $rows.each(function () {
      $(this).parent().prepend(this)
    })
  }

  /** Убрать popup поиска. */
  _removeSearchPopup() {
    if (this.$searchPopupNav) {
      this.$searchPopupNav.find('.custom-popup').remove()
    }
  }

  /**
   * @param {number} indicatorType — 1 | 2
   */
  setParameterTypeRadio(indicatorType) {
    const type = Number(indicatorType) === 2 ? 2 : 1
    this.$modal.find(`[name="parameterType"][typeid="${type}"]`).prop('checked', true)
  }

  /**
   * Текущий тип «Распределение» / «Модель» из радио (легаси `parameterType`; п.16 §4.4).
   *
   * @returns {1|2}
   */
  getSelectedParameterType() {
    const $checked = this.$modal.find('[name="parameterType"]:checked')

    if ($checked.length) {
      return Number($checked.attr('typeid')) === 2 ? 2 : 1
    }

    return 1
  }

  /**
   * Число строк в tbody (для индекса новых строк §4.4).
   *
   * @returns {number}
   */
  getTableRowCount() {
    return this.$tableBody ? this.$tableBody.find('tr').length : 0
  }

  /**
   * Выбранная radio-строка для choose (легаси `input[name="propRadio"]:checked`).
   *
   * @returns {string|null}
   */
  getSelectedDistributionType() {
    const $selected = this.$modal.find('input[name="propRadio"]:checked')

    if (!$selected.length) {
      return null
    }

    const distType = $selected.closest('tr').attr('Distribution')

    return distType != null && distType !== '' ? String(distType) : null
  }

  /**
   * Текст кнопки choose (п.16 §3.5; легаси `handleGetDistributionDataResponse`).
   *
   * @param {1|2} indicatorType
   */
  setChooseButtonLabel(indicatorType) {
    const $btn = this.$content.find('[data-btn="chooseDistribution"] .Text')

    if (!$btn.length) {
      return
    }

    if (indicatorType === 2) {
      $btn.text('Выбрать модель')
    } else {
      $btn.text('Выбрать распределение')
    }
  }

  /**
   * Показать модалку (легаси `toggleModal` при открытии; п.16 §1.6).
   *
   * @param {Object} [context]
   */
  openModal(context) {
    if (context && context.indicatorType != null) {
      this.setParameterTypeRadio(context.indicatorType)
      this.setChooseButtonLabel(Number(context.indicatorType) === 2 ? 2 : 1)
    }

    this._cleanupModalContentIfNeeded()
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /**
   * Скрыть модалку (легаси `toggleModal` при закрытии; п.16 §1.6).
   */
  closeModal() {
    $('html').animate({ scrollTop: 0 }, 500)
    this._removeSearchPopup()
    this._cleanupModalContentIfNeeded()
    this.$modal.addClass('Hidden')
  }

  /**
   * Если в таблице есть строки — очистка как в легаси `toggleModal` (tbody, график, active row).
   */
  _cleanupModalContentIfNeeded() {
    const $items = this.$tableBody.find('tr')

    if ($items.length === 0) {
      return
    }

    this.$tableBody.empty()
    this.clearChart()
    this._deactivateInputRow()
    this.controller.onModalClosed()
  }

  /** Снять `isActive` с активной строки Input (легаси `toggleModal`). */
  _deactivateInputRow() {
    $('.block-parameters__body .ListRow[isactive="true"]').attr('isActive', 'false')
  }

  /**
   * Базовые серии по payload (легаси `StressChart.loadingData`) — п.16 §1.4.
   *
   * @param {Object} chartPayload
   */
  updateChart(chartPayload) {
    if (!chartPayload || !this.chartCanvas) {
      return
    }

    const indicatorType = chartPayload.indicatorType === 2 ? 2 : 1
    const binCenters = chartPayload.binCenters || []
    const binHeights = chartPayload.binHeights || []
    const rowContext = chartPayload.rowContext || {}
    const hasData = binCenters.length > 0 || binHeights.length > 0

    this.indicatorType = indicatorType

    const option = this.chartCanvas.getOption()
    const widthPx = this._resolveChartWidthPx()

    if (hasData) {
      if (indicatorType === 1) {
        const xData = binCenters
        const yData = binHeights

        option.xAxis[0].data = xData
        option.yAxis[0].data = yData
        option.xAxis[0].type = 'value'

        const name = 'Факт'

        if (!option.series.find((item) => item.name === name)) {
          option.series.push({
            barWidth: '100%',
            name,
            data: xData.map((item, index) => [item, yData[index]]),
            type: 'bar',
            itemStyle: { borderColor: '#234dcf', borderWidth: 1.5 },
          })
        }

        option.xAxis[0].name = 'Значения'
        option.yAxis = [{ type: 'value', name: 'Плотность' }]
        option.legend[0].data.push(name)
      } else if (indicatorType === 2) {
        const xData = binCenters

        option.xAxis[0].data = xData
        option.xAxis[0].min = undefined
        option.xAxis[0].max = undefined
        option.xAxis[0].type = 'category'

        let name = 'Исторические данные'
        let nameYAxis = 'Исторические данные'

        if (rowContext.excelType === 1 && rowContext.excelGuid !== '') {
          name = 'Факт'
          nameYAxis = 'Значения'
        }

        if (!option.series.find((item) => item.name === name)) {
          option.series.push({ name, data: binHeights, type: 'line' })
        }

        option.yAxis = [{ type: 'value', name: nameYAxis }]
        option.legend[0].data.push(name)
        option.xAxis[0].name = 'Периоды'
      }
    } else {
      option.legend[0].data = []
      option.series = []
      option.xAxis[0].data = []
    }

    this.chartCanvas.setOption(option, true)
    this.chartWidth = widthPx
    this.chartHeight = CHART_HEIGHT_PX
    this.chartCanvas.resize({ width: widthPx + 'px', height: CHART_HEIGHT_PX })
  }

  /**
   * Добавить линию распределения (легаси `StressChart.addSeries`) — п.16 §1.5.
   *
   * @param {{ name: string, points: Array, color?: string }} spec
   * @returns {string|null} цвет серии для подсветки строки таблицы
   */
  addChartSeries(spec) {
    if (!spec || !this.chartCanvas) {
      return null
    }

    const name = spec.name
    const points = spec.points || []

    if (!name) {
      return null
    }

    const option = this.chartCanvas.getOption()
    const color = spec.color || this._getRandomColor(this.usedColors)
    const newSeries = {
      name,
      type: 'line',
      data: points,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { width: 2, color },
      lineStyle: { width: 2, color },
    }

    if (this.indicatorType === 2) {
      const xAxisData = points.map((item) => item[0])
      const current = option.xAxis[0].data

      option.xAxis[0].data =
        current !== undefined
          ? current.concat(xAxisData.filter((item) => !current.includes(item)))
          : xAxisData
    }

    this.usedColors.push(color)
    option.series.push(newSeries)

    if (option.legend && option.legend.length > 0) {
      option.legend[0].data.push(name)
    }

    this.chartCanvas.setOption(option, true)
    return color
  }

  /**
   * Убрать линию по имени (легаси `StressChart.removeSeries`) — п.16 §1.5.
   *
   * @param {string} name
   */
  removeChartSeries(name) {
    if (!name || !this.chartCanvas) {
      return
    }

    const option = this.chartCanvas.getOption()
    const seriesIndex = option.series.findIndex((s) => s.name === name)

    if (seriesIndex === -1) {
      return
    }

    const colorToRemove = option.series[seriesIndex].itemStyle.color

    this.usedColors = this.usedColors.filter((c) => c !== colorToRemove)
    option.series.splice(seriesIndex, 1)

    if (option.legend && option.legend.length > 0) {
      const legendIndex = option.legend[0].data.indexOf(name)

      if (legendIndex !== -1) {
        option.legend[0].data.splice(legendIndex, 1)
      }
    }

    this.chartCanvas.setOption(option, true)
  }

  /**
   * Полная очистка графика (легаси `StressChart.clear`) — п.16 §1.5.
   */
  clearChart() {
    if (!this.chartCanvas) {
      return
    }

    const option = this.chartCanvas.getOption()

    option.legend[0].data = []
    option.series = []
    option.xAxis[0].data = []
    this.usedColors = []

    this.chartCanvas.setOption(option, true)
    this.chartCanvas.resize({
      width: this.chartWidth + 'px',
      height: this.chartHeight + 'px',
    })
  }

  /**
   * Waiter поверх таблицы (легаси `.modal-custom__distribution .Grid .waiter`).
   */
  showGridWaiter() {
    if (!this.$grid || !this.$grid.length) {
      return
    }

    if (this.$grid.find('.waiter').length === 0) {
      this.$grid.prepend('<div class="waiter"></div>')
    }
  }

  hideGridWaiter() {
    if (this.$grid) {
      this.$grid.find('.waiter').remove()
    }
  }

  clearTableBody() {
    if (this.$tableBody) {
      this.$tableBody.empty()
    }
  }

  /**
   * @param {Array<Object>} rows
   */
  renderTableRows(rows) {
    if (!rows || !this.$tableBody) {
      return
    }

    rows.forEach((item, index) => {
      this.renderTableRow(item, index, item.status || 'fit')
    })
  }

  /**
   * Одна строка таблицы (легаси `renderRow`; checkbox/remove — §4.3 / §4.7).
   *
   * @param {Object} item
   * @param {number} idx
   * @param {'fit'|'unable_to_fit'|'new'} status
   */
  renderTableRow(item, idx, status) {
    let normalBlock = ''
    let colorText = 'black'

    if (status === 'unable_to_fit') {
      colorText = 'red'
    } else if (status === 'fit') {
      colorText = 'green'
    }

    normalBlock = this._buildParamsHtml(item.params, colorText)

    const criteria = item.info_criteria || {}
    const aic = this._toFixedNoRounding(criteria.AIC, 3)
    const hqic = this._toFixedNoRounding(criteria.HQIC, 3)
    const lr = this._toFixedNoRounding(criteria.LR, 3)
    const sic = this._toFixedNoRounding(criteria.SIC, 3)
    const needUpdateAttr = item.getParamFromRequest === true ? 'needUpdate' : ''
    const errorIcon =
      item.error !== undefined
        ? `<svg width="18" height="18" tooltipe="${item.error}" viewBox="0 0 32 32" fill="#e7000b" xmlns="http://www.w3.org/2000/svg">` +
          `<path d="M17.5 22.5C17.5 22.7967 17.412 23.0867 17.2472 23.3334C17.0824 23.58 16.8481 23.7723 16.574 23.8858C16.2999 23.9993 15.9983 24.0291 15.7074 23.9712C15.4164 23.9133 15.1491 23.7704 14.9393 23.5607C14.7296 23.3509 14.5867 23.0836 14.5288 22.7926C14.471 22.5017 14.5007 22.2001 14.6142 21.926C14.7277 21.6519 14.92 21.4176 15.1667 21.2528C15.4133 21.088 15.7033 21 16 21C16.3978 21 16.7794 21.158 17.0607 21.4393C17.342 21.7206 17.5 22.1022 17.5 22.5ZM16 9C13.2425 9 11 11.0188 11 13.5V14C11 14.2652 11.1054 14.5196 11.2929 14.7071C11.4804 14.8946 11.7348 15 12 15C12.2652 15 12.5196 14.8946 12.7071 14.7071C12.8946 14.5196 13 14.2652 13 14V13.5C13 12.125 14.3463 11 16 11C17.6538 11 19 12.125 19 13.5C19 14.875 17.6538 16 16 16C15.7348 16 15.4804 16.1054 15.2929 16.2929C15.1054 16.4804 15 16.7348 15 17V18C15 18.2652 15.1054 18.5196 15.2929 18.7071C15.4804 18.8946 15.7348 19 16 19C16.2652 19 16.5196 18.8946 16.7071 18.7071C16.8946 18.5196 17 18.2652 17 18V17.91C19.28 17.4913 21 15.6725 21 13.5C21 11.0188 18.7575 9 16 9ZM29 16C29 18.5712 28.2376 21.0846 26.8091 23.2224C25.3807 25.3603 23.3503 27.0265 20.9749 28.0104C18.5995 28.9944 15.9856 29.2518 13.4638 28.7502C10.9421 28.2486 8.6257 27.0105 6.80762 25.1924C4.98953 23.3743 3.75141 21.0579 3.2498 18.5362C2.74819 16.0144 3.00563 13.4006 3.98957 11.0251C4.97351 8.64968 6.63975 6.61935 8.77759 5.1909C10.9154 3.76244 13.4288 3 16 3C19.4467 3.00364 22.7512 4.37445 25.1884 6.81163C27.6256 9.24882 28.9964 12.5533 29 16ZM27 16C27 13.8244 26.3549 11.6977 25.1462 9.88873C23.9375 8.07979 22.2195 6.66989 20.2095 5.83733C18.1995 5.00476 15.9878 4.78692 13.854 5.21136C11.7202 5.6358 9.76021 6.68345 8.22183 8.22183C6.68345 9.7602 5.63581 11.7202 5.21137 13.854C4.78693 15.9878 5.00477 18.1995 5.83733 20.2095C6.66989 22.2195 8.07979 23.9375 9.88873 25.1462C11.6977 26.3549 13.8244 27 16 27C18.9164 26.9967 21.7123 25.8367 23.7745 23.7745C25.8367 21.7123 26.9967 18.9164 27 16Z" />` +
          `</svg>`
        : ''

    const $row = $(
      `<tr id="sdRow_${idx}" distributionid="${item.key}" distribution="${item.dist_type}" Distribution="${item.dist_type}" ${needUpdateAttr}>` +
        `<td style=" width: 3rem; "><input type="radio" name="propRadio" ${idx === 0 && status !== 'unable_to_fit' ? 'checked' : ''} class="${status === 'unable_to_fit' ? 'hidden' : ''} " /></td>` +
        `<td style=" width: 3rem; "><input type="checkbox" name="${item.dist_type}" class="${status === 'unable_to_fit' ? 'hidden' : ''}" /></td>` +
        `<td field="name" class="text-${colorText}-600" ${item.error !== undefined ? 'style="display: flex; align-items: center; gap: 0.5rem; "' : ''}>${item.dist_type}${errorIcon}</td>` +
        `<td field="SIC" class="text-${colorText}-600" ><p class="distribution__text" title="${criteria.SIC}">${sic}</p></td>` +
        `<td field="AIC" class="text-${colorText}-600" ><p class="distribution__text" title="${criteria.AIC}">${aic}</p></td>` +
        `<td field="HQIC" class="text-${colorText}-600" ><p class="distribution__text" title="${criteria.HQIC}">${hqic}</p></td>` +
        `<td field="LR" class="text-${colorText}-600" ><p class="distribution__text" title="${criteria.LR}">${lr}</p></td>` +
        `<td field="params">${normalBlock}</td>` +
        `<td>` +
        `<div style="width: 3rem;height: 100%;text-align: center;vertical-align: middle;display: flex;justify-content: center;">` +
        `<svg class="removeRow" fill="#aa1212" style="cursor: pointer;" tooltipe="Удалить распределение" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">` +
        `<path d="M27 6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM24 26H8V8H24V26ZM10 3C10 2.73478 10.1054 2.48043 10.2929 2.29289C10.4804 2.10536 10.7348 2 11 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3C22 3.26522 21.8946 3.51957 21.7071 3.70711C21.5196 3.89464 21.2652 4 21 4H11C10.7348 4 10.4804 3.89464 10.2929 3.70711C10.1054 3.51957 10 3.26522 10 3Z" />` +
        `</svg>` +
        `</div>` +
        `</td>` +
        `</tr>`,
    )

    this.$tableBody.append($row)
    this._bindRowCheckbox($row)
    this._bindRowRemove($row, status)
    this._initRowTooltips($row)
  }

  /**
   * Удаление строки из tbody (п.16 §4.7).
   *
   * @param {string} distType
   */
  removeTableRowByDistType(distType) {
    this.$tableBody.find(`tr[distribution="${distType}"]`).remove()
  }

  /**
   * Обновить строки после ChoiceDistribution (п.16 §5.2; легаси `updateRow`).
   *
   * @param {Array<Object>} results
   * @param {Array<Object>} unableToFit
   */
  updateCalculatedRows(results, unableToFit) {
    ;(results || []).forEach((item) => {
      const distType = item.dist_type
      const $row = this.$tableBody.find(`tr[distribution="${distType}"][needUpdate]`)

      if (!$row.length) {
        return
      }

      const failed = (unableToFit || []).find((el) => el.dist_type === distType)

      if (failed === undefined) {
        this._updateCalculatedSuccessRow($row, item)
      } else {
        this._updateCalculatedFailedRow($row)
      }

      $row.removeAttr('needUpdate')
    })
  }

  /**
   * @param {JQuery} $row
   * @param {Object} item
   */
  _updateCalculatedSuccessRow($row, item) {
    const criteria = item.info_criteria || {}

    Object.keys(criteria).forEach((field) => {
      this._updateCriteriaCell($row, field, criteria[field], 'green')
    })

    $row.find('[field="params"]').empty().append(this._buildParamsHtml(item.params, 'green'))
  }

  /**
   * @param {JQuery} $row
   */
  _updateCalculatedFailedRow($row) {
    $row.find('[name="propRadio"]').removeAttr('checked').addClass('hidden')
    $row.find('[type="checkbox"]').addClass('hidden')
    $row.find('[field="name"]').removeClass().addClass('text-red-600')
    ;['AIC', 'HQIC', 'LR', 'SIC'].forEach((field) => {
      this._updateCriteriaCell($row, field, 'x', 'red')
    })
    $row.find('[field="params"]').empty()
  }

  /**
   * @param {JQuery} $row
   * @param {string} field
   * @param {*} value
   * @param {'green'|'red'} color
   */
  _updateCriteriaCell($row, field, value, color) {
    const $field = $row.find(`[field="${field}"]`)

    if (!$field.length) {
      return
    }

    $field
      .removeClass()
      .addClass(`text-${color}-600`)
      .empty()
      .append(
        `<p class="distribution__text" title="${value}">${this._toFixedNoRounding(value, 3)}</p>`,
      )
  }

  /**
   * Клик по `.removeRow` → controller (п.16 §4.7; легаси `renderRow`).
   *
   * @param {JQuery} $row
   * @param {'fit'|'unable_to_fit'|'new'} status
   */
  _bindRowRemove($row, status) {
    $row.find('.removeRow').on('click.selectDistributionRemove', (ev) => {
      ev.preventDefault()
      const $parent = $(ev.currentTarget).closest('[distribution]')
      const distType = $parent.attr('Distribution')

      if (distType) {
        this.controller.onRemoveDistributionRow(distType, status)
      }
    })
  }

  /**
   * Checkbox → линия на графике (п.16 §4.3; легаси `renderRow` → `change`).
   *
   * @param {JQuery} $row
   */
  _bindRowCheckbox($row) {
    $row.find('input[type="checkbox"]').on('change.selectDistributionCheckbox', (ev) => {
      const $input = $(ev.currentTarget)
      const $parent = $input.closest('[distribution]')
      const distType = $input.attr('name')

      if (!distType) {
        return
      }

      if ($input.is(':checked')) {
        const seriesColor = this.controller.onDistributionCheckboxChange(distType, true)

        if (seriesColor !== null) {
          $parent.css('background', seriesColor + '33')
        }
      } else {
        this.controller.onDistributionCheckboxChange(distType, false)
        $parent.css('background', 'transparent')
      }
    })
  }

  /**
   * @param {JQuery} $row
   */
  _initRowTooltips($row) {
    if (typeof tippy !== 'function') {
      return
    }

    $row.find('[tooltipe]').each((_index, element) => {
      const text = $(element).attr('tooltipe')

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
   * HTML блока параметров распределения (легаси `NormalBlock`).
   *
   * @param {Object|null|undefined} params
   * @param {string} colorText
   * @returns {string}
   */
  _buildParamsHtml(params, colorText) {
    let html = ''

    if (params === null || params === undefined) {
      return html
    }

    Object.keys(params).forEach((key) => {
      html +=
        `<div style="display:flex; gap: 1rem;">` +
        `<p style="margin: 0;" class="text-${colorText}-600">${key}</p>` +
        `<p style="margin: 0;" class="text-${colorText}-600 distribution__text" title="${params[key]}">` +
        `${this._toFixedNoRounding(params[key], 3)}</p>` +
        `</div>`
    })

    return html
  }

  /**
   * Копия `toFixedNoRounding` из легаси `utils.js`.
   *
   * @param {*} num
   * @param {number} decimals
   * @returns {string}
   */
  _toFixedNoRounding(num, decimals) {
    if (num == null) {
      return ''
    }

    const str = String(num)
    const dotIndex = str.indexOf('.')

    if (dotIndex === -1) {
      return str
    }

    return str.substring(0, dotIndex + decimals + 1)
  }

  /**
   * @param {string[]} [existingColors]
   * @returns {string}
   */
  _getRandomColor(existingColors = []) {
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

    if (existingColors.length >= 16777213) {
      throw new Error('Все возможные цвета уже использованы')
    }

    let color

    do {
      const r = getRandomInt(1, 254)
      const g = getRandomInt(1, 254)
      const b = getRandomInt(1, 254)

      color =
        `#${r.toString(16).padStart(2, '0')}` +
        `${g.toString(16).padStart(2, '0')}` +
        `${b.toString(16).padStart(2, '0')}`
    } while (color === '#000000' || color === '#ffffff' || existingColors.includes(color))

    return color
  }
}
