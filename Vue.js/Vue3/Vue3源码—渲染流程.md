# Vue3源码

## 目录设计

**源码目录**：[ vuejs/core](https://github.com/vuejs/core)

- compiler-core

- compiler-dom

- compiler-sfc

- reactivity

- runtime-core

- runtime-doms

- vue

vue3将模块划分多包，并使用monorepo管理；我们关注 `core/package/vue` 目录，即我们 `import { xxx } from ‘vue’` 引入vue功能的来源；

**打包配置**

准备阅读 `core/package/vue` 目录，从哪个目录开始呢，我们先只关注根目录下的 `rollup.config.ts`，它是 vue3 下多包（包含vue）的打包配置；如：

```ts
import { entries } from './scripts/aliases.js'

// .....
function createConfig(format, output, plugins = []) {
    // .....  
    let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`
}
```

导入了一个入口文件的别名 `entries`，在生成打包配置中分别指定运行时、编译时的入口文件；

由此可知，每个vue3包下（包含vue）`src/runtime.ts` 是仅运行时的入口文件，`src/index.ts` 是包含编译的入口文件；我们需要了解vue3的编译阶段的新特性，应该从 `vue/src/index.ts` 开始阅读；

熟悉vue2的都知道 compiler 就是生成 render 函数；

```ts
// packages/vue/src/index.ts
import {
  type CompilerError,
  type CompilerOptions,
  compile,
} from '@vue/compiler-dom'
import {
  type RenderFunction,
  registerRuntimeCompiler,
  warn,
} from '@vue/runtime-dom'
import * as runtimeDom from '@vue/runtime-dom' 

// 模板语法编译方法
function compileToFunction(
  template: string | HTMLElement,
  options?: CompilerOptions,
): RenderFunction {
  // ......
}
// 注册运行时编译方法
registerRuntimeCompiler(compileToFunction) 

// 导出packages/runtime-dom所有
export * from '@vue/runtime-dom'
```

## createApp

```ts
import { createApp } from "vue";
const app = createApp(App);
app.mount("#app");
```

我们通过createApp初始化一个vue app实例，并挂载到dom；该方法声明在 `packages/runtime-dom/index.ts`

```ts
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args) 
  // ......
  const { mount } = app
  // 覆写app.mount挂载方法
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => { 
    // ......
    const proxy = mount(container, false, resolveRootNamespace(container))
    // ......
    return proxy
  }
  return app
}
```

createApp做2件事：内部调用 `ensureRenderer().createApp(...args)`，其中 `args` 即我们的App.vue编译后的结果；其次，对 `app.mount` 包了一层处理，最后返回 app 实例；

**ensureRender**

```ts
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  )
}
```

ensureRender的目的是延迟初始化加载器，仅当开发者调用createApp方法，才调用createRenderer，使render模块能够被tree shaking；接着寻找 createRenderer 方法，它在 `packages/runtime-core/render.ts` 文件下，也就是vue核心功能render实现部分：

### createRenderer

```ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement,
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement> {
  return baseCreateRenderer<HostNode, HostElement>(options)
}
```

该文件下看到 **baseCreateRenderer** 实现：

```ts
// implementation
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions,
): any { 
  
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    insertStaticContent: hostInsertStaticContent,
  } = options 

  const patch: PatchFn
  const processText: ProcessTextOrCommentFn
  const processCommentNode: ProcessTextOrCommentFn
  const mountStaticNode
  // ......
  const render: RootRenderFunction
  // .....
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate),
  }
}
```

熟悉vue2的发现，这很像vue2的patch function实现，但是vue2patch方法前需要调用render函数，生成组件vnode；怎么vue3直接调用patch，vnode哪一步生成的？

不急，我们回到 **ensureRenderer**，它内部调用了 `baseCreateRenderer`，baseCreateRenderer 返回一个对象（我们称为 **渲染器**），包含 `render` 方法（看起来和vue2的patch相似）以及新的createApp方法，它来自createAppApI，传递render，很明显基于函数柯里化生成createApp方法

### createAppAPI

它声明在 `packages/runtime-core/apiCreateApp.ts`：

```ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
  hydrate?: RootHydrateFunction,
): CreateAppFunction<HostElement> { 
  return function createApp(rootComponent, rootProps = null) {
    // 基本属性
    const app: App = (context.app = {
      _uid: uid++,
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
    } 
    use(plugin: Plugin, ...options: any[]) 
    mixin(mixin: ComponentOptions)
    component(name: string, component?: Component): any
    directive(name: string, directive?: Directive)
    mount( ....) // 内部依赖render方法
    return app 
  }
}
```

如你所见，它内部实现了 app 所有基本属性和方法，其中就包括重点关注的mount，它内部使用了传递的参数，即render方法；

**总结**

到此为止，我们知道在vue3我们调用 `const app = createApp(App);`，实际调用了baseCreateRenderer()，它返回一个包含render方法和真正能生成app的createApp方法的对象，并调用createApp得到app实例；

## mount

我们在createApp后拿到vue对象，下一步就是对 app 挂载，即调用mount方法，观察mount方法实现：

```ts
// packages/runtime-core/apiCreateApp.ts 
export function createAppAPI<HostElement>(){
// ...
 return function createApp(rootComponent, rootProps = null) {
    const app: App = (context.app = {
      _uid: uid++,
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
    }
    // mount实现
    mount(
      rootContainer: HostElement,
      isHydrate?: boolean,
      namespace?: boolean | ElementNamespace,
    ): any {
      if (!isMounted) {
      // 生成组件vnode
      const vnode = app._ceVNode || createVNode(rootComponent, rootProps)
      if (isHydrate && hydrate) {
        hydrate(vnode as VNode<Node, Element>, rootContainer as any)
      } else {
        // 调用render
        render(vnode, rootContainer, namespace)
      }
      isMounted = true
      app._container = rootContainer
    }
    return app 
  } 
}
```

 到这里，我们看到调用render：`render(vnode, rootContainer, namespace)` 这不就是vue2的patch方法调用吗？那么我们观察vnode来历：`createVNode(rootComponent, rootProps)`，**createVNode**方法在 `packages/runtime-core/vnode.ts` 下

### createVNode

```ts
function _createVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false,
): VNode { 

  if (isVNode(type)) // .....
  if (isClassComponent(type)) {
    type = type.__vccOpts
  }

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true,
  ) 
}
```

**createBaseVNode**

```ts
function createBaseVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
): VNode {
  const vnode = {
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    // .....
  }
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children)
    // normalize suspense children
    if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
      ;(type as typeof SuspenseImpl).normalize(vnode)
    }
  } else if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}
