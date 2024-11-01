# web安全

## XSS

**跨站脚本注入**：想办法对网站注入恶意代码，在浏览器端自动执行动作（窃取信息，修改操作，展示内容）；

**存储型**

攻击的代码被服务端写入进**数据库**中（或操作数据库），大量正常访问页面的用户都受到攻击；

**反射型**

一般通过**修改 URL 参数**的方式加入攻击代码，诱导用户访问链接从而进行攻击； 

**DOM类型**

单纯的前端对用户输入内容未过滤，且前端代码中存在漏洞；

对于用户的输入应该是永远不信任的；

### 转义输入输出

对于引号、尖括号、斜杠进行转义，保证用户输入内容非执行代码

```js
function escape(str) {
  str = str.replace(/&/g, '&')
  str = str.replace(/</g, '<')
  str = str.replace(/>/g, '>')
  str = str.replace(/"/g, '&quto;')
  str = str.replace(/'/g, '&#39;')
  str = str.replace(/`/g, '&#96;')
  str = str.replace(/\//g, '&#x2F;')
  return str
}
```

如果是富文本内容，可以借助 `xss` 工具进行白名单过滤；

```js
const xss = require('xss')
let html = xss('<h1 id="title">XSS Demo</h1><script>alert("xss");</script>')
// -> <h1>XSS Demo</h1><script>alert("xss");</script>
console.log(html)
```

### CSP(内容安全策略)

CSP是浏览器中的内容安全策略，允许服务器决定浏览器是否允许加载哪些资源，提交哪些信息；

**Content Security Policy**

与 CORS 类似，允许后端服务设置HTML文件响应头 `Content-Security-Policy` 配置允许资源被加载条件，如：仅允许本站的资源被加载，仅允许图片在https协议下被加载

**Cookie**

HttpOnly：不允许浏览器通过 JavaScript 读取 Cookie 的值，使尝试窃取cookie执行非法操作的注入脚本无效；

### 检查漏洞

模板引擎拼接、内联事件（`onload="onload(data)"`）、HTML写入（innerHTML/v-html\document.write）、属性写入、js写入（Function、eval）

## CSRF


