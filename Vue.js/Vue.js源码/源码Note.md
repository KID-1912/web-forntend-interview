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

按程序的顺序（如Vue先寻找初始化再到挂载）带着目的阅读，忽略细节，寻找关键方法，并标记
