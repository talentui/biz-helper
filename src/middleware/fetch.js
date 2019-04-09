import "isomorphic-fetch";
var URLSearchParams = require("url-search-params");

//序列化url
function serialize(obj) {
    var result = [];
    for (var k in obj) {
        result.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
    }
    return result.join("&");
}
//判断是否数组
function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

//判断是否为对象
function isObj(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}

//判断是否为空对象
function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}

//请求接口
function callFetch(url, method, params, headers, mode, dataType, mark) {
    var fullUrl = url;
    var data = {};
    var defaultHeaders = {
        Accept: "application/json, application/xml, text/play, text/html, *.*",
        "Content-Type": "application/json; charset=utf-8"
    };
    if (
        window.customParam &&
        isObj(window.customParam) &&
        !isEmptyObject(window.customParam)
    ) {
        params = Object.assign({}, params, window.customParam);
    }
    if (method.toUpperCase() == "GET" && params) {
        fullUrl = fullUrl + "?" + serialize(params); //拼接get请求
    } else if (
        headers &&
        headers["Content-Type"] == "application/x-www-form-urlencoded"
    ) {
        var urlSear = new URLSearchParams();
        for (var i in params) {
            urlSear.append(i, params[i]);
        }
        data.body = urlSear.toString();
        data.method = method;
    } else {
        data.body = JSON.stringify(params);
        data.method = method;
    }

    var newHeaders;
    if (window.customHeaders && typeof window.customHeaders == "function") {
        newHeaders = Object.assign({}, defaultHeaders, window.customHeaders());
    } else {
        newHeaders = Object.assign({}, defaultHeaders, headers);
    }
    data.headers = newHeaders;
    data.credentials = "include"; //传递cookie信息
    // data.mode = mode || null;

    if (dataType && dataType == "text") {
        return fetch(fullUrl, data).then(function(response) {
            return response.text().then(function(json) {
                if (!response.ok) {
                    return Promise.reject({
                        status: response.status,
                        json: json
                    });
                }
                return { status: response.status };
            });
        });
    }

    return fetch(fullUrl, data)
        .then(response => {
            if (!response.ok) {
                response.json = function() {
                    return this.text().then(function(data) {
                        try {
                            return JSON.parse(data);
                        } catch (e) {
                            return Promise.reject(response);
                        }
                    });
                };
            }

            return response.json().then(json => ({ json, response }));
        })
        .then(({ json, response }) => {
            if (!response.ok) {
                return Promise.reject({ json, response });
            }

            if (isArray(json)) {
                return json.slice();
            } else {
                return Object.assign({}, json);
            }
        });
}

//CALL_FETCH  无实际意义 防止用户写错
export const CALL_FETCH = Symbol("call API");

export default (config = {}) =>
    store =>
        next =>
            action => {
                const callFETCH = action[CALL_FETCH];

                if (typeof callFETCH === "undefined") {
                    return next(action);
                }

                const { batch, types } = callFETCH;
                let nextActions;
                let batchArr = [];

                const dispatch = store.dispatch;
                let requestType, successType, failureType;

                if (Array.isArray(types) && types.length == 3) {
                    requestType = types[0];
                    successType = types[1];
                    failureType = types[2];
                } else if (typeof types === "string") {
                    requestType = types + "_REQUEST";
                    successType = types + "_SUCCESS";
                    failureType = types + "_FAILURE";
                } else {
                    throw new Error("Expected action types to be strings.");
                }

                function actionWith(data) {
                    const finalAction = Object.assign({}, action, data);
                    delete finalAction[CALL_FETCH];
                    return finalAction;
                }

                next(actionWith({ type: requestType }));

                if (batch) {
                    nextActions = batch.nextActions || undefined;
                    for (var unity of batch) {
                        let { url, method } = unity;
                        const { params, headers, mode, dataType, mark } = unity;
                        method = method || "POST";

                        if (typeof url === "function") {
                            url = url(store.getState());
                        }
                        if (typeof url !== "string") {
                            throw new Error("Specify a string endpoint URL.");
                        }
                        batchArr.push(
                            callFetch(
                                url,
                                method,
                                params,
                                headers,
                                mode,
                                dataType,
                                mark
                            )
                        );
                    }
                    return Promise.all(batchArr).then(
                        response => {
                            if (nextActions)
                                fireNextAction(nextActions, dispatch, response);
                            if (!isArray(response)) response = [];

                            next(
                                actionWith({
                                    response,
                                    type: successType,
                                    batch: batch,
                                    payload: "Injection"
                                })
                            );
                        },
                        error => {
                            if (error.response) {
                                var errorData = error.response;
                                for (let key in error.json) {
                                    errorData[key] = error.json[key];
                                }
                            } else {
                                var errorData = error;
                            }
                            next(
                                actionWith({
                                    type: failureType,
                                    error: errorData,
                                    payload: "Injection"
                                })
                            );
                        }
                    );
                } else {
                    nextActions = callFETCH.nextActions || undefined;
                    const {
                        url,
                        params,
                        method,
                        headers,
                        mode,
                        dataType,
                        mark
                    } = callFETCH;
                    return callFetch(
                        url,
                        method,
                        params,
                        headers,
                        mode,
                        dataType,
                        mark
                    ).then(
                        response => {
                            if (nextActions)
                                fireNextAction(nextActions, dispatch, response);
                            next(
                                actionWith({
                                    response,
                                    type: successType,
                                    url: url,
                                    params: params,
                                    method: method,
                                    mark: mark,
                                    payload: "Injection"
                                })
                            );
                        },
                        error => {
                            if (error.response) {
                                var errorData = error.response;
                                for (var key in error.json) {
                                    errorData[key] = error.json[key];
                                }
                            } else {
                                var errorData = error;
                            }

                            next(
                                actionWith({
                                    type: failureType,
                                    error: errorData,
                                    payload: "Injection"
                                })
                            );

                            return next(
                                actionWith({
                                    type: "PROCESS_HTTP_CODE",
                                    error: errorData
                                })
                            );
                        }
                    );
                }
            };

//执行下一个action,并将数据传递给它
function fireNextAction(nextActions, dispatch, response) {
    if (nextActions && nextActions.length > 0 && dispatch) {
        nextActions.map(function(action, index, arr) {
            action({ data: response });
        });
    }
}
