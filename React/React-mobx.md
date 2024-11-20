# React-mobx

不同于 redux 的 Flux(单项数据流) 架构，Mobx 采用观察者数据模式；
Mobx 每一模块对应一个 store，redux 全局一个 store。
Mobx 天生支持异步，redux 需要中间件支持。

在 React 应用中更好的使用 Mobx ，出现了 mobx-react 并提供了 HOC ，可以获取状态管理 Mobx 的数据层，也能接受 mobx 数据改变带来的更新。

## Mobx 特性

观察者模式(Observer)：每个属性对应观察者，依赖收集（劫持 render 函数/派发更新）

状态提升：状态真实存在于外部 mobx 的模块 model，通过 props 传递给组件，或者通过 mobx-react 的 Provider 注入

装饰器模式：便捷地获取状态/监听状态，mobx 很多接口都支持装饰器模式写法（Mobx6 已弃用装饰器语法）

精确颗粒化收集：每一个属性都会有 ObserverValue，组件的更新精确到属性级别

引用类型处理：Proxy 属性代理、子代属性管理

## Mobx/react-Mobx 使用

每一个 class 称之为一个模块，mobx 的 api 基本用于构建每一个响应式模块。

**安装**

```
npm i Mobx Mobx-react --save
```

或者安装 `Mobx-react-lite` （只支持函数组件）

### 创建 Store

**makeObservable**：将类的指定属性/方法变成响应式

**makeAutoObservable**：自动将类所有属性/方法变成响应式

```jsx
import { action, makeObservable, observable } from "Mobx";
class Counter {
  count = 0; // observableValue
  constructor() {
    // makeAutoObservable
    // 参数1：target，把谁变成响应式（可观察）
    // 参数2：指定哪些属性或方法变成可观察
    // makeObservable(this, {
    //   count: observable,
    //   increment: action,
    //   decrement: action,
    //   reset: action,
    // });

    // makeAutoObservable
    // 参数1：target，把谁变成响应式（可观察）
    // 参数2：排除响应式的属性或方法
    // 利用 autoBind 指定自动绑定 this，保证action永远指向当前实例
    makeAutoObservable(this, {}, { autoBind: true });
    // makePersistable()...等其他插件配置
  }
  // 计算属性 Computed
  get double() {
    return this.count * 2;
  }
  // action
  increment() {
    this.count++;
  }
  decrement() {
    this.count--;
  }
  reset() {
    this.count = 0;
  }
}
const counter = new Counter();
export default counter;
```

### 响应式组件

**observer**：Mobx-react 提供的 HOC 组件函数

```jsx
// App.tsx
import counter from "./store/Counter";
// observer 是一个高阶组件函数，需要包裹一个组件，这样组件才会更新
import { observer } from "Mobx-react";

function App() {
  const { cart, counter } = useStore();
  return (
    <div className="App">
      <h3>计数器案例</h3>
      <div>点击次数：{counter.count}</div>
      <button onClick={() => counter.increment()}>加1</button>
      <button onClick={() => counter.decrement()}>减1</button>
      <button onClick={() => counter.reset()}>重置</button>
    </div>
  );
}
export default observer(App);
```

### root 模块

```js
// store/index.ts
import { useContext, createContext } from "react";
import cart from "./Cart";
import counter from "./Counter";

const Context = createContext(new RootStore());

export default function useStore() {
  return useContext(Context);
}

// 使用
import { useStore } from "./store";
const Comp = (props) => {
  const { cart, counter } = useStore();
};
```

### 其它

**监听属性**

autorun：类似 Vue 中 watchEffect

reaction： 类似 Vue 中 watch

**异步 action**

Mobx 异步调用 action 直接调用即可，但是默认
