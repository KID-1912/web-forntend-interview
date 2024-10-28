# 概要

## 阅读源码

**目录**

**vue@2.6**

```
src
├── compiler        # 编译相关
├── core            # 核心代码
├── platforms       # 不同平台的支持
├── server          # 服务端渲染
├── sfc             # .vue 文件解析
├── shared          # 共享代码
```

**入口文件**

在web应用下，分析 Runtime + Compiler 构建出来的Vue.js，它的入口是 `src/platforms/web/entry-runtime-with-compiler.js`

**Vue类定义**

经过了 `src/platforms/web/runtime/index.js`，最终Vue类直接定义在 `src/core/instance/index.js`，并拓展原型

**全局Vue静态方法**

在 `src/core/global-api/index.js`  导出的 **initGlobalAPI** 方法对 Vue 上扩展的一些全局方法的定义

## 数据驱动

Vue实现了采用模板语法来声明式的将数据渲染为 DOM，模板和数据如何渲染成最终的 DOM

### 初始化实例

`core/instance/index.js` Vue类内部就一行调用初始化代码： 

```js
this._init(options) // 入参 options选项
```

即 `Vue.prototype._init` 方法处理包括：

- **initLifecycle**：初始化声明周期

- **initEvents(vm)**： 初始化事件

- **initRender(vm)**： 初始化渲染

- **callHook(vm, 'beforeCreate')**：beforeCreate 钩子

- **initInjections(vm)**：resolve injections

- **initState(vm)**： 初始化状态，包括props methods data computed watch

- **initProvide(vm)**：resolve provide

- **callHook(vm, 'created')**：create 钩子

- **vm.$mount(vm.options.el)**：自动/手动实例挂载

### 实例挂载

`$mount` 调用生命周期模块的 `mountComponent` 方法，内部处理包括：

- **callHook(vm, 'beforeMount')** beforeMount钩子

- **updateComponent**：组件更新方法 ，`vm._render` 方法生成虚拟 Node，然后调用` vm._update` 更新 DOM

- **new Watcher()**：创建渲染 Watcher，传入**updateComponent**，执行一次组件更新并监测数据变化

- **callHook(vm, 'mounted')** mounted钩子

### render

render方法负责将实例渲染成一个虚拟 Node，内部传递 vm.$createElement 给vm的渲染函数（可以使options上定义的render选项）并调用；

**渲染函数**：描述 DOM 节点的层级结构及其数据，如render选项只需定义DOM与数据描述；

**`createElement`**：将渲染函数的这些结构描述转换为具体的 vnode 实例。封装了 vnode 创建的细节：如静态节点优化、特定指令解析、跨平台支持（SSR，Weex）等。

### update

update 方法负责根据组件最新vnode更新视图（DOM），其内部基于核心方法 `patch`；

patch 方法内部调用createElm创建DOM元素，整个过程就是先子后父递归创建了一个完整的 DOM 树并插入到 parentElm上。

## 组件化

组件是资源独立的，组件在系统内部可复用，组件和组件之间可以嵌套；

### createComponent

render 方法中，createElement 判断到非合法标签情况，调用 `createComponent` 方法（构造子类构造函数）创建一个组件 VNode；

patch 方法中，createElm 判断到 `vnode` 是一个组件 VNode，初始化实例并挂载（init + mount）；在 mount 的 render 中，遇到子组件，则继续 createComponent；

### 生命周期

生命周期的函数都是调用 `callHook` 方法；

**beforeCreate & created**：初始化实例内

**beforeMount & mounted**：mountComponent 挂载处理内，组件的mounted则在patch的vnode的insert钩子上；

**beforeUpdate & updated**：watcher队列中watcher update后；

### 组件注册

**全局注册**

`Vue.component("my-component", options)`

内部通过 `Vue.extend` 把这个对象转换成一个继承于 Vue 的构造函数，并添加到`Vue.options.components` 上

**局部注册**

Vue 的实例化阶段合并 `options` 的逻辑，把 `components` 合并到 `vm.$options.components` 上，createElement 时候 `resolveAsset` 中拿到组件的构造函数；

