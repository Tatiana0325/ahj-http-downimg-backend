const http = require("http");
const Koa = require("koa");
const koaBody = require("koa-body");
const path = require("path");
const fs = require("fs");
const uuid = require("uuid");

const port = process.env.PORT || 7071;
const app = new Koa();
const publ = path.join(__dirname, "/public");
const koaStatic = require("koa-static");

app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
  })
);

app.use(koaStatic(publ));

let catalog = fs.readdirSync(publ);

app.use(async (ctx) => {
  ctx.response.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": ["DELETE", "PUT", "PATCH"],
  });
  if (ctx.request.method === "OPTIONS") {
    ctx.response.body = "";
  }

  if (ctx.request.method === "DELETE") {
    const name = ctx.request.querystring;
    fs.unlinkSync(`./public/${name}`);
    catalog = fs.readdirSync(publ);
    ctx.response.status = 200;
  } else if (ctx.request.method === "GET") {
    ctx.response.body = JSON.stringify(catalog);
  } else if (ctx.request.method === "POST") {
    const { file } = ctx.request.files;
    console.log(ctx.request.files);
    const link = await new Promise((resolve, reject) => {
      const oldPath = file.path;
      const filename = uuid.v4();
      const newPath = path.join(publ, filename);
      const callback = (error) => reject(error);
      const readStream = fs.createReadStream(oldPath);
      const writeStream = fs.createWriteStream(newPath);
      readStream.on("error", callback);
      writeStream.on("error", callback);
      readStream.on("close", () => {
        console.log("close");
        fs.unlink(oldPath, callback);
        resolve(filename);
      });
      readStream.pipe(writeStream);
    });
    ctx.response.body = link;
    catalog = fs.readdirSync(publ);
  }
});
const server = http.createServer(app.callback()).listen(port);
