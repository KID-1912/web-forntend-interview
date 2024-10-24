## 目录

core核心代码，内部可划分各部分逻辑，如

**instance**

初始化vue实例相关，initLifecycle、initEvents、initRender、initInjections、initState、initProvide；

- lifecycle

- event

- state

- render

**component** 内部组件

**utils** 工具

**config** 配置

**global-api** 全局api，如类的静态方法，Vue的 `src/core/index.js`

## 类的init

原型方法：独立出多个 `xxxMixin(Vue)` 对类进行拓展原型方法

外部可对类原型方法覆写+复用方式进行自定义包装，适应不同平台

**prototype和instance**

`core/instance` 下按功能划分子目录，每个功能都编写了实例初始化该功能的方法（以initialXxx开头），以及为原型拓展该功能相关的原型方法 `xxxMixin`

## 如何阅读源码

从构建脚本寻找入口文件

从类文件/初始化实例的逻辑开始

按程序的顺序（如Vue先寻找初始化再到挂载）带着目的阅读，忽略细节，寻找关键方法，并标记

## 函数实现支持多场景的参数

借助**函数柯里化**，通过 `createXxxxFunction` 把差异化参数提前固化，就不用每次调用 `Xxxx` 传递区别场景的参数；

observe：数据观测方法：为一个对象的每个属性创建一个 **`Observer`** 实例，监控数据变化

Observer：数据观察者，被观察的数据上Observer实例；

defineReactive：负责将对象的某个属性定义为响应式的。一个 **`Dep`** 实例，管理依赖；它通过 `Object.defineProperty` 来拦截对象属性的访问和修改操作，实现依赖收集和更新通知。

Dep：依赖管理器

Watcher：依赖观察者/订阅者

computed和watch有什么区别？什么情况用computed?
computed源码实际内部就是基于watcher，这是由响应式原理决定的；但是是特殊的computed watcher；什么情况用computed，答案是当你需要定义某个值，他不是直接被访问而是基于其它值计算出来的；此时使用vue computed，vue会在最合适的时候去计算值；

你也可以使用watch实现计算属性的需求，但是会很难受；1. 没有自动收集依赖；2. 不会频繁执行计算求值，且仅最终值改变时才会渲染更新，这种缓存的特性使他性能更好

原理：惰性求值；
