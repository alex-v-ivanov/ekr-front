/**
 * Единая точка входа приложения.
 * Инициализация: Config → Bi, Metabase, Common → выбор отчёта → передача deps → app.run().
 * Все зависимости передаются явно через объект deps.
 */

import { Dims, ForeKeys } from "./Common/config.js";
import { Config, getJsonFromUrl, CommonClass } from "./Common/Common.js";
import { ReportType, PathSegment, ApiStatus, NEW_LINE } from "./Common/constants.js";
import { BiService } from "./BI/bi.js";
import { MetabaseClass } from "./BI/sap.PP.metabase.js";
import { openDimCombo } from "./BI/sap.PP.Ui.DimCombo.js";

function hideRibbon() {
    try {
        var KapRibbon = window.top.document.getElementsByClassName("KapRibbon");
        if (KapRibbon && KapRibbon[0]) {
            KapRibbon[0].parentNode.style.display = "none";
            var rootView = window.top.document.getElementsByClassName("kap-RootView")[0];
            if (rootView && rootView.parentNode) rootView.parentNode.style.inset = "0px";
        }
    } catch (e) {
        debugWarn("hideRibbon:", e);
    }
}

function getReportType() {
    var path = typeof window !== "undefined" && window.location ? window.location.pathname || "" : "";
    if (path.indexOf(PathSegment.PROGNOZ_CONF) >= 0) return ReportType.PROGNOZ;
    if (path.indexOf(PathSegment.STRESS_CONF) >= 0) return ReportType.STRESS;
    if (path.indexOf(PathSegment.ALG_UTILS) >= 0) return ReportType.ALG_UTILS;
    if (path.indexOf(PathSegment.JOURNAL) >= 0) return ReportType.JOURNAL;
    return ReportType.JOURNAL;
}

function initApp() {
    var config = new Config();
    config.Initialize();

    config.currentPath = typeof window !== "undefined" && window.top && window.top.document && window.top.document.location
        ? window.top.document.location.pathname.split("/Reports")[0]
        : "";

    var bi = new BiService(config);
    var metabase = new MetabaseClass(bi, config);
    var common = new CommonClass(config);

    common.urlPars = config.urlPars;
    common.metabase = metabase;
    metabase.setCommon(common);

    if (typeof window !== "undefined") {
        window.Common = common;
    }

    hideRibbon();

    if (config.Moniker && config.ClientServiceUrl) {
        metabase.Open({ Moniker: config.Moniker, PPServiceUrl: config.ClientServiceUrl });
        bi.clearCache();
        common.StatusId = setInterval(function () {
            common.checkStatusPP();
        }, 2 * 60 * 1000);
    }

    if (typeof common.docReady === "function") {
        common.docReady();
    }

    var openDimComboWithMetabase = function (dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
        return openDimCombo(metabase, dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad);
    };

    var deps = {
        config: config,
        bi: bi,
        metabase: metabase,
        common: common,
        openDimCombo: openDimComboWithMetabase,
        Dims: Dims,
        ForeKeys: ForeKeys,
        getJsonFromUrl: getJsonFromUrl,
        ReportType: ReportType,
        ApiStatus: ApiStatus,
        NEW_LINE: NEW_LINE
    };

    var reportType = getReportType();

    function runReport() {
        if (reportType === ReportType.JOURNAL) {
            import("./Journal/index.js").then(function (m) {
                if (m.default) m.default(deps);
            }).catch(function (err) {
                debugError("Journal init failed", err);
            });
        } else if (reportType === ReportType.PROGNOZ) {
            import("./Prognoz/index.js").then(function (m) {
                if (m.default) m.default(deps);
            }).catch(function (err) {
                debugError("Prognoz init failed", err);
            });
        } else if (reportType === ReportType.STRESS) {
            import("./Stress/index.js").then(function (m) {
                if (m.default) m.default(deps);
            }).catch(function (err) {
                debugError("Stress init failed", err);
            });
        } else if (reportType === ReportType.ALG_UTILS) {
            import("./AlgUtils/index.js").then(function (m) {
                if (m.default) m.default(deps);
            }).catch(function (err) {
                debugError("AlgUtils init failed", err);
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runReport);
    } else {
        runReport();
    }
}

initApp();
