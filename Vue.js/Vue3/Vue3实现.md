# Vue3

## 核心模块

**Compiler编译模块**

- @vue/compiler-sfc 单文件组件

- @vue/compiler-dom 转为浏览器dom

- @vue/compiler-core 核心

**Runtime运行时**

- @vue/runtime-reactivity 响应式
- @vue/runtime-dom patch dom
- @vue/runtime-core vue3核心

## createApp

创建app实例，创建render（组件渲染函数/渲染器）

## app.mount

挂载组件：createNode创建根节点，调用render渲染组件

render渲染组件：调用 patch

### patch

**processComponent** 调用 `mountComponent`

### mountComponent

- createComponentInstance

- setupComponent：调用组件setup，组件render纠正，vue2 options初始化

- setupRenderEffect

### setupRenderEffect

创建更新函数：`const componentUpdateFn = () => {}`

创建更新机制：

```ts
const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
```

手动执行更新组件：

```ts
const update = (instance.update = effect.run.bind(effect))
update() // 手动执行
```

## 响应式核心

**数据劫持/代理**：reactive、new Proxy(target, handler)

**依赖收集**：track、dep.track()、effect.run(effecct) // 首次手动调用update渲染 

**依赖更新**：trigger、dep.notify()

### Reactive

`new Proxy`、`baseHandlers`（get/set）

### Ref

RefImpl实例（依赖收集和派发更新），reactive深层代理对象类型值

## 数据结构

**depsMap**：Map结构，键是target，值是deps即Set结构（避免副作用函数重复）

**proxyMap**：WeakMap结构，键是target，值是Proxy对象（缓存代理）

**targetMap**：WeakMap结构，键是Object，值是object对应key的deps（快速为对象的key收集依赖或派发更新）
