/**
 * Точка входа: создание MVC и инициализация.
 */

import { JournalModel } from './models/JournalModel.js';
import { JournalController } from './controllers/JournalController.js';

function JournalClass(deps) {

    var self = this;

    // Создание модели и контроллера
    const model = new JournalModel();
    const controller = new JournalController(model, self);
    controller.initFiltersAndDetails();

    // Вспомогательные методы
    this.formatDate = (date) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${month.toString().padStart(2, '0')}.${year}`;
    };

    this.getTime = function (dt) {
        return new Date(new Date() - dt).toLocaleTimeString();
    };

    this.dimSelectByKeys = function (dimId, keys) {
        if (dimId == 'undefined') return;
        let dim = (typeof dimId == "string") ? window[dimId].dim : dimId.dim;
        let dimSrv = dim.getPPService();
        let selArgs = {
            keys: keys,
            selCommand: PP.Mb.SelCommands.Set,
            dmElRelative: PP.Mb.DmElRelative.Current
        };
        if (!Array.isArray(selArgs.keys)) selArgs.keys = [selArgs.keys];
        dimSrv.selectByKeys(dim, selArgs, function (sender, args) {
            let combo = (typeof dimId == "string") ? window[dimId] : dimId;
            combo.dimCombo.refresh();
        });
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

    this.OpenArgs = function (id, value, type) {
        return {
            dt: type,
            id: id,
            n: id,
            k: Number.MAX_SAFE_INTEGER,
            vis: true,
            value: value
        };
    };

    this.createMultiParams = function (val) {
        var vals;
        if (typeof (val) != "string") {
            if (val?.join) {
                vals = val.join().split(',');
            } else {
                vals = val;
            }
        } else {
            if (val.indexOf(',') == -1) {
                return val;
            } else {
                vals = val.split(',');
            }
        }
        if (vals != null && (typeof (vals) == 'object' && vals.length > 0)) {
            vals = vals.map(m => parseInt(m)).sort();
            var pars = "<A T=\"A\" V=\"" + (vals.length) + "\">";
            vals.forEach(function (item, idx) {
                pars += "<A T=\"I\" V=\"" + item + "\"/>";
            });
            pars += "</A>";
            return pars;
        } else {
            return val;
        }
    };

    this.spinUp = function (sender, args) {
        var i = parseInt(sender.getContent());
        if (isNaN(i)) i = 0;
        if (!isNaN(i)) {
            i += 1;
            sender.setContent(i.toString());
        }
        args.IsSpinUp = true;
    };

    this.spinDown = function (sender, args) {
        var i = parseInt(sender.getContent());
        if (!isNaN(i)) {
            i += -1;
            sender.setContent(i.toString());
        }
        args.IsSpinUp = false;
    };

    this.OnAfterChange = function (sender, args) {
        return;
    };

    this.OnBeforeChange = function (sender, args) {
        if (args.NewValue == "") return;
        if (sender._MinValue != undefined) {
            if (args.NewValue > sender._MaxValue)
                args.Cancel = true;
        }
        if (sender._MinValue != undefined) {
            if (args.NewValue < sender._MinValue)
                args.Cancel = true;
        }
        if (sender._IsInt) {
            if (args.NewValue != parseInt(args.NewValue) || args.NewValue.indexOf(".") > -1) {
                args.Cancel = true;
            }
        }
        return;
    };

    this.OpenDimCombo = function (dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
        return window.OpenDimCombo(dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad);
    };

    this.updateType = function (type) {
        localStorage.setItem("type", type);
        location.reload();
    };

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

        self.config = {};

        const urlPars = self.getJsonFromUrl();
        self.urlPars = urlPars;
        if (urlPars?.moniker?.length > 0) self.config.Moniker = urlPars.moniker;
        if (urlPars?.urlbi?.length > 0) self.config.ClientServiceUrl = urlPars.urlbi;

        debugLog('[Journal]: Params parsed');

        if (self.config.Moniker?.length > 0 && self.metabase) {
            self.metabase.Open({ Moniker: self.config.Moniker, PPServiceUrl: self.config.ClientServiceUrl });
            self.bi.clearCache();
            if (self.common.checkStatusPP) self.common.StatusId = setInterval(function () { self.common.checkStatusPP(); }, 2 * 60 * 1000);
        }
        controller.init();

        debugLog('[Journal]: Initialization completed');
    };
}

function run() {
    var Journal = new JournalClass();
    window.Reports = Journal;
    Journal.init();
}

run();