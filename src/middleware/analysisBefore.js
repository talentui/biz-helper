/**
 * Created by huijuan on 15/8/31.
 */
//截取特定action用于统计分析
import { CALL_FETCH } from "./fetch";

export default function AnalysisBeforeMiddleware(store) {
    return next =>
        action => {
            //序列化url
            function serialize(obj) {
                let result = [];
                for (var k in obj) {
                    result.push(
                        encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
                    );
                }
                return result.join("&");
            }

            function handleTypes(types) {
                if (Array.isArray(types) && types.length == 3) {
                    var last = types[0].lastIndexOf("_");
                    return last ? types[0].slice(0, last) : "";
                } else if (typeof types === "string") {
                    return types;
                }
            }

            function handleParam(_requestType, url, method, params) {
                if (method == "GET" && params) {
                    url = url + "?" + serialize(params);
                }
                //url加域名
                if (url && url.indexOf("http") === -1) {
                    url = location.protocol + "//" + location.host + url;
                }
                window.iTalentPMS &&
                    window.iTalentPMS.addAjax &&
                    window.iTalentPMS.addAjax(
                        _requestType,
                        "start",
                        url,
                        method
                    );
            }

            const callFETCH = action[CALL_FETCH];
            const type = action.type;

            if (typeof callFETCH === "undefined" && type) {
                window.iTalentPMS &&
                    window.iTalentPMS.addAction &&
                    window.iTalentPMS.addAction(type, "start");
            } else if (callFETCH && callFETCH.batch) {
                //针对多个并发接口的打点
                const { batch, types } = callFETCH;
                let _requestType = handleTypes(types);

                for (let i = 0; i < batch.length; i++) {
                    const { url, method, params } = batch[i];
                    handleParam(_requestType, url, method, params);
                }
                window.iTalentPMS &&
                    window.iTalentPMS.addAction &&
                    window.iTalentPMS.addAction(_requestType, "start");
            } else {
                //针对单个请求的打点
                const { url, method, params, types } = callFETCH;
                let _requestType = handleTypes(types);
                handleParam(_requestType, url, method, params);
                window.iTalentPMS &&
                    window.iTalentPMS.addAction &&
                    window.iTalentPMS.addAction(_requestType, "start");
            }
            return next(action);
        };
}
