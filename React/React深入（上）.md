# React特性

- 致力于创建交互式（状态）UI：data 传入 React，形成UI

- 一切皆组件：react-router

- Node服务端渲染，React Native

# React版本

- react v16.0：Fiber架构（一次更新遍历大量虚拟DOM优化）

- react v16.3：context API（consumer/provider）

- react v16.5：memo、React.lazy

- react v16.8：React Hooks

- react v17：事件绑定由 document 变成 container ，移除事件池等

# 认识jsx

**转为js代码**

jsx 代码转为 React.element的js调用，调用后得到fiber对象

**react element：Fiber**

tag(fiber对象类型)、type(元素类型)、props、key

每个fiber tag 有不同type，且记录之间 `return`、`child`、`sibling` 关系

**控制render**

扁平化处理children

移除文本节点

插入新的react element

克隆容器节点，并修改children属性为最新值

# Component(组件)

**组件**：通过react方法（useState），承载了渲染视图UI和更新视图的类或函数（UI + update + Class/Function）；

React 调和渲染 fiber 节点的时候，如果发现 fiber tag 是 ClassComponent = 1，则按照类组件逻辑处理，如果是 FunctionComponent = 0 则按照函数组件逻辑处理。当然 React 也提供了一些内置的组件，比如说 Suspense 、Profiler 等。

**class类组件**

**函数式组件**

函数组件和类组件本质的区别：

对于类组件来说，底层只需要实例化一次，实例中保存了组件的 state 等状态。对于每一次更新只需要调用 render 方法以及对应的生命周期就可以了。

但是在函数组件中，每一次更新都是一次新的函数执行，一次函数组件的更新，里面的变量会重新声明。

为了能让函数组件可以保存一些状态，执行一些副作用钩子，React Hooks 应运而生，它可以帮助记录 React 中组件的状态，处理一些额外的副作用。

## 组件通信方式

- props callback

- ref

- React redux mobx 

- context

- event bus 事件总线

## 组件增强

- 类组件继承

- 函数式组件自定义hook

- HOC高阶组件

# state

React的UI改变来源于 state 改变；

## 类组件的state

setState：`setState(obj,callback)`

```js
/* 第一个参数为function类型 */
this.setState((state,props)=>{
    return { number:1 }
})
/* 第一个参数为object类型 */
this.setState({ number:1 },()=>{
    console.log(this.state.number) //获取最新的number
})
```

this.setState 发生了什么？

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5d5e25a4ed464547bdd0e7c3a44d0ccc~tplv-k3u1fbpfcp-watermark.image)

render 阶段 render 函数执行 -> commit 阶段真实 DOM 替换 -> setState 回调函数执行 callback 。

**类组件如何限制 state 更新视图**

对于类组件如何限制 state 带来的更新作用的呢？

- ① pureComponent 可以对 state 和 props 进行浅比较，如果没有发生变化，那么组件不更新。
- ② shouldComponentUpdate 生命周期可以通过判断前后 state 变化来决定组件需不需要更新，需要更新返回true，否则返回false。

## setState原理

类组件初始化过程中绑定了负责更新的`Updater`对象，对于如果调用 setState 方法，实际上是 React 底层调用 Updater 对象上的 enqueueSetState 方法。

```js
enqueueSetState(){
  /* 每一次调用`setState`，react 都会创建一个 update 里面保存了 */
  const update = createUpdate(expirationTime, suspenseConfig);
  /* callback 可以理解为 setState 回调函数，第二个参数 */
  callback && (update.callback = callback) 
  /* enqueueUpdate 把当前的update 传入当前fiber，待更新队列中 */
  enqueueUpdate(fiber, update); 
  /* 开始调度更新 */
  scheduleUpdateOnFiber(fiber, expirationTime);
}
```

正常 **state 更新**、**UI 交互**，都离不开用户的事件，比如点击事件，表单输入等，
React 是采用事件合成的形式，每一个事件都是**由 React 事件系统统一调度的**，那么 State 批量更新正是和事件系统息息相关的。

**批量更新（batchedEventUpdates）**

执行上下文 -> 合并state -> render -> callback

**异步更新**

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/48e730fc687c4ce087e5c0eab2832273~tplv-k3u1fbpfcp-watermark.image)

如何异步批量更新：ReactDOM.unstable_batchedUpdates

