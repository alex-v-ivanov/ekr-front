/**
 * StressView — DOM страницы StressConf: кнопки шапки, оверлей загрузки `.waiter`, навигация.
 * Навигация — как в легаси utils.js; save/run — StressController.
 */
export class StressView {

  /** @type {Record<1|2, { text: string, yesLabel: string }>} */
  static STRESS_ID_MODAL_STEPS = {
    1: {
      text: 'Для данного ID версии стресс-тестирования уже было выполнено стресс-тестирование!',
      yesLabel: 'Перезаписать',
    },
    2: {
      text: 'Запустить повторный стресс-тест и перезаписать результат?',
      yesLabel: 'Да',
    },
  }

  constructor(stressController) {
    this.controller = stressController
    /** @type {Array<{ el: Element, handler: Function }>} */
    this._bindings = []
    this.waiterEl = null
    /** @type {Map<string, number>} счётчик show/hide по токену (параллельные Input/Output с одним токеном) */
    this._waiterTokenCounts = new Map()
    /** @type {0|1|2} */
    this._stressIdStep = 0
    this._stressIdModal = null
    this._stressIdModalText = null
    this._stressIdYesBtn = null
  }

  /**
   * Подписка на кнопки шапки и прочие data-stress-action уровня страницы.
   *
   * @param {HTMLElement|Document|undefined} root
   */
  bind(root) {
    const scope = root && root.querySelector ? root : (typeof document !== 'undefined' ? document : null)

    if (!scope) {
      return
    }

    this._resolveWaiterEl(scope)
    this._unbind()

    const actions = {
      saveConfiguration: () => {
        void this.controller.saveTestState()
      },
      goToInputForms: () => {
        this._goToPage(2)
      },
      goToFinancialRisksReport: () => {
        this._goToPage(1)
      },
      goToJournal: () => {
        this._goToJournal(1)
      },
      runTest: () => {
        this.controller.runTest()
      },
    }

    this._bindStressIdModal(scope)

    Object.keys(actions).forEach((action) => {
      const el = scope.querySelector(`[data-stress-action="${action}"]`)

      if (!el) {
        return
      }

      const handler = (ev) => {
        if (ev && typeof ev.preventDefault === 'function') {
          ev.preventDefault()
        }

        actions[action]()
      }

      el.addEventListener('click', handler)
      this._bindings.push({ el, handler })
    })
  }

  _unbind() {
    this._bindings.forEach(({ el, handler }) => {
      el.removeEventListener('click', handler)
    })
    this._bindings = []
    this._stressIdStep = 0
    this._stressIdModal = null
    this._stressIdModalText = null
    this._stressIdYesBtn = null
  }

  /**
   * Текущее значение поля имени сценария (легаси `$('#stress_test_name').val()` при RunTest).
   *
   * @returns {string}
   */
  getStressTestNameInputValue() {
    const el = typeof document !== 'undefined' ? document.querySelector('#stress_test_name') : null

    return el ? String(el.value) : ''
  }

  /**
   * Модалка подтверждения перезапуска (легаси `stressIdPopUp`, C.2). Без двойного клика «Да» на шаге 2.
   *
   * @param {HTMLElement|Document} scope
   */
  _bindStressIdModal(scope) {
    const modal = scope.querySelector('.modal-custom__StressId')

    if (!modal) {
      return
    }

    this._stressIdModal = modal
    this._stressIdModalText = modal.querySelector('.modal-custom__text')
    this._stressIdYesBtn = modal.querySelector('[data-btn="yes"]')

    const noBtn = modal.querySelector('.modal-custom__content .Button.Outline')
    const closeBtn = modal.querySelector('.modal-custom__nav [style*="cursor: pointer"]')

    const onYes = (ev) => {
      if (ev && typeof ev.preventDefault === 'function') {
        ev.preventDefault()
      }

      this._onStressIdYesClick()
    }

    const onDismiss = (ev) => {
      if (ev && typeof ev.preventDefault === 'function') {
        ev.preventDefault()
      }

      this.closeStressIdModal()
    }

    if (this._stressIdYesBtn) {
      this._stressIdYesBtn.addEventListener('click', onYes)
      this._bindings.push({ el: this._stressIdYesBtn, handler: onYes })
    }

    if (noBtn) {
      noBtn.addEventListener('click', onDismiss)
      this._bindings.push({ el: noBtn, handler: onDismiss })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', onDismiss)
      this._bindings.push({ el: closeBtn, handler: onDismiss })
    }
  }

