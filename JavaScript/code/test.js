const obj = {
  name: "入口文件",
  dependencies: [
    {
      name: "module1",
      dependencies: [
        { name: "module1-js1", dependencies: [{ name: "js1-valid" }] },
      ],
    },
    { name: "module2", dependencies: [{ name: "module2-js2" }] },
  ],
};
const des = [obj];

for (item of des) {
  console.log(item.name);
  item.dependencies?.forEach((item) => {
    des.push(item);
  });
}