**优先级更新**

ReactDOM.flushSync

## 函数组件的state

useState `[ state, dispatch ] = useState(initData)`

为什么对象数组类型值更新需要包一层后传值？

在dispatch修改状态时会对值浅比对，相同则不会启动更新；

类组件setState和函数式组件useState异同：

底层都调用了scheduleUpdateOnFiber（更新队列到Fiber）,事件驱动更新下都是批量更新

函数式组件会浅比对，类组件不会（PureComponent除外）

类组件setState支持更新回调，函数式组件仅通过useEffect

类组件setState对旧值合并处理，useState重新赋值

# props

react props可以是这些值：

- 父组件渲染数据源
- 回调函数callback
- 组件 Component
- 渲染函数 render: () => jsx
- render props(children)
- render component(children)

props在react扮演的角色：

组件层级中传递数据/视图容器供子组件消费，向父组件传递信息

更新机制中props变化是组件更新的重要准则，因此产生PureComponent,memo优化

插槽中props自动转Children属性

**监听props改变**

函数式组件：

```js
React.useEffect(()=>{
    // props 中number 改变，执行这个副作用。
    console.log('props改变：' ，props.number  )
},[ props.number ])
```

## props.children模式

- props的插槽组件

props.children为Fiber对象

- props的render函数

```jsx
<Container>
   { (ContainerProps)=> <Children {...ContainerProps}  /> }
</Container>
```

```jsx
function  Container(props) {
  const  ContainerProps = {
      name: 'alien',
      mes:'let us learn react'
  }
  return  props.children(ContainerProps)
}
```

- 混合以上2种

props.children返回数组类型值

```jsx
function  Container(props) {
  const ContainerProps = {
    name: 'alien',
    mes:'let us learn react'
  }
  return props.children.map(item=>{
    if(React.isValidElement(item)){ // 判断是 react elment  混入 props
      return React.cloneElement(item,{ ...ContainerProps },item.props.children)
    }else if(typeof item === 'function'){
      return item(ContainerProps)
    }else return null
  })
}
```

## props技巧

**抽象props**

不需要指定props属性，实现props的传入或抽离 

混入传入：

```jsx
function Son(props){
    console.log(props)
    return <div> hello,world </div>
}
function Father(props){
    const fatherProps={
        mes:'let us learn React !'
    }
    return <Son {...props} { ...fatherProps }  />
}
function Index(){
    const indexProps = {
        name:'alien',
        age:'28',
    }
    return <Father { ...indexProps }  />
}
```

抽离：

```jsx
function Son(props){
  console.log(props)
  return <div> hello,world </div>
}
function Father(props){
  const { age, ...fatherProps  } = props
  return <Son  { ...fatherProps }  />
}
function Index(){
  const indexProps = {
    name:'alien',
    age:'28',
    mes:'let us learn React !'
  }
  return <Father { ...indexProps }  />
}
```

**注入props**

显示注入：能够直观看见标签中绑定的 props

```jsx
function Son(props){
    console.log(props) // {name: "alien", age: "28"}
    return <div> hello,world </div>
}
function Father(prop){
    return prop.children // 返回component children
}
function Index(){
    return <Father>
        <Son  name="alien"  age="28"  />
    </Father>
}
```

**隐式注入**

通过 `React.cloneElement` 对 props.children 克隆再混入新的 props

```jsx
function Son(props){
  console.log(props) // {name: "alien", age: "28", mes: "let us learn React !"}
  return <div> hello,world </div>
}
function Father(prop){
  return React.cloneElement(prop.children, {  mes:'let us learn React !' })
}
function Index(){
  return <Father>
      <Son  name="alien"  age="28"  />
  </Father>
}
```

## 编写一个`<Form> <FormItem>`嵌套组件

ref引用

隐式注入（React.cloneElement）

函数式组件绑定自定义属性（FC.MyAttr = 'value'）

# 生命周期

## 类组件生命周期

## 函数组件生命周期

**useEffect**

```js
useEffect(()=>{
    return destory
},dep)
```

useEffect 第一个参数 callback, 返回的 destory ， destory 作为下一次callback执行之前调用，用于清除上一次 callback 产生的副作用。

第二个参数作为依赖项，是一个数组，可以有多个依赖项，依赖项改变，执行上一次callback 返回的 destory ，和执行新的 effect 第一个参数 callback 。

