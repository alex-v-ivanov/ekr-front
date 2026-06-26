import { StressUI } from './stress-ui.js';
import { StressValidationMessages } from './constants.js';

/**
 * Единая точка инициализации приложения Stress. Зависимости (common, bi) берутся из this.stress (deps передаются в Stress при создании).
 */
export class StressApp {
    constructor(stress) {
        this.stress = stress;
        this.userId = null;
        this.userName = null;
    }

    run() {
        if (this._runCalled) return;
        this._runCalled = true;

        var common = this.stress.common;
        var bi = this.stress.bi;
        common.waiter.show("init");
        const hideWaiter = () => {
            try {
                common.waiter.hide("init");
            } catch (e) {
                debugWarn("hideWaiter(init):", e);
            }
        };
        const timeoutId = setTimeout(() => {
            hideWaiter();
            debugWarn("Stress init: GetMbSec timeout");
        }, 30000);

        bi.GetMbSec()
            .then((x) => {
                try {
                    if (x && x.meta && x.meta.profiles && x.meta.profiles.its && x.meta.profiles.its.it && x.meta.profiles.its.it[0]) {
                        this.userId = x.meta.profiles.its.it[0].id;
                        this.userName = x.meta.profiles.its.it[0].n;
                    }
                    this.stress.stressUI.run();
                } finally {
                    clearTimeout(timeoutId);
                    hideWaiter();
                }
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                debugError("Stress init: GetMbSec failed", err);
                hideWaiter();
                if (typeof alert === "function") {
                    this.stress.common.showDialog(StressValidationMessages.USER_DATA_LOAD_FAILED);
                }
            });
    }
}
