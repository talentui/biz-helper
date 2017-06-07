/**
 * Created by liubo on 15/8/31.
 */
import {polyfill} from 'es6-promise';
import 'isomorphic-fetch';
var URLSearchParams = require('url-search-params');

//const API_ROOT = '/';

//序列化url
function serialize(obj){
    var result = [];
    for (var k in obj) {
        result.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
    }
    return result.join('&')
}
//判断是否数组
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
//ajax接口
function callFetch(url, schema, method, params, headers, dataType) {
    var fullUrl = url;
    var data = {};
    var defaultHeaders = {
        'Accept': 'application/json, application/xml, text/play, text/html, *.*',
        'Content-Type': 'application/json; charset=utf-8'
    }
    if (method.toUpperCase() == "GET" && params) {
        fullUrl = fullUrl + "?" + serialize(params);
    } else if (headers && headers['Content-Type'] == 'application/x-www-form-urlencoded') {
        let urlSear = new URLSearchParams();
        for(var i in params){
            urlSear.append(i,params[i])
        }
        data.body = urlSear.toString()
        data.method = method;
    } else {
        data.body = JSON.stringify(params);
        data.method = method;
    }

    var newHeaders ;
    if (window.customHeaders && typeof window.customHeaders == 'function') {
        newHeaders = Object.assign({},defaultHeaders,window.customHeaders())
    } else {
        newHeaders = Object.assign({},defaultHeaders,headers)
    }
    data.headers = newHeaders

    data.credentials = 'include'; //传递cookie信息
    return fetch(fullUrl, data).then(response =>{
      if(!response.ok) { 
        response.json = function() {
          return this.text().then(function(data){
            try {
                return JSON.parse(data);
            } catch(e) {
                return Promise.reject(response);
            }
          })
        }
      }
            
      return (
        response.json().then(json => ({ json, response })))
        }).then(({ json, response }) => {

          if (!response.ok) {
            return Promise.reject({json, response});
          }
          if (isArray(json)) {
            return json.slice();
          } else {
            return Object.assign({},json);
          }
    });
}

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_FETCH = Symbol('Call API');

// A Redux middleware that interprets actions with CALL_FETCH info specified.
// Performs the call and promises when such actions are dispatched.
export default store => next => action => {
    /*  通过 之前定义的action 赋值*/
    const callFETCH = action[CALL_FETCH];

    if (typeof callFETCH === 'undefined') {
        return next(action);
    }
    /*拿到url*/
    let { url, params, method } = callFETCH;
    const { schema, types } = callFETCH;

    method = method || "POST";

    const nextActions = callFETCH.nextActions || undefined;
    const headers = callFETCH.headers || undefined;
    const dataType = callFETCH.dataType || undefined;
    const dispatch = store.dispatch;

    if (typeof url === 'function') {
        url = url(store.getState());
    }

    if (typeof url !== 'string') {
        throw new Error('Specify a string endpoint URL.');
    }
    //if (!schema) {
    //    throw new Error('Specify one of the exported Schemas.');
    //}
    if (!Array.isArray(types) || types.length !== 3) {
        throw new Error('Expected an array of three action types.');
    }
    if (!types.every(type => typeof type === 'string')) {
        throw new Error('Expected action types to be strings.');
    }

    function actionWith(data) {
        const finalAction = Object.assign({}, action, data);
        delete finalAction[CALL_FETCH];
        return finalAction;
    }

    const [requestType, successType, failureType] = types;
    next(actionWith({ type: requestType }));

    return callFetch(url, schema, method, params, headers, dataType).then(
            response => {
                if(nextActions) fireNextAction(nextActions, dispatch, response);
                next(actionWith({
                    response,
                    type: successType,
                    url:url,
                    params:params,
                    method:method,
                    payload:'Injection'
                }))
            },
            error => {
              if (error.response) {
                var errorData = error.response;
                for (var key in error.json) {
                  errorData[key] = error.json[key]
                }
              } else {
                var errorData = error;
              }

              next(actionWith({
                  type: failureType,
                  error: errorData,
                  payload:'Injection'
              }));
                 
              return next(actionWith({
                  type: "PROCESS_HTTP_CODE",
                  error: errorData
               }));
            }
    );
};
//执行下一个action,并将数据传递给它
function fireNextAction(nextActions, dispatch, response){
    if (nextActions && nextActions.length > 0 && dispatch) {
        nextActions.map(function(action, index, arr){
            action({data: response});
        })

    }
}