对于 useEffect 执行， React 处理逻辑是采用异步调用 ，对于每一个 effect 的 callback， React 会向 `setTimeout`回调函数一样，放入任务队列，等到主线程任务完成，DOM 更新，js 执行完成，视图绘制完毕才执行。所以 effect 回调函数不会阻塞浏览器绘制视图。

**useLayoutEffect:**

useLayoutEffect 和 useEffect 不同的地方是采用了同步执行，那么和useEffect有什么区别呢？

- 首先 useLayoutEffect 是在 DOM 更新之后，浏览器绘制之前，这样可以方便修改 DOM，获取 DOM 信息，这样浏览器只会绘制一次，如果修改 DOM 布局放在 useEffect ，那 useEffect 执行是在浏览器绘制视图之后，接下来又改 DOM ，就可能会导致浏览器再次回流和重绘。而且由于两次绘制，视图上可能会造成闪现突兀的效果。

- useLayoutEffect callback 中代码执行会阻塞浏览器绘制。

**一句话概括如何选择 useEffect 和 useLayoutEffect ：修改 DOM ，改变布局就用 useLayoutEffect ，其他情况就用 useEffect 。

**函数组件生命周期替代方案**

componentDidMount

```js
React.useEffect(()=>{
  /* 请求数据 ， 事件监听 ， 操纵dom */
},[])  /* 切记 dep = [] */
```

componentWillUnmount

```js
React.useEffect(()=>{
  /* 请求数据 ， 事件监听 ， 操纵dom ， 增加定时器，延时器 */
  return function componentWillUnmount(){
      /* 解除事件监听器 ，清除定时器，延时器 */
  }
},[])/* 切记 dep = [] */
```

componentWillReceiveProps

```js
React.useEffect(()=>{
  console.log('props变化：componentWillReceiveProps')
},[ props ])
```

```js
React.useEffect(()=>{
  console.log('props中number变化：componentWillReceiveProps')
},[ props.number ]) /* 当前仅当 props中number变化，执行当前effect钩子 */
```

componentDidUpdate

```js
React.useEffect(()=>{
  console.log('组件更新完成：componentDidUpdate ')     
}) /* 没有 dep 依赖项 */
```

# ref

## ref对象创建

**React.createRef(类组件)**

**useRef(函数式组件)**

```jsx
  const currentDom = React.useRef(null)
  React.useEffect(()=>{
    console.log( currentDom.current )
  },[])
  return  <div ref={ currentDom } ></div>
```

useRef创建的ref对象绑定在对应fiber对象上（不随着执行组件更新变化）

## forwardRef(转发ref)

forwardRef 的初衷就是解决 ref 不能跨层级捕获和传递的问题。

**跨层级获取**

通过 forwardRef 声明父组件ref类型并**获取到前一个引用**后向后传递

```jsx
import type { LegacyRef } from "react";

// 使用 forwardRef 转发 ref 给 div 元素
const Item = forwardRef<HTMLDivElement>((props, ref) => {
  return <div ref={ref}>Item</div>;
});

const ScrollView = (props: { itemNodeRef: LegacyRef<HTMLDivElement> }) => {
  return <Item ref={props.itemNodeRef} />;
};

export default function App() {
  const itemNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("xxx", itemNodeRef.current); // 访问到 <div> 元素
  }, []);

  return <ScrollView itemNodeRef={itemNodeRef} />;
}
```

**合并转发ref**

```jsx
import React, { forwardRef, useRef, useImperativeHandle, useEffect } from "react";

// 定义 Index 组件的 ref 类型
interface IndexRef {
  form: {
    submit: () => void;
  };
  button: HTMLButtonElement | null;
  customMethod: () => void;
}

// 表单组件
const Form = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    submit() {
      console.log("Form submitted!");
    },
  }));
  return <div>Form Component</div>;
});

// 子组件
const Index = forwardRef<IndexRef>((props, ref) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<{ submit: () => void } | null>(null);

  // 合并多个子项
  useImperativeHandle(ref, () => ({
    form: formRef.current!,
    button: buttonRef.current,
    customMethod: () => console.log("Custom method from Index!"),
  }));

  return (
    <div>
      <button ref={buttonRef}>点击</button>
      <Form ref={formRef} />
    </div>
  );
});

// 父组件
const App = () => {
  const ref = useRef<IndexRef>(null);

  useEffect(() => {
    console.log(ref.current); // { form: ..., button: ..., customMethod: ... }
    ref.current!.customMethod(); // 调用子组件的方法
    ref.current!.form.submit(); // 调用孙组件的方法
  }, []);

  return <Index ref={ref} />;
};

export default App;
```

