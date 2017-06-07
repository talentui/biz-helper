import forEach from 'lodash.foreach';

const mapActionCreators= (acObject) => (dispatch) => {
        // make a copy of the tree ,in case of monipulate
        let result = {};
        const looper = function (obj, result) {
            forEach(obj, function (val, key) {
                if (typeof (val) === 'object') {
                    result[key] = {};
                    looper(val, result[key]);
                }
                if (typeof (val) === 'function') result[key] = function () {
                   return dispatch(val.apply(undefined,arguments))
                }
            })
        };
        looper(acObject, result);
        return result;
}

export default mapActionCreators;