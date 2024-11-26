const url = "https://www.baidu.com/s/ass/a?wd=javascript&a=2#hash";

// 匹配path
// const pathResult = url.match(/(https?:\/\/[^\/]+)(\/[^?]*)/); // 匹配协议和路径
// const pathResult = url.match(/(https?:\/\/(\w|\.)+)((\/\w+)+)\?.+/); // 匹配协议和路径
// console.log(pathResult[3]); // 输出匹配的路径

// 匹配query部分 ?xxx=xxx&xxx=xx
// const queryStringResult = url.match(/https?:\/\/[^?]+(\?[\w=&]*)?(#\w+)?/);
// console.log(queryStringResult, queryStringResult[1]);

// 提取query部分
// 匹配hash部分
