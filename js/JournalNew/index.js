/**
 * Точка входа: создание MVC и инициализация.
 */

import { JournalModel } from './models/JournalModel.js';
import { JournalController } from './controllers/JournalController.js';

function JournalClass() {

    var self = this;
    self.config = {};

    this.init = function () {
        debugLog("[Journal]: Initialization...");
        try {
            const KapRibbon = window.top.document.getElementsByClassName("KapRibbon");
            if (KapRibbon != undefined && KapRibbon[0]) {
                KapRibbon[0].parentNode.style.display = 'none';
                const rv = window.top.document.getElementsByClassName("kap-RootView")[0];
                if (rv) rv.parentNode.style.inset = "0px";
            }
        } catch (error) {
            debugWarn("hideRibbon:", error);
        }

        const urlParams = self.getJsonFromUrl();
        self.urlPars = urlParams;
        if (urlParams?.moniker?.length > 0) self.config.Moniker = urlParams.moniker;
        if (urlParams?.urlbi?.length > 0) self.config.ClientServiceUrl = urlParams.urlbi;

        debugLog('[Journal]: Params parsed');

        if (self.config.Moniker?.length > 0 && self.metabase) {
            self.metabase.Open({ Moniker: self.config.Moniker, PPServiceUrl: self.config.ClientServiceUrl });
            self.bi.clearCache();
            if (self.common.checkStatusPP) self.common.StatusId = setInterval(function () { self.common.checkStatusPP(); }, 2 * 60 * 1000);
            debugLog('[Journal]: Foresight env initialized');
        }

        // Создание модели и контроллера
        const model = new JournalModel();
        const controller = new JournalController(model, self);
        
        controller.init();

        debugLog('[Journal]: Initialization completed');
    };

    this.getJsonFromUrl = function () {
        let url = decodeURIComponent(location.search);
        let query = url.substr(1);
        let result = {};
        query.split("&").forEach(function (part) {
            let item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });

        return result;
    };
}

function run() {
    var journal = new JournalClass();
    journal.init();
}

run();