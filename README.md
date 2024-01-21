# 微博收藏夹图片爬虫

#### 1. 新建images图片文件夹

#### 2. 新建config文件夹

#### 3. 在config文件夹下新建index.js文件

内容如下:

```javascript
// https://m.weibo.cn 登录后的cookies
exports.cookies = ''
// https://m.weibo.cn/ => 打开控制台,
// 输入 document.querySelector('.main-top').__vue__.tabs[0].children.find(item => item.name ==='我的收藏').gid
// 得到的即为containerid
exports.containerid = ''
// https://weibo.com 登录后的cookies, 需要web版的cookies主要是为了下载超过9张的图片, 移动版没有找到这个接口
exports.webCookies = ''
```

#### 4. 自行根据需要修改`app.js`里的`startPage`(开始页数)和`endPage`(结束页数)

```bash
pnpm install
#or
npm install

npm run dev
#or
pnpm dev
```
