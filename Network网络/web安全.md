# web安全

## XSS

**跨站脚本注入**：想办法对网站注入恶意代码，在浏览器端自动执行动作（窃取信息，修改操作，展示内容）；

**存储型**

攻击的代码被服务端写入进**数据库**中（或操作数据库），大量正常访问页面的用户都受到攻击；

**反射型**

一般通过**修改 URL 参数**的方式加入攻击代码，诱导用户访问链接从而进行攻击； 

**DOM类型**

单纯的前端对用户输入内容未过滤，且前端代码中存在漏洞；

**核心**：对于用户的输入应该是永远不信任的；

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

跨站请求伪造（Cross-Site Request Forgery）

攻击者构造出一个正常的后端请求地址，想办法让用户不知情下发起该请求（如诱导用户点击）。如果用户在登录状态下的话，后端就以为是用户在操作，从而进行相应的逻辑。

**核心**：阻止第三方网站调用服务（携带用户状态）

### Get 请求不对数据修改

### SameSite

Cookie 设置 `SameSite` 属性。该属性表示 Cookie 不随着跨域请求发送，可以很大程度减少 CSRF 的攻击，但是该属性目前并不是所有浏览器都兼容。

### 验证 Referer

通过验证 Referer 来判断该请求是否为第三方网站发起的

### Token

服务器下发一个随机 Token，设置本站每次发起请求时将 Token 携带上（自定义请求头），服务器验证 Token 是否有效；如果一个请求未携带token，则确定为用户伪造；

### 验证码

对于一些请求被发起前置，调用第三方验证码完成请求，如滑动验证码（腾讯云天域），保证为用户手动交互；

## 点击劫持

通过视觉欺骗的方式，在用户不知情下让用户与其他网站界面交互；

核心：警惕页面被 第三方网站以iframe方式嵌入；

### frame busting

使用 JS 脚本判断是否被恶意网站嵌入，如：网站监测到被一个 iframe 打开，自动跳转到正常的页面即可。

```js
if (self !== top) {  // 跳回原页面  top.location = self.location;}
```

### CSP

通过内容安全策略的http请求头设置，禁止/控制页面被哪些源嵌入；

**`X-Frame-Options`**

X-FRAME-OPTIONS 已被弃用，可用 CSP字段的 `frame-ancestors` 取代；

**`frame-ancestors`**

指定页面iframe标签的有效父级，值为 `none` 等同于 `X-Frame-Options: DENY`

```http
Content-Security-Policy: frame-ancestors <space separated list of sources>;
```

## 中间人攻击

攻击方同时与服务端和客户端建立起了连接，并让对方认为连接是安全的。攻击者不仅能获得双方的通信信息，还能修改通信信息。（使用公共的 Wi-Fi）

解决：使用一个安全通道来传输信息，如 HTTPS；（页面被没有完全关闭 HTTP 访问的话，攻击方仍可以通过某些方式将 HTTPS 降级为 HTTP 从而实现中间人攻击）

## 服务端攻击

#### SQL 注入

- SQL拼接

- 字符串截断

#### CRLF 注入

#### 文件上传漏洞

#### 登录认证攻击

#### 分布式拒绝服务攻击

#### WebServer 配置安全
