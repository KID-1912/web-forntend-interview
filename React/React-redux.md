# React redux

## React-Redux,Redux,React

- Redux`： 首先 Redux 是一个应用状态管理js库，它本身和 React 是没有关系的，换句话说，Redux 可以应用于其他框架构建的前端应用，甚至也可以应用于 Vue 中。
  
- `React-Redux`：React-Redux 是连接 React 应用和 Redux 状态管理的桥梁。React-redux 主要专注两件事，一是如何向 React 应用中注入 redux 中的 Store ，二是如何根据 Store 的改变，把消息派发给应用中需要状态的每一个组件。

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/83eaf84d71b04b94b7b7e754a6778cd1~tplv-k3u1fbpfcp-watermark.image)

## redux

**3个原则**

- 单项数据流
- state只读，只能通过触发action执行reducer修改state
- reducer是纯函数，不执行任何副作用，返回的值作为新的 state，state 改变会触发 store 中的 subscribe

**发布订阅思想**

改变 store 的方法 dispatch ，以及订阅 store 变化的方法 subscribe 。

**中间件思想**

redux 应用了前端领域为数不多的中间件 `compose`，用于强化 **dispatch**

```jsx
const compose = (...funcs) => {
  return funcs.reduce((f, g) => (x) => f(g(x)));
}
```

### 核心API

**createStore**

```jsx
const Store = createStore(rootReducer,initialState,middleware)
```

- 参数一 reducers ： redux 的 reducer ，如果有多个那么可以调用 combineReducers 合并。
- 参数二 initialState ：初始化的 state 。
- 参数三 middleware ：如果有中间件，那么存放 redux 中间件。

**combineReducers**

```js
/* 将 number 和 PersonalInfo 两个reducer合并   */
const rootReducer = combineReducers({ number:numberReducer,info:InfoReducer })
```

**applyMiddleware**

```js
const middleware = applyMiddleware(logMiddleware)
```

### redux实践

**编写reducer
**
```js
/* number Reducer */
function numberReducer(state=1,action){
  switch (action.type){
    case 'ADD':
      return state + 1
    case 'DEL':
      return state - 1
    default:
      return state
  } 
}
/* 用户信息reducer */
function InfoReducer(state={},action){
  const { payload = {} } = action
   switch (action.type){
     case 'SET':
       return {
         ...state,
         ...payload
       }
     default:
       return state
   }
}
```

- 编写了两个 reducer ，一个管理变量 number ，一个保存信息 info 。

**注册中间件**

```js
/* 打印中间件 */
/* 第一层在 compose 中被执行 */
function logMiddleware(){
    /* 第二层在reduce中被执行 */ 
    return (next) => {
      /* 返回增强后的dispatch */
      return (action)=>{
        const { type } = action
        console.log('发生一次action:', type )
        return next(action)
      }
    }
}
```

- 在重点看一下 redux 的中间件的编写方式，本质上应用了函数柯里化。

**生成Store**

```js
/* 注册中间件  */
const rootMiddleware = applyMiddleware(logMiddleware)
/* 注册reducer */
const rootReducer = combineReducers({ number:numberReducer,info:InfoReducer  })
/* 合成Store */
const Store = createStore(rootReducer,{ number:1 , info:{ name:null } } ,rootMiddleware) 
```

**使用redux**

```js
function Index(){
  const [ state , changeState  ] = useState(Store.getState())
  useEffect(()=>{
    /* 订阅state */
    const unSubscribe = Store.subscribe(()=>{
         changeState(Store.getState())
     })
    /* 解除订阅 */
     return () => unSubscribe()
  },[])
  return <div > 
      <p>  { state.info.name ? `hello, my name is ${ state.info.name}` : 'what is your name' } ,
       { state.info.mes ? state.info.mes  : ' what do you say? '  } </p>
     《React进阶实践指南》 { state.number } 👍 <br/>
    <button onClick={()=>{ Store.dispatch({ type:'ADD' })  }} >点赞</button>
    <button onClick={()=>{ Store.dispatch({ type:'SET',payload:{ name:'alien' , mes:'let us learn React!'  } }) }} >修改标题</button>
 </div>
}
```