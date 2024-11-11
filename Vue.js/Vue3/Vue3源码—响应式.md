# Vue3响应式

## setupRenderEffect

通过 **组件更新函数** 开始响应式

```ts
// setupRenderEffect方法内：
import {
  ReactiveEffect,
  // .....
} from '@vue/reactivity'

// create reactive effect for rendering
instance.scope.on()
const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
instance.scope.off() 

// 调用组件更新 componentUpdateFn 
const update = (instance.update = effect.run.bind(effect))
update();
```

`new ReactiveEffect` 创建副作用，并以 `effect.run` 的方式手动调用渲染，完成响应式变量的 `track` 收集

## ref

### 初始化ref

在组件初始化调用 setup，对声明的ref()语句执行初始化，ref组合式方法声明在 `runtime-core/src/ref.ts`：

```ts
export function ref<T>(
  value: T,
): [T] extends [Ref] ? IfAny<T, Ref<T>, T> : Ref<UnwrapRef<T>, UnwrapRef<T> | T>
export function ref<T = any>(): Ref<T | undefined>
export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow) // Ref实现
} 

class RefImpl<T = any> {
  _value: T
  private _rawValue: T

  dep: Dep = new Dep() // 创建 空依赖管理器

  public readonly [ReactiveFlags.IS_REF] = true
  public readonly [ReactiveFlags.IS_SHALLOW]: boolean = false

  constructor(value: T, isShallow: boolean) {
    this._rawValue = isShallow ? value : toRaw(value)
    this._value = isShallow ? value : toReactive(value) // 创建reactive为值
    this[ReactiveFlags.IS_SHALLOW] = isShallow
  }

  get value() { ... }

  set value(newValue) { ... }
}
```

ref内部实际返回RefImpl实例，内部会调用 `toReactive`，实际上就是创建一个reactive：

```ts
// src/runtime-core/ref.ts
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value
```

### ref依赖收集

观察RefImpl类的 `get value` 的处理：

```ts
  get value() {
    if (__DEV__) {
      // .....
    } else {
      this.dep.track()
    }
    return this._value
  }
```

`dep.track` 即 Dep类 的 track方法，Dep类在 `reactivity/src/Dep.ts`：

```ts
export class Dep {
  // ...Dep实例是一个Set结构
  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    let link = this.activeLink
    if (link === undefined || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this)
      // ...
      addSub(link) // 添加到dep依赖集合
    }
  }
} 

// 手动收集target为依赖
export function track(target: object, type: TrackOpTypes, key: unknown): void {
}
```

ref收集依赖：

- 调用组件setup时初始化ref，即RefImpl的实例，get value时调用dep.track

- setupRendererEffect内，创建instance.effect组件副作用，调用update将副作用添加到dep

### ref响应更新

观察RefImpl类的 `set value` 的处理：

```ts
  set value(newValue) {
    const oldValue = this._rawValue
    const useDirectValue =
      this[ReactiveFlags.IS_SHALLOW] ||
      isShallow(newValue) ||
      isReadonly(newValue)
    newValue = useDirectValue ? newValue : toRaw(newValue)
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue
      this._value = useDirectValue ? newValue : toReactive(newValue)
      if (__DEV__) {
        // ...
      } else {
        this.dep.trigger() // 响应更新
      }
    }
  }
```

`dep.trigger` 即 Dep类 的 trigger 方法，Dep类在 `reactivity/src/Dep.ts`：

```ts
export class Dep {
  // ...
  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++
    globalVersion++
    this.notify(debugInfo)
  } 

  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch()
    try {
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) { // 通知更新
          // if notify() returns `true`, this is a computed. Also call notify
          // on its dep - it's called here instead of inside computed's notify
          // in order to reduce call stack depth.
          ;(link.sub as ComputedRefImpl).dep.notify()
        }
      }
    } finally {
      endBatch()
    }
  }
}
```

通知所有订阅者们**派发更新**

## reactive

初始化reactive

```ts
export function reactive<T extends object>(target: T): Reactive<T>
export function reactive(target: object) {
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap, // 全局reactive target缓存
  )
}
```

### createReactiveObject

```ts
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>,
) {
  if (!isObject(target)) {
    return target
  }
  // target is already a Proxy，已经是reactive
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target 已在ProxyMap缓存
  const existingProxy = proxyMap.get(target) // 
  if (existingProxy) {
    return existingProxy
  }
  // only specific value types can be observed.
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  // proxy代理
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers,
  )
  proxyMap.set(target, proxy) // 缓存
  return proxy
}
```

通过 `new Proxy` 代理所有对target操作，代理逻辑分为 `baseHandlers` 和 `collectionHandlers`

**baseHandlers**

即创建reactive proxy对象时的mutableHandlers，它是一个 `MutableReactiveHandler` 实例，定义proxy的handler对象方法：get、set、has...

```ts
class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false,
  ) {}

  get(target: Target, key: string | symbol, receiver: object): any {
    const res = Reflect.get(
      target,
      key,
      isRef(target) ? target : receiver,
    ) 

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key) // 收集依赖
    }
    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow)
  }
  set(
    target: Record<string | symbol, unknown>,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    // ....
    const result = Reflect.set(
      target,
      key,
      value,
      isRef(target) ? target : receiver,
    )

    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value) // 派发更新
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
```

reactive proxy对象的handler处理方法的get中调用track收集依赖、set中trigger通知更新

``packages/reactivity/src/effect.ts` 的 track方法：

```ts
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  const eventInfo = __DEV__
    ? { effect: activeEffect, target, type, key }
    : undefined

  trackEffects(dep, eventInfo)
}
```

- `const targetMap = new WeakMap<any, KeyToDepMap>()`创建一个`targetMap`容器，用于保存和当前响应式对象相关的依赖内容，本身是一个 `WeakMap`类型

- 将对应的 **响应式对象** 作为 `targetMap` 的 **键**，`targetMap`的**Value**是一个`depsMap`（属于 `Map` 实例）， `depsMap` 存储的就是和当前响应式对象的每一个 `key` 对应的具体依赖

- `depsMap`的**键**是响应式数据对象的key，**Value**是一个`deps`（属于 `Set` 实例），这里之所以使用`Set`是为了避免副作用函数的重复添加，避免重复调用
