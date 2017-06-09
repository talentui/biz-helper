import { Map } from "immutable";
import warning from "./warning";
// const testActionType = '@beisen##2017$$END'

export default function combineImmutableReducer(reducers) {
    let thisInitState = Map();
    const keys = Object.keys(reducers);
    const reducerMap = {};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const thisReducer = reducers[key];
        if (typeof thisReducer === "function") {
            reducerMap[key] = thisReducer;
            // thisInitState = thisInitState.set(key,thisReducer(undefined,{type: testActionType}))
        } else {
            warning("在CombineReducer的时候找不到对应的reducer方法:" + key);
        }
    }

    const reducerKeys = Object.keys(reducerMap);

    return function(state = thisInitState, action) {
        const { _root } = action;
        // 如果action中设置了_root测只调用对应的_节点的reducer,调试的时候省事
        if (_root && reducerKeys.indexOf(_root) != -1) {
            let reducer = reducerMap[_root];
            return state.set(_root, reducer(state.get(_root), action));
        }

        for (let i = 0; i < reducerKeys.length; i++) {
            let key = reducerKeys[i];
            let reducer = reducerMap[key];
            let prevState = state.get(key);
            let nextState = reducer(prevState, action);
            if(typeof nextState === 'undefined') {
                warning('State中的' + key + ': 为空' )
            }
            if (prevState !== nextState) state = state.set(key, nextState);
        }
        return state;
    };
}
