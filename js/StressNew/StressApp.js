import { StressController } from './StressController.js'
import { BiService } from '../BI/bi.js'
import { Config, CommonClass } from '../Common/Common.js'
import { ForeKeys } from '../Common/config.js'

/** Скрытие риббона платформы (легаси `index.js` → `hideRibbon`). */
function hideRibbon() {
  try {
    const kapRibbon = window.top.document.getElementsByClassName('KapRibbon')

    if (kapRibbon && kapRibbon[0]) {
      kapRibbon[0].parentNode.style.display = 'none'
      const rootView = window.top.document.getElementsByClassName('kap-RootView')[0]

      if (rootView && rootView.parentNode) {
        rootView.parentNode.style.inset = '0px'
      }
    }
  } catch (e) {
    debugWarn('hideRibbon:', e)
  }
}

export class StressApp {

  /**
   * @param {Object} bi
   * @param {Object} foreKeys
   */
  constructor(bi, foreKeys) {
    this.controller = new StressController(bi, foreKeys)
  }
}

async function run() {
  hideRibbon()

  const config = new Config()
  config.Initialize()
  const bi = new BiService(config)
  const common = new CommonClass(config)
  common.docReady()
  const app = new StressApp(bi, ForeKeys)

  app.controller.setPutBinConfig(config)

  app.controller.setShowDialog((message, type) => {
    common.showDialog(message, type)
  })

  app.controller.setShowConfirmDialog((message, onConfirm) => {
    common.showDialog(message, 'Exclamation', onConfirm)
  })

  app.controller.view.showWaiter('init', document)

  try {
    const mbSec = await bi.GetMbSec()
    const profile = mbSec.meta.profiles.its.it[0]
    app.controller.setUserId(profile.id)
    app.controller.setUserName(profile.n)
    app.controller.bindView(document)
    await app.controller.initVersion()
  } finally {
    app.controller.view.hideWaiter('init')
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void run()
  })
} else {
  void run()
}