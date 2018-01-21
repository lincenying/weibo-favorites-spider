# 微博收藏夹图片爬虫

#### 1. 新建images图片文件夹

#### 2. 新建config文件夹

#### 3. 在config文件夹下新建index.js文件
内容如下:
```javascript
exports.cookies = '' // https://m.weibo.cn 登录后的cookies
exports.containerid = '' // https://m.weibo.cn/ => 我 => 我的收藏 => 地址栏上的containerid
```

```bash
$yarn
#or
$npm install

$npm run dev
```