useImperativeHandle：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/59238390306849e89069e6a4bb6ded9d~tplv-k3u1fbpfcp-watermark.image)

**高阶组件转发**

## ref组件通信

对于**数据层托管**的组件（如<Form>仅暴露接口，组内部state单独管理数据），
依赖 ref 模式标记子组件实例，从而操纵子组件方法

如上【合并转发ref】

## 函数组件缓存数据

使用ref存储组件数据，存储的数据不需要视图更新

```jsx
const toLearn = [ { type: 1 , mes:'let us learn React' } , { type:2,mes:'let us learn Vue3.0' }  ]
export default function Index({ id }){
    const typeInfo = React.useRef(toLearn[0])
    const changeType = (info)=>{
        typeInfo.current = info /* typeInfo 的改变，不需要视图变化 */
    }
    useEffect(()=>{
       if(typeInfo.current.type===1){
           /* ... */
       }
    },[ id ]) /* 无须将 typeInfo 添加依赖项, 也能获取到正确 typeInfo 值 */
    return <div>
        {
            toLearn.map(item=> <button key={item.type}  onClick={ changeType.bind(null,item) } >{ item.mes }</button> )
        }
    </div>
}
```

# context

上下层模式

**createContext**

```jsx
const ThemeContext = React.createContext(null) // 初始context内容
const ThemeProvider = ThemeContext.Provider  //提供者
const ThemeConsumer = ThemeContext.Consumer // 订阅消费者
```

**Provide 提供者**

```jsx
const ThemeProvider = ThemeContext.Provider  //提供者
export default function ProviderDemo(){
  const [ contextValue , setContextValue ] = React.useState({  color:'#ccc', background:'pink' })
  return <div>
      <ThemeProvider value={ contextValue } > 
          <Son />
      </ThemeProvider>
  </div>
}
```

provider 作用有两个：

- value 属性传递 context，供给 Consumer 使用。
- value 属性改变，ThemeProvider 会让消费 Provider value 的组件重新渲染。

**消费者**

contextType（类组件）：类组件静态属性，用来获取上面 Provider 提供的 value

useContext（函数式组）：返回Provider 提供的 value

consumer（订阅者消费）：采取 render props 方式，将provider 中value作为 render props 函数的参数，可以将参数取出来，作为 props 混入 `ConsumerDemo` 组件，说白了就是 context 变成了 props。

```jsx
<ThemeConsumer>
  { /* 将 context 内容转化成 props  */ }
  { (contextValue)=> <ConsumerDemo  {...contextValue}  /> }
</ThemeConsumer>
```

**动态context**

Provider 模式下 context 有一个显著的特点，就是 **Provider 的 value 改变，会使所有消费 value 的组件重新渲染**；
组件会自发的render

**如何阻止 Provider value 改变造成的 children （ demo 中的 Son ）不必要的渲染？**（如son以及他的子组件）

- 利用 memo，pureComponent 对子组件 props 进行浅比较处理
  
  ```jsx
  const Son = React.memo(()=> <ConsumerDemo />) 
  
  <ThemeProvider value={ contextValue } >
    <Son /> // 避免更新
  </ThemeProvider>
  ```

- React 本身对 React element 对象的缓存
  
  ```jsx
  <ThemeProvider value={ contextValue } >
    { React.useMemo(()=>  <Son /> ,[]) }
  </ThemeProvider>
  ```

## 相关API

**displayName**

自定义React Devtools中 Context名称

```jsx
const ThemeContext = React.createContext(/* 初始化内容 */);
ThemeContext.displayName = 'ThemeContext';
```

context 与 props 和 react-redux 的对比？

**答**： context解决了：

- 解决了 props 需要每一层都手动添加 props 的缺陷。

- 解决了改变 value ，组件全部重新渲染的缺陷。

react-redux 就是通过 Provider 模式把 redux 中的 store 注入到组件中的。

## context高阶用法

**嵌套Provider**

**逐层传递Provider**