**异步组件**

注册的组件不再是一个对象，而是一个工厂函数；

## 响应式原理

如何实现 **对数据修改作出响应** 的原理

### 响应式对象

比如定义组件的props、data，构造为响应式对象；

- **initProps**

- **initMethods**

- **initData**

- **initComputed**

- **initWatch**

**observe** 方法实现监测一个数据的变化，为其创建一个Observer实例，在这个过程中为对象每个属性添加 getter 和 setter，用于依赖收集和派发更新：

**defineReactive** 方法核心就是利用 `Object.defineProperty` 给数据添加了 getter 和 setter，访问/修改数据时能自动执行一些逻辑：getter 做的事情是依赖收集，setter 做的事情是派发更新；

### 依赖收集

**Dep**

依赖收集的核心，每个响应式对象的属性都对应一个Dep实例，即依赖管理器，存放watcher依赖；它的关键方法是 `depend` 和 `notify`；

**Watcher**

`new Watcher()` 渲染watcher时，render方法生成 VNode 会访问vue实例上的数据；触发响应式对象的getter，将watcher添加到各个Dep中，完成依赖收集；它的核心是通过 update 方法的执行获取需要监听的值；

### 派发更新

响应式对象的值被修改，触发setter，调用 `dep.notify()` 通知所有的订阅者调用Watcher.update 方法

**异步更新队列**

vue不会每次数据改变立即触发 `watcher` 的回调，而是把这些 `watcher` 先添加到一个队列里，然后在 `nextTick` 后执行；

**nextTick**

与 JS运行机制相关，目的是在下一次主线程执行完成时，添加处理；

原理：`nextTick ` 默认优先使用微任务（`Promise.then`、`MutationObserver`、`setImmediate`、`setTimeout`）；微任务的优先级较高，这可以确保在大多数情况下，`nextTick` 的回调能够尽早执行。

`nextTick` 维护了自己的 callbacks 数组，对外暴露 `nextTick` 函数，调用时压入，然后判断状态，一次性执行所有处理；

### 检测变化

**新增对象属性**

 `Object.defineProperty` 实现响应式对象，给这个对象添加一个新属性是不能够触发它的 setter（因为未对属性执行 Object.defineProperty）；

Vue.set：内部通过 `defineReactive(ob.value, key, val)` 把新添加的属性变成响应式对象，然后再通过 `ob.dep.notify()` 手动的触发依赖通知；

**修改数组项**

Vue 也是不能检测到以下变动的数组：

1.当你利用索引直接设置一个项时，例如：`vm.items[indexOfItem] = newValue`

2.当你直接修改数组的长度时，例如：`vm.items.length = newLength`

对于第一种情况，可以使用：`Vue.set(example1.items, indexOfItem, newValue)`；而对于第二种情况，可以使用 `vm.items.splice(newLength)`。

为什么splice能实现？

因为Vue对数组中所有能改变数组自身的方法，如 `push、pop` 等这些方法进行重写。

重写后方法除了执行它们本身逻辑，并对能增加数组长度的 3 个方法 `push、unshift、splice` 方法做了判断，获取到插入的值把新添加的值变成一个响应式对象，并且再调用 `ob.dep.notify()` 手动触发依赖通知，

## 组件更新

vnode 组件数据发生变化，更新组件的过程；

patch 方法 `sameVNode(oldVnode, vnode)` 判断它们是否是相同的 VNode

### 新旧节点不同

创建新节点、更新父的占位符节点、删除旧节点

### 新旧节点相同

调用 `patchVNode`，把新的 `vnode` `patch` 到旧的 `vnode` 上，复用并最小化修改；

其中判断 vnode.children 子节点是否相同，新旧子节点存在且不同，调用 `updateChildren`，开始比对，目的是 **最小化 DOM 变化**；

**diff算法**

通过同层的树节点进行比较而非对树进行逐层搜索遍历的方式；

oldStartIdx、newStartIdx、oldEndIdx、newEndIdx

oldStartVnode、newStartVnode、oldEndVnode、newEndVnode

