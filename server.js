const http = require("http");
const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const koaBody = require("koa-body");
const koaStatic = require("koa-static");

const app = new Koa();
const port = process.env.PORT || 7070;
const public = path.join(__dirname, "/public");

let images = [];

app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
  })
);

app.use(koaStatic(public));

app.use(async (ctx, next) => {
  const origin = ctx.request.get("Origin");

  if (!origin) {
    return await next();
  }

  const headers = { "Access-Control-Allow-Origin": "*" };

  if (ctx.request.method !== "OPTIONS") {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get("Access-Control-Request-Method")) {
    ctx.response.set({
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
    });

    if (ctx.request.get("Access-Control-Request-Headers")) {
      ctx.response.set(
        "Access-Control-Allow-Headers",
        ctx.request.get("Access-Control-Allow-Request-Headers")
      );
    }

    ctx.response.status = 204;
  }
});

app.use(async (ctx) => {
  const reqType = await ctx.request.method;

  if (reqType === "GET") {
    const { method, id } = ctx.request.query;

    if (method === "getImages") {
      ctx.response.body = images;
      return;
    }

    if (method === "delImages") {
      images = images.filter((image) => image.id !== id);

      ctx.response.body = images.length;
      return;
    }
  }

  if (reqType === "POST") {
    const img = ctx.request.body.img;
    images.push(JSON.parse(img));

    ctx.response.body = images.length;
  }
});

const server = http.createServer(app.callback()).listen(port);
