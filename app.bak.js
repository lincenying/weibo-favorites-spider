"use strict"

var node = {
    cheerio: require('cheerio'),
    fs: require('fs'),
    mkdirp: require('mkdirp'),
    path: require('path'),
    request: require('request'),
    rp: require('request-promise'),
    url: require('url'),
    trim: require('locutus/php/strings/trim'),
    strip_tags: require('locutus/php/strings/strip_tags'),
}

var colors = require('colors')
colors.setTheme({
    red: 'red',
    green: 'green',
    blue: 'blue',
    yellow: 'yellow'
})

var options = {
    uri: 'http://m.weibo.cn/api/container/getIndex?containerid=2302595036554104&page=',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.21 Safari/537.36',
        'Cookie': 'h5_deviceID=eb6b1f7616f6a6b7938c1668e4e652ba; H5_INDEX=3; H5_INDEX_TITLE=%E6%9E%97%E5%B2%91%E5%BD%B1; _T_WM=28849a563523ed763f51788ccfd602b5; ALF=1495981605; SCF=AqC0RndaoB84rBWQx1V-icEPYrGWtDpTw5ZTjplQj-GHAKypd19lZBsEGOIiTnwRdUduksfNRrJoO2Xq51GdrMQ.; SUB=_2A250ByEtDeThGeNO6FQU9SrNyziIHXVXCE9lrDV6PUJbktBeLWT7kW0EFW0ad8LP03E0uvaK_zMsLJmr5Q..; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFT_XGWwkzbVC-hibvsTOby5JpX5o2p5NHD95QfehecSK-XeK5XWs4Dqcjdi--ciKL8iK.Ni--fi-zEiK.pi--fi-i2i-zp; SUHB=0nl-WXCgEqFA-D; SSOLoginState=1493389694; M_WEIBOCN_PARAMS=luicode%3D10000011%26lfid%3D2302595036554104%26fid%3D2302595036554104%26uicode%3D10000011'
    },
    saveTo: './images',
    startPage: 6,
    // 6644
    endPage: 22,
    downLimit: 5,
    totalPage: 0
}

var getPage = (item, curPage) => {
    var uri = item.href || item
    var rpOptions = {
        url: options.uri + curPage,
        headers: options.headers
    }
    return node.rp(rpOptions).then(body => {
        console.log('下载页面成功：%s'.green, uri)
        return {
            curPage,
            uri,
            html: body
        }
    }).catch(function (err) {
        console.log(err)
    })
}

var parseList = page => {
    console.log('开始分析页面数据：%s'.blue, page.uri)
    var json = JSON.parse(page.html)
    var cards = json.cards
    var $return = []
    cards.forEach(item => {
        var img = []
        if (item.mblog.pics && item.mblog.pics.length > 0) {
            item.mblog.pics.forEach(i => {
                img.push(i.large.url)
            })
            $return.push({
                id: item.mblog.mid || item.mblog.id || item.mblog.idstr,
                img,
                text: item.mblog.text
            })
        }
    })
    return {
        page: page.curPage,
        imgList: $return
    }
}

var makeDir = item => {
    return new Promise(resolve => {
        var path = node.path
        var dir = path.join(options.saveTo, item.id)
        console.log('准备创建目录：%s'.blue, dir)
        if (item.img.length > 0) {
            if (node.fs.existsSync(dir)) {
                console.log('目录：%s 已经存在'.red, dir)
                resolve(item)
            } else {
                node.mkdirp(dir, function() {
                    console.log('目录：%s 创建成功'.green, dir)
                    resolve(item)
                })
            }
        } else {
            console.log('目录：%s 图片为空, 不创建'.red, dir)
            resolve(item)
        }
    })
}

var writeText = item => {
    var path = node.path
    var dir = path.join(options.saveTo, item.id)
    console.log('准备写入微博内容：%s'.blue, dir)
    node.fs.writeFileSync(dir + '/content.txt', node.strip_tags(item.text), {flag:'w'})
    console.log('写入微博内容成功：%s'.green, dir)
}

var downImage = (imgsrc, dir, page) => {
    return new Promise((resolve, reject) => {
        var url = node.url.parse(imgsrc)
        var fileName = node.path.basename(url.pathname)
        var toPath = node.path.join(options.saveTo, dir, fileName)
        console.log('开始下载图片：%s，保存到：%s，页数：%s / %s'.blue, fileName, dir, page, options.totalPage)
        node.fs.exists(toPath, function(exists) {
            if (exists) {
                console.log('图片已经存在：%s'.yellow, imgsrc)
                resolve()
            } else {
                node.request.get(encodeURI(imgsrc), {
                    timeout: 20000
                }, function(err) {
                    if (err) {
                        console.log('图片下载失败, code = ' + err.code + '：%s'.error, imgsrc)
                        resolve(imgsrc + " => 0")
                    }
                }).pipe(node.fs.createWriteStream(toPath)).on('close', () => {
                    console.log('图片下载成功：%s'.green, imgsrc)
                    resolve()
                }).on('error', err => {
                    console.log('图片下载失败：%s'.red, imgsrc)
                    reject(err)
                })
            }
        })
    })
}

var init = async () => {
    if (!options.totalPage) options.totalPage = options.endPage
    if (options.totalPage && !options.endPage) options.endPage = options.startPage + options.totalPage - 1
    for (let i = options.startPage; i <= options.endPage; i++) {
        console.log('======================'.yellow)
        const uri = options.uri + i
        console.log('开始下载页面：%s'.blue, uri)
        const page = await getPage(uri, i)
        const list = await parseList(page)
        for (let j = 0; j < list.imgList.length; j++) {
            var item = list.imgList[j]
            await makeDir(item)
            await writeText(item)
            var length = item.img.length, num = 1, task = []
            console.log('开始下载图片, 总数：%s'.blue, length)
            for (const img of item.img) {
                task.push(downImage(img, item.id, list.page))
                if (num % options.downLimit === 0 || num >= length) {
                    await Promise.all(task)
                    task = []
                }
                num++
            }
        }
    }
    console.log('抓取完成!'.green)
}

init()