```

这不就是vue2中的createElement方法么，vue2中调用组件的render函数生成vnode，组件的render函数内部是通过createElement创建vnode并返回的；

此处我们得知mount方法创建了一个app 根虚拟节点（占位）；

### render

mount调用createNode创建占位节点后，调用render方法，这里的render不再是vue2的render，而是创建app时 **baseCreateRenderer** 内的render：

```ts
  const render: RootRenderFunction = (vnode, container, namespace) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace,
      )
    }
    container._vnode = vnode
    if (!isFlushing) {
      isFlushing = true
      flushPreFlushCbs()
      flushPostFlushCbs()
      isFlushing = false
    }
  }
```

#### patch

```js
  const patch: PatchFn = (
    n1,
    n2,
    container,
    // ......
  ) => {
    // .....
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      case Comment:
        processCommentNode(n1, n2, container, anchor)
        break
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace)
        } else if (__DEV__) {
          patchStaticNode(n1, n2, container, namespace)
        }
        break
      case Fragment:
        processFragment()
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement()
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent()
        }
      // ..... 
  }
```

#### mountComponent

patch 根据 vnode的type，执行不同操作；其中 `processComponent` 内部会调用 `mountComponent`：

```ts
  const mountComponent: MountComponentFn = (
    initialVNode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    namespace: ElementNamespace,
    optimized,
  ) => {
    // mounting
    const compatMountInstance =
      __COMPAT__ && initialVNode.isCompatRoot && initialVNode.component
    const instance: ComponentInternalInstance =
      compatMountInstance ||
      (initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent,
        parentSuspense,
      )) 

    if (!(__COMPAT__ && compatMountInstance)) {
      // ......
      setupComponent(instance, false, optimized) // 初始化组件
    }

    if (__FEATURE_SUSPENSE__ && instance.asyncDep) {
      // .....
    } else {
      setupRenderEffect(
        instance,
        initialVNode,
        container,
        anchor,
        parentSuspense,
        namespace,
        optimized,
      )
    }
  }
