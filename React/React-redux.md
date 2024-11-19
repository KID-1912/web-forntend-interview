# React redux

## React-Redux,Redux,React

- Redux`： 首先 Redux 是一个应用状态管理 js 库，它本身和 React 是没有关系的，换句话说，Redux 可以应用于其他框架构建的前端应用，甚至也可以应用于 Vue 中。
- `React-Redux`：React-Redux 是连接 React 应用和 Redux 状态管理的桥梁。React-redux 主要专注两件事，一是如何向 React 应用中注入 redux 中的 Store ，二是如何根据 Store 的改变，把消息派发给应用中需要状态的每一个组件。

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/83eaf84d71b04b94b7b7e754a6778cd1~tplv-k3u1fbpfcp-watermark.image)

## redux

**3 个原则**

- 单项数据流
- state 只读，只能通过触发 action 执行 reducer 修改 state
- reducer 是纯函数，不执行任何副作用，返回的值作为新的 state，state 改变会触发 store 中的 subscribe

**发布订阅思想**

改变 store 的方法 dispatch ，以及订阅 store 变化的方法 subscribe 。

**中间件思想**

redux 应用了前端领域为数不多的中间件 `compose`，用于强化 **dispatch**

```jsx
const compose = (...funcs) => {
  return funcs.reduce((f, g) => (x) => f(g(x)));
};
```

### 核心 API

**createStore**

```jsx
const Store = createStore(rootReducer, initialState, middleware);
```

- 参数一 reducers ： redux 的 reducer ，如果有多个那么可以调用 combineReducers 合并。
- 参数二 initialState ：初始化的 state 。
- 参数三 middleware ：如果有中间件，那么存放 redux 中间件。

**combineReducers**

```js
/* 将 number 和 PersonalInfo 两个reducer合并   */
const rootReducer = combineReducers({
  number: numberReducer,
  info: InfoReducer,
});
```

**applyMiddleware**

```js
const middleware = applyMiddleware(logMiddleware);
```

### redux 实践

**编写 reducer**

**注册中间件**

```js
/* 打印中间件 */
/* 第一层在 compose 中被执行 */
function logMiddleware() {
  /* 第二层在reduce中被执行 */
  return (next) => {
    /* 返回增强后的dispatch */
    return (action) => {
      const { type } = action;
      console.log("发生一次action:", type);
      return next(action);
    };
  };
}
```

- 在重点看一下 redux 的中间件的编写方式，本质上应用了函数柯里化。

**生成 Store**

```js
const rootMiddleware = applyMiddleware(logMiddleware);
const rootReducer = combineReducers({
  number: numberReducer,
  info: InfoReducer,
});
/* 合成Store */
const Store = createStore(
  rootReducer,
  { number: 1, info: { name: null } },
  rootMiddleware
);
```

**使用 redux@4.2.1**

```jsx
function Index() {
  const [state, changeState] = useState(Store.getState());
  useEffect(() => {
    /* 订阅state */
    const unSubscribe = Store.subscribe(() => {
      changeState(Store.getState());
    });
    /* 解除订阅 */
    return () => unSubscribe();
  }, []);
  return (
    <div>
      <p>
        {" "}
        {state.info.name
          ? `hello, my name is ${state.info.name}`
          : "what is your name"} ,{state.info.mes
          ? state.info.mes
          : " what do you say? "}{" "}
      </p>
      《React进阶实践指南》 {state.number} 👍 <br />
      <button
        onClick={() => {
          Store.dispatch({ type: "ADD" });
        }}
      >
        点赞
      </button>
      <button
        onClick={() => {
          Store.dispatch({
            type: "SET",
            payload: { name: "alien", mes: "let us learn React!" },
          });
        }}
      >
        修改标题
      </button>
    </div>
  );
}
```

# react-redux

单纯的 redux 无法实现：

- 必须对每一个需要状态的组件都用 subscribe / unSubscribe 来进行订阅
- 必须依赖整个 Store，Store 下部分更新会使所有依赖的组件更新，而不是仅依赖部分属性的组件更新

## React-redux

```jsx
// Store.ts
import { combineReducers, createStore } from "redux";

export interface NumberStoreAction {
  type: "add" | "remove";
  value: number;
}

// **编写 reducer**
function numberProducer(state: number = 0, action: NumberStoreAction) {
  if (action.type === "add") return state + action.value;
  if (action.type === "remove") return state - action.value;
  return state;
}
const rootReducer = combineReducers({ number: numberProducer });
export type RootState = ReturnType<typeof rootReducer>;

// **初始 state**
const initStates = { number: 0 };

// **生成 Store**
export const Store = createStore(rootReducer, initStates);
```

### provider

全局注入 redux 中的 store，使用者需要把 Provider 注册到根部组件中

```tsx
// App.tsx
import { Provider as StoreProvider } from "react-redux";
import { Store } from "@/store/Store.ts";
import NumberPanel from "./NumberPanel.tsx";
import NumberInput from "./NumberInput.tsx";

export default function App(): React.ReactNode {
  return (
    <StoreProvider store={Store}>
      <NumberPanel></NumberPanel>
      <NumberInput></NumberInput>
    </StoreProvider>
  );
}
```

### connect

React-Redux 提供了一个高阶组件 connect，被 connect 包装后组件将获得如下功能：

- 1 能够从 props 中获取改变 state 的方法 Store.dispatch 。
- 2 如果 connect 有第一个参数，那么会将 redux state 中的数据，映射到当前组件的 props 中，子组件可以使用消费。

**用法**：`function connect(mapStateToProps?, mapDispatchToProps?, mergeProps?, options?)`

**mapStateToProps**

组件依赖 redux 的 state，映射到业务组件的 props 中；订阅 store 的改变

```tsx
// NumberPanel.tsx
import { connect } from "react-redux";
import type { RootState } from "@/store/Store.ts";

// 映射
const mapStateToProps = (state: RootState) => ({ number: state.number });
const NumberPanel: React.FC<{ number: number }> = (props) => {
  const { number } = props;
  return <div>{number}</div>;
};

export default connect(mapStateToProps)(NumberPanel);
```

**mapDispatchToProps**

redux 中的 dispatch 方法，映射到业务组件的 props 中

```tsx
import { type NumberStoreAction, Store } from "@/store/Store.ts";
import { type Dispatch } from "redux";
import { connect } from "react-redux";
import { MutableRefObject } from "react";

// 映射
const mapDispatchToProps = (dispatch: Dispatch) => ({
  numberAdd: (value: NumberStoreAction["value"]) =>
    dispatch({ type: "add", value }),
  numberRemove: (value: NumberStoreAction["value"]) =>
    dispatch({ type: "remove", value }),
});

type MapDispatchProps = ReturnType<typeof mapDispatchToProps>;

const NumberInput: React.FC<MapDispatchProps> = (props) => {
  const numberInputEle: MutableRefObject<HTMLInputElement | null> =
    useRef(null);

  const onChangeNumber = (type: NumberStoreAction["type"]) => {
    const value = Number(numberInputEle.current!.value);
    // Store.dispatch({ type, value }); 也可以直接调用Store.dispatch
    type === "add" && props.numberAdd(value);
    type === "remove" && props.numberRemove(value);
  };

  return (
    <>
      <input ref={numberInputEle} type="text" />
      <button type="button" onClick={() => onChangeNumber("add")}>
        增加
      </button>
      <button type="button" onClick={() => onChangeNumber("remove")}>
        减少
      </button>
    </>
  );
};

export default connect(undefined, mapDispatchToProps)(NumberInput);
```

## React-Redux 组件通信
