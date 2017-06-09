# Talent UI Helper 是为Talent UI 2.0创建的辅助工具，里面包含 Utils和Middleware两部分

## utils

### combineImmutableReducers
> 如果你计划让你整个应用的State都是immutable的，用这个替换redux的combineReducers

### mapActionCreators
> 如果你在写ActionCreators的时候，想用一个树型结构来代码你组件的结构，并且在传递的时候不用一个一个把方法列出来，可以这样
```javascript
    export const actionCreator = {
        home: {
            switchLang: function(lang){
                return {type: SWITCH, lang}
            },
            header: {
                logout: function(){}
            },
            sidebar: {
                search: function(){}
            },
            content: {
                update: function(){}
            }
        }
    }
```
> 此时你的home组件可以这样组织

```javascript
    import React, {Component} from 'react'
    import {connect} from 'react-redux';
    import {actionCreator} from './redux/actions'
    import mapActionCreators from '@beisen/talent-ui-helper/lib/utils/mapActionCreators';

    import Header, 
    import Sidebar,
    import Content,

    @connect(mapStateToProps, mapActionCreators(actionCreator))
    export default class extends Component {
        render(){
            let {home} = this.props
            let {switchLang, header, sidebar, content} = home;
            return <div>
                <span onClick={switchLang}></span>
                <Header {...header}/>
                <Sidebar {...sidebar}/>
                <Content {...content}/>
            </div>
        }
    }
```

> 在你的header组件中
```javascript

    export (props) => {
        let {logout} = props;
        return <header >
            <a href='javascript:;' onClick={logout}>
                登出
            </a>
        </header>
    }
```

### warning
> 和console.log()差不多，代码很简单，详情自己看


## middlware 这是从Talent UI 1.0中迁移过来的中间件，是慧娟开发的，详情请咨询她

### AnalysisAfterMiddleware 
> [path: lib/middleware/analysisAfter.js] 
### AnalysisBeforeMiddleware 
> [path: lib/middleware/analysisBefore.js]
### FetchMiddleware
> [path: lib/middleware/fetch.js]

