# 组件化

Vue.js 另一个核心思想是组件化。所谓组件化，就是把页面拆分成多个组件 (component)，每个组件依赖的 CSS、JavaScript、模板、图片等资源放在一起开发和维护。组件是资源独立的，组件在系统内部可复用，组件和组件之间可以嵌套。

```js
import Vue from 'vue'
import App from './App.vue'

var app = new Vue({
  el: '#app',
  // 这里的 h 即 createElement 方法
  render: h => h(App)
})
```

不同的这次通过 `createElement` 传的参数是一个组件而不是一个原生的标签；

# createComponent

render内 `createElement` 调用的 `_createElement` 方法，对参数 `tag` 的判断，非合法标签情况，调用 `createComponent` 方法创建一个组件 VNode。

```js
// src/core/vdom/create-element.js
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // ......
  let vnode, ns
  if (typeof tag === 'string') {
      // new VNode
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // ......
    }
  } else {
    // component创建VNode
    vnode = createComponent(tag, data, context, children)
  } 
}
```

`createComponent` 方法定义在 `core/vdom/create-component.js` ：

```js
// core/vdom/create-component.js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // async component
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor)

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }

  // extract props
  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  const listeners = data.on
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data)

  // return a placeholder vnode
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  if (__WEEX__ && isRecyclableComponent(vnode)) {
    return renderRecyclableComponentTemplate(vnode)
  }

  return vnode
}
```

分析源码比较推荐的是只分析核心流程，这里针对组件渲染这个 case 主要就 3 个关键步骤：构造子类构造函数，安装组件钩子函数和实例化 `vnode`。

## 构造子类构造函数

我们在编写一个组件的时候，通常都是创建一个普通对象，如：

```js
import HelloWorld from './components/HelloWorld'

export default {
  name: 'app',
  components: {
    HelloWorld
  }
}
```

这里 export 的是一个对象，所以 `createComponent` 里的代码逻辑会执行到 `baseCtor.extend(Ctor)`，在这里 `baseCtor` 实际上就是 Vue 类，这个的定义是在最开始初始化 Vue 的阶段，在 `core/global-api/index.js` 中的 `initGlobalAPI` 函数有这么一段逻辑：

```js
// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue
```

Vue 上的一些 option 扩展到了 `vm.$options` 上，所以我们也就能通过 vm.$options._base

```js
Vue.prototype._init = function (options?: Object) {
  // ......
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor), // 即Vue.options
    options || {},
    vm
  )
  // .....
}
```

```js
// core/vdom/create-component.js
// component对象的$options._base是什么？
const baseCtor = context.$options._base // 即vm实例.$options._base

// 如果component为对象，调用Vue.extend
if (isObject(Ctor)) {
  Ctor = baseCtor.extend(Ctor)
}
```

可见 context/vm.$options._base => Vue.options._base => Vue，所以 `Ctor = baseCtor.extend(Ctor)` 即 `Ctor = Vue.extend(Ctor)`


