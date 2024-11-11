# TypeScript

工具：typescript编译器、ts-node

## 类型

基础类型：number、string、boolean、array、tuple、enum、null、undefined、symbol、void、never、any

类型标注：Array、Object、Enum、Map、Set、Function、Class

## 使用

联合类型

泛型

类型断言

## 工具类型

Partial

Readonly

Record

Pick/Omit

Exclude/Extract

Parameters/ReturnType

typeof

Awaited

## 类型模块

支持将类型定义单独放在一个文件中，通过import导入

**declare**

声明外部模块类型：`declare module "qs";`

拓展全局类型：

```ts
declare global {
  // ......
}
export default {}; // 导出模块，使其不作为全局类型声明
```

## 编译配置

**compilerOptions**

modules 输出模块规范
target 编译目标
types 引入的类型声明文件
path 路径别名
lib 内置类型

**输入文件**

include

## typescript lint

@typescript-eslint typescript和eslint的结合