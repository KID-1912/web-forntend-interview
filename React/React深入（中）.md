# 模块化css

## CSS Modules

**自定义命名规则**

css-loader

**全局变量**

:global(.class-name)

**组合样式**

composes：

```css
.text {
  composes: base; // 组合的基础样式类名
  background-color: pink;
}
```

**组合方案**

**全局样式或者是公共组件样式**可以用 .css 文件

项目中开发的**页面和业务组件**，统一用 scss 或者 less 等做 CSS Module

**动态添加class**

## CSS in JS

**style-components**

# 高阶组件（HOC）