```

**createComponentInstance**：创建组件实例（vue实例属性）

**setupComponent**：初始化组件

**setupRenderEffect**：`renderComponentRoot` 生成完整vnode树，并不断调用patch渲染子树（subtree）

#### setupComponent

mountComponent方法下，调用setupComponent初始化组件，该方法声明在 `runtime-core/component.ts`

```ts
export function setupComponent(
  instance: ComponentInternalInstance,
  isSSR = false,
  optimized = false,
): Promise<void> | undefined {
  isSSR && setInSSRSetupState(isSSR)

  const { props, children } = instance.vnode
  const isStateful = isStatefulComponent(instance)
  initProps(instance, props, isStateful, isSSR)
  initSlots(instance, children, optimized)
  // 调用 setupStatefulComponent 得到 setupResult 
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined

  isSSR && setInSSRSetupState(false)
  return setupResult
}
```

**setupStatefulComponent**

```ts
function setupStatefulComponent(
  instance: ComponentInternalInstance,
  isSSR: boolean,
) {
  const Component = instance.type as ComponentOptions

  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null)
  // 1. create public instance / render proxy
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
  // 2. call setup()
  const { setup } = Component
  if (setup) {
    pauseTracking()
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)
    const reset = setCurrentInstance(instance)
    // 调用 setup
    const setupResult = callWithErrorHandling(
      setup,
      instance,
    )
    const isAsyncSetup = isPromise(setupResult)
    resetTracking()
    reset()

    if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) {
      markAsyncBoundary(instance)
    }

    if (isAsyncSetup) {
      // ......
    } else {
      // 处理setupResult
      handleSetupResult(instance, setupResult, isSSR)
    }
  } else {
    // 完成Setup
    finishComponentSetup(instance, isSSR)
  }
}
```

**handleSetupResult**

```ts
if (isObject(setupResult)) {
  instance.setupState = proxyRefs(setupResult) // 实例代理setup返回值
}
```

**finishComponentSetup**

```ts
if (!instance.render) {
  // 编译template为组件实例的render
  Component.render = compile(template, finalCompilerOptions) 

  // support for 2.x options 对vue2 options初始化响应式
  applyOptions(instance)
}
```

#### setupRenderEffect

```ts
  const setupRenderEffect: SetupRenderEffectFn = (
    instance,
    initialVNode,
    container
  ) => {
    const componentUpdateFn = () => { ... }
    // create reactive effect for rendering
    instance.scope.on()
    const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
    instance.scope.off()
```

创建更新函数：`const componentUpdateFn = () => {}`

创建更新机制：`const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))`

首次执行：

```ts
const update = (instance.update = effect.run.bind(effect))
update() // 手动执行
```

### Vue3 渲染流程

Vue 3 的渲染流程确实与 Vue 2 有显著的不同。以下是 Vue 3 和 Vue 2 渲染流程的核心区别以及其中的机制变化：

**Vue 2 中的渲染流程**

在 Vue 2 中，组件的模板会被编译成一个 `render` 函数，这个函数在组件实例化时被直接调用，用于生成虚拟节点树 (`VNode tree`)。流程大致如下：

- **编译阶段**：模板被编译为 `render` 函数。
- **渲染阶段**：当组件被挂载或更新时，Vue 2 的 `render` 函数会通过 `createElement` 方法递归地创建组件的虚拟节点树 (`VNode tree`)。
- **VNode 树**：`render` 函数返回整个组件的 `VNode tree`，Vue 通过 `patch` 方法将它映射到实际的 DOM。

这个 `render` 函数在每次组件数据更新时会重新调用，从而生成新的 `VNode tree` 并执行 `patch` 更新 DOM。

**Vue 3 的渲染流程与优化**

Vue 3 引入了大量优化，因此其渲染机制发生了较大变化，尤其体现在以下几点：

#### Block Tree 和 Patch Flags

Vue 3 引入了 Block Tree 和 Patch Flags 来减少不必要的虚拟节点更新和 `patch` 过程。以下是关键改进：

- **Block Tree**：Vue 3 将组件内的**静态内容和动态内容分离**，构建了一个 Block Tree，只有动态内容在数据变更时需要重新渲染。
- **Patch Flags**：Vue 3 编译阶段会为动态内容打上 Patch Flags，用来标记更新时应优先处理的节点和属性。这些 Patch Flags 允许 Vue 只更新受影响的部分，而不是整个组件的虚拟节点树。

#### `createVNode` 生成 VNode，而不是 `render` 函数

在 Vue 3 中，创建组件实例时不再直接调用 `render` 函数，而是调用 `createVNode`。在根组件挂载时，Vue 3 会直接通过 `createVNode` 生成根组件的 `VNode`，并不会在这一步调用组件的 `render` 函数。

- `createVNode` 只是创建一个 VNode 作为组件的占位符，并不会立即展开其内部的子节点。
- Vue 3 直到实际执行 **`setupComponent`** 时才会调用组件的 `render` 函数来生成完整的虚拟节点树。

#### 渲染和更新流程的简化

Vue 3 的渲染流程更加模块化，通过 `setupRenderEffect` 生成了组件的渲染副作用：

- **首次渲染**：在 `setupRenderEffect` 中，Vue 会调用组件的 `render` 函数来生成完整的虚拟节点树（`subTree`），并将其传入 `patch`。
- **响应式更新**：当组件的响应式数据变化时，`setupRenderEffect` 会自动重新执行 `render` 函数，并生成新的 `subTree`，此时 `patch` 会基于新旧 `VNode` 树进行最小化的 DOM 更新。

这个流程大大优化了 Vue 的更新效率，因为只需更新动态部分的虚拟节点，而无需重建整个虚拟节点树。

### 与vue2渲染流程不同

vue3 render 包含了 组件的vnode创建、vnode生成和patch DOM；

通过3点优化，核心是不在每次更新生成整个vnode，区分动态和静态内容，独立渲染动态内容功能（setupRenderEffect），提高渲染效率