  /**
   * @param {1|2} step
   */
  openStressIdModal(step) {
    const config = StressView.STRESS_ID_MODAL_STEPS[step]

    if (!this._stressIdModal || !this._stressIdModalText || !config) {
      return
    }

    this._stressIdStep = step
    this._stressIdModalText.textContent = config.text
    this._setStressIdYesLabel(config.yesLabel)
    this._stressIdModal.classList.remove('Hidden')
    this._scrollToTop()
  }

  closeStressIdModal() {
    this._stressIdStep = 0

    if (this._stressIdModal) {
      this._stressIdModal.classList.add('Hidden')
    }
  }

  _onStressIdYesClick() {
    if (this._stressIdStep === 1) {
      this.openStressIdModal(2)
      return
    }

    if (this._stressIdStep === 2) {
      this.closeStressIdModal()
      void this.controller.sendTest()
    }
  }

  /**
   * @param {string} label
   */
  _setStressIdYesLabel(label) {
    const labelEl = this._stressIdYesBtn?.querySelector('.Text div')

    if (labelEl) {
      labelEl.textContent = label
    }
  }

  /** Как легаси `stressIdPopUp.openModal` — прокрутка к шапке. */
  _scrollToTop() {
    if (typeof window !== 'undefined' && window.$ && typeof window.$.fn.animate === 'function') {
      window.$('html').animate({ scrollTop: 0 }, 500)
      return
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /**
   * Оверлей загрузки (легаси common.waiter.show / hide).
   *
   * @param {HTMLElement|Document|undefined} [root]
   */
  _resolveWaiterEl(root) {
    if (this.waiterEl) {
      return
    }

    const scope = root && root.querySelector ? root : (typeof document !== 'undefined' ? document : null)

    if (scope) {
      this.waiterEl = scope.querySelector('.waiter')
    }
  }

  /**
   * @param {string} [token]
   * @param {HTMLElement|Document|undefined} [root]
   */
  showWaiter(token = 'default', root) {
    this._resolveWaiterEl(root)
    const count = this._waiterTokenCounts.get(token) || 0
    this._waiterTokenCounts.set(token, count + 1)

    if (this.waiterEl) {
      this.waiterEl.classList.remove('Hidden')
    }
  }

  /**
   * @param {string} [token]
   */
  hideWaiter(token = 'default') {
    const count = this._waiterTokenCounts.get(token) || 0

    if (count <= 1) {
      this._waiterTokenCounts.delete(token)
    } else {
      this._waiterTokenCounts.set(token, count - 1)
    }

    if (this._waiterTokenCounts.size === 0 && this.waiterEl) {
      this.waiterEl.classList.add('Hidden')
    }
  }

  /**
   * Снимок DOM для run-only проверок (п.15 §5.4, легаси `getStressParams` ~241–251).
   * Только чтение разметки; правила и тексты — в `StressValidator`.
   *
   * @param {HTMLElement|Document|undefined} [root]
   * @returns {{ hasListRowError: boolean, hasHistoricalRangeError: boolean }}
   */
  getRunDomValidationState(root) {
    const scope = root && root.querySelector ? root : (typeof document !== 'undefined' ? document : null)

    if (!scope) {
      return { hasListRowError: false, hasHistoricalRangeError: false }
    }

    return {
      hasListRowError: scope.querySelectorAll('.ListRow.ListRow__error').length > 0,
      hasHistoricalRangeError: scope.querySelectorAll('[field="HistoricalRange"] .error__message').length > 0,
    }
  }

  /** 1 — отчёт о фин. рисках, 2 — формы ввода (как GoToPage в легаси). */
  _goToPage(type) {
    const root = window.parent.location.href.split('#')[0]

    if (type === 1) {
      window.parent.location.href = root + '#/app/navigator?key=1146534'
    } else if (type === 2) {
      window.parent.location.href = root + '#/app/navigator?key=1146525'
    }
  }

  /** 1 — журнал стресс-теста (как GoToJournal в легаси). */
  _goToJournal(type) {
    const root = window.parent.location.href.split('#')[0]
    window.parent.location.href = root + '#/app/navigator?key=1148284' + `&journalType=${type}`
  }
}
