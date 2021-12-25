# 微博收藏夹图片爬虫

#### 1. 新建images图片文件夹

#### 2. 新建config文件夹

#### 3. 在config文件夹下新建index.js文件
内容如下:

```javascript
exports.cookies = '' // https://m.weibo.cn 登录后的cookies
exports.containerid = '' // https://m.weibo.cn/ => 左上角的用户ICON => 关注 => 地址栏上的containerid(纯数字就行, 把下划线及后面的内容删去)
exports.webCookies = '' // https://weibo.com 登录后的cookies, 需要web版的cookies主要是为了下载超过9张的图片, 移动版没有找到这个接口
```

#### 4. 自行根据需要修改`app.js`里的`startPage`(开始页数)和`endPage`(结束页数)

```bash
$yarn
#or
$npm install

$npm run dev
#or
$yarn dev
```
