const url = "https://www.baidu.com/s/ass/a?wd=javascript&a=2&c=#hash2";

// 匹配path
// const pathResult = url.match(/(https?:\/\/[^\/]+)(\/[^?]*)/);
// const pathResult = url.match(/(https?:\/\/(\w|\.)+)((\/\w+)+)\?.+/);
// console.log(pathResult[3]); // 输出匹配的路径

// 匹配query部分 ?xxx=xxx&xxx=xx
// const queryStringResult = url.match(/https?:\/\/[^?]+(\?[\w=&]*)?(#\w+)?/);
// console.log(queryStringResult, queryStringResult[1]);

// 格式化query
// const queryResult = url.match(/https:\/\/[^?]+\?([^#]+)(#\w+)?/);
// if (queryResult && queryResult[1]) {
//   const queryString = queryResult[1];
//   const list = queryString.split("&");
//   const queryObject = list.reduce((prev, cur) => {
//     const [key, value] = cur.split("=");
//     prev[key] = value;
//     return prev;
//   }, {});
//   console.log(queryObject);
// }

// const searchParams = new URL(url).searchParams;
// const queryObject = {};
// for (key of searchParams.keys()) {
//   queryObject[key] = searchParams.get(key);
// }
// console.log(queryObject);

// 匹配hash部分
// const hashResult = url.match(/https:\/\/[^#]+(#\w+)/);
// console.log(hashResult && hashResult[1]);