`oldStartIdx`、`newStartIdx`、`oldEndIdx` 以及 `newEndIdx` 移动都会伴随着 `oldStartVnode`、`newStartVnode`、`oldEndVnode` 以及 `newEndVnode` 的指向的变化，向中间靠拢；

 `oldStartIdx`、`newStartIdx`、`oldEndIdx` 以及 `newEndIdx` 两两比对的过程，一共会出现 2*2=4 种情况，相等则patchNode；

都不相等，则寻找旧节点列表中相同的key，符合sameVnode则移动纠结点，不符合即无法服用，创建新节点插入并向后移动；

最后 `while` 循环结束完成靠拢：如果 `oldStartIdx > oldEndIdx` ，说明老节点比对完了，但是新节点还有多的，需要将新节点插入到真实 DOM 中去，调用 `addVnodes` 将这些节点插入即可。

同理，如果满足 `newStartIdx > newEndIdx` 条件，说明新节点比对完了，老节点还有多，将这些无用的老节点通过 `removeVnodes` 批量删除即可。

## computed

拿到计算属性定义的 `getter` 并为其创建一个 `computed watcher`；同样能够依赖收集和派发更新；

核心：惰性求值

**依赖收集**

`new Watcher` 依赖收集时不会立即调用getter收集依赖，而是render首次访问时，收集内部依赖，渲染watcher订阅computed watcher变化（自动收集依赖，避免重复计算）；

`computed watcher` 不会在依赖的数据发生变化时立即求值，而是会将自己标记为“脏”（`dirty = true`），在下次访问计算属性时，也就是渲染时， 才会通过调用` evaluate()` 来重新计算计算属性的值；

**意义**：

避免不必要的多次计算：如果没有惰性求值，每次任意一个依赖数据变化时，计算属性都会被立即重新计算，这会导致性能开销非常大。（计算属性与data不同之处在于他需要计算）

缓存机制：首次访问计算出值，后续访问都不会重新计算值，仅被修改过（dirty标记为true）时访问才重新计算值；确保了 Vue 只会在依赖发生变化且计算属性被访问时才重新计算；

## watch

createWatcher 方法调用 Vue.prototype.$watch，内部 `new Watcher(vm, 监听数据，回调处理)` 创建 user Watcher，将定义的watch处理作为回调；

### watcher类型

**deep watcher**：对子对象深层访问收集依赖；

**user watcher**

**computed watcher**

## Props

**传递值**

子组件propsData，在父组件render时创建子组件vnode，即createComponent中时传递；

**响应式**

通过 `defineReactive` 方法把 `prop` 值变成响应式，子组件render手机依赖，prop值修改后触发渲染。

**props更新**

父组件更新 patch 过程中，调用 updateChildComponent 重新计算子组件的每个prop值并设置，由于子组件prop是响应式对象，会触发子组件更新；

**子组件重新渲染**

第一种情况如上，父组件中props更新触发的渲染；

第二种情况：对象类型的 `prop` 内部属性的变化；由于子组件的渲染过程中，访问过这个对象 `prop`，那么父组件依赖收集包含子组件渲染 watcher，prop对象被修改后通知子组件重新渲染。

## v-model双向绑定

双向绑定即数据驱动 DOM 外， DOM 的变化也能反过来影响数据，一个双向关系，前者是基于vue数据驱动实现（render vnode + update patch）且响应式原理，后者通过事件；

在 Vue 中，我们可以通过 `v-model` 来实现双向绑定，可以作用在普通表单元素上，又可以作用在组件上，它其实是一个语法糖。

**实现**

v-model指令，在编译的parse阶段，执行model函数调用处理：根据 AST 元素节点的不同情况去执行不同的逻辑；

指令作用在元素dom元素，比如input上，则在 `input` 上动态绑定了 `value`（input标签的元素value属性），又给 `input` 上绑定了 `input` 事件，通过修改 AST 添加prop和事件处理实现；

同理指令作用在组件上，只不过基于Vue 的父子组件通讯实现，对子组件通过 `prop` 把value传递到子组件，子组件修改了数据后把改变通过 `$emit` 事件的方式通知父组件；

## keep-alive
