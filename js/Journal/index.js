import {
    formatDate,
    getDateFromString,
    getDateDifference,
    pluralize
} from './journal-utils.js';
import { JournalApi } from './journal-api.js';
import { JournalType } from './constants.js';
import { ApiStatus } from '../Common/constants.js';
import { JournalDetailsPopUp } from './journal-details-popup.js';
import { JournalCards } from './journal-cards.js';
import { JournalFilters } from './journal-filters.js';

function JournalReportsClass(deps) {
    var self = this;
    if (deps) {
        self.common = deps.common;
        self.bi = deps.bi;
        self.metabase = deps.metabase;
        self.config = deps.config;
        self.ForeKeys = deps.ForeKeys;
        self.getJsonFromUrl = deps.getJsonFromUrl || (function () { var q = location.search.slice(1); var o = {}; if (q) q.split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) o[kv[0]] = decodeURIComponent(kv[1] || ""); }); return o; });
    } else {
        self.common = typeof window !== "undefined" && window.Common;
        self.bi = typeof window !== "undefined" && window.bi;
        self.metabase = typeof window !== "undefined" && window.Metabase;
        self.config = { Moniker: null, ClientServiceUrl: null, urlPars: null };
        self.ForeKeys = typeof window !== "undefined" && window.ForeKeys;
        self.getJsonFromUrl = function () { var q = location.search.slice(1); var o = {}; if (q) q.split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) o[kv[0]] = decodeURIComponent(kv[1] || ""); }); return o; };
    }

    this.formatDate = formatDate;
    this.UserId = null;
    this.UserName = null;

    const journalApi = new JournalApi(self);
    const Journal = {
        _reports: null,
        data: null,
        dataInterval: null,
        DateFrom: null,
        getDateFromString,
        getDateDifference,
        pluralize,
        init() {
            debugLog("init");
            const reports = this._reports || (typeof window !== "undefined" && window.Reports);
            if (!reports || !reports.common) throw new Error("Journal.init: Reports/common not available");
            this.type = reports.common.urlPars.type || reports.common.urlPars.journalType;
            if (this.type === JournalType.STRESS) {
                $('.page__journal__body').addClass('journal__stres');
            }

            const dt = new Date();
            this.DateFrom = new PP.Ui.DateTimePicker({
                ParentNode: document.getElementById("DateFrom"),
                ShowTime: false,
                CurrentDate: new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0),
                Width: 180,
            });

            journalFilters.initUser();
            journalFilters.initCreationDatePicker();
            this.getData();

            $(document).on('click', '.dropdown svg', function (e) {
                const $select = $(this).siblings('select');
                $select.select2('open');
                e.stopPropagation();
            });

            const $tooltipes = $('[tooltipe]');
            $tooltipes.each((index, element) => {
                const text = $(element).attr('tooltipe');
                tippy(element, {
                    content: '<p class="tooltipe__text">' + text + '</p>',
                    animation: 'fade',
                    followCursor: true,
                    arrow: false,
                    allowHTML: true,
                });
            });
        },
    };

    const journalCards = new JournalCards(Journal);
    const journalFilters = new JournalFilters(Journal);
    const journalDetailsPopUp = new JournalDetailsPopUp(Journal, journalApi);

    Journal.getData = function (upd) {
        const self = this;
        const reports = self._reports || (typeof window !== "undefined" && window.Reports);
        debugLog("getData");
        if (self.type != 1 && self.type != 2) return;
        const dateStr = self.DateFrom.getValue().toShortDate();
        reports.common.waiter.show("getData");
        journalApi.fetchJournalData(Number(self.type), dateStr).then(x => Journal.handleFetchJournalDataResponse(x, upd, self, reports, journalFilters, journalCards));
    };

    /** Обработчик ответа fetchJournalData: обновление данных, интервал, карточки. */
    Journal.handleFetchJournalDataResponse = function (x, upd, self, reports, journalFilters, journalCards) {
        if (x === ApiStatus.ERROR_LOWER) {
            reports.common.waiter.hide("getData");
            clearInterval(self.dataInterval);
            return;
        }
        if (x && x.faultstring && x.faultstring.length > 0) {
            reports.common.waiter.hide("getData");
            clearInterval(self.dataInterval);
            reports.common.showDialog(x.faultstring, "Error");
            return;
        }
        if (self.data == null) {
            self.dataInterval = setInterval(() => { self.getData(true); }, 60000);
        }
        self.data = (x || []).map(item => {
            if (item.StartDateTime !== "") {
                item.create = self.getDateFromString(item.StartDateTime);
            }
            return item;
        });
        if (upd === undefined) {
            const users = [...new Set((x || []).map(item => item.User))];
            if (users.length > 0) {
                journalFilters.loadingUsers(users);
            }
        }
        journalCards.renderCards(x || [], upd);
        reports.common.waiter.hide("getData");
    };

    Journal.detailsPopUp = journalDetailsPopUp;
    Journal.getBageType = (status) => journalCards.getBageType(status);
    Journal.getHtmlCard = (row) => journalCards.getHtmlCard(row);
    Journal.renderCards = (data, upd) => journalCards.renderCards(data, upd);
    Journal.updateCards = (data) => journalCards.updateCards(data);
    Journal.loadingUsers = (users) => journalFilters.loadingUsers(users);
    Journal.initUser = () => journalFilters.initUser();
    Journal.initSelect2Event = ($el) => journalFilters.initSelect2Event($el);
    Journal.initCreationDatePicker = () => journalFilters.initCreationDatePicker();
    Journal.filterJurnalCard = (from, to, user) => journalFilters.filterJurnalCard(from, to, user);
    Journal.clearFilter = () => journalFilters.clearFilter();

    this.Journal = Journal;

    this.init = function () {
        debugLog("Reports init");
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

        if (self.config && self.config.urlPars) {
            self.common.urlPars = self.config.urlPars;
            self.Journal.init();
            return;
        }
        const urlPars = self.getJsonFromUrl();
        self.common.urlPars = urlPars;
        if (urlPars?.moniker?.length > 0) self.config.Moniker = urlPars.moniker;
        if (urlPars?.urlbi?.length > 0) self.config.ClientServiceUrl = urlPars.urlbi;

        debugLog(urlPars, ' - urlPars');
        debugLog("Moniker: " + self.config.Moniker);
        debugLog("ClientServiceUrl: " + self.config.ClientServiceUrl);

        if (self.config.Moniker?.length > 0 && self.metabase) {
            self.metabase.Open({ Moniker: self.config.Moniker, PPServiceUrl: self.config.ClientServiceUrl });
            self.bi.clearCache();
            if (self.common.checkStatusPP) self.common.StatusId = setInterval(function () { self.common.checkStatusPP(); }, 2 * 60 * 1000);
        }
        self.Journal.init();
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
    this.updeteType = function (type) {
        localStorage.setItem("type", type);
        location.reload();
    };
}

function run(deps) {
    var Reports = new JournalReportsClass(deps);
    window.Reports = Reports;
    if (Reports.Journal) Reports.Journal._reports = Reports;
    Reports.init();
}

export default run;
