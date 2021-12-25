'use strict'

const config = require('./config')

var node = {
    cheerio: require('cheerio'),
    fs: require('fs'),
    mkdirp: require('mkdirp'),
    path: require('path'),
    axios: require('axios'),
    url: require('url'),
    trim: require('locutus/php/strings/trim'),
    strip_tags: require('locutus/php/strings/strip_tags'),
    mapLimit: require('async/mapLimit')
}

var colors = require('colors')
colors.setTheme({
    red: 'red',
    green: 'green',
    blue: 'blue',
    yellow: 'yellow'
})

var options = {
    uri: 'https://m.weibo.cn/api/container/getIndex?containerid=' + config.containerid + '&page=',
    headers: {
        Referer: 'https://m.weibo.cn/p/index?containerid=' + config.containerid + '',
        'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        Cookie: config.cookies,
        'X-Requested-With': 'XMLHttpRequest'
    },
    saveTo: './images',
    startPage: 1,
    // 39270-38910-38162-37532
    endPage: 36,

    downLimit: 5,
    totalPage: 0
}

var getPage = (item, curPage) => {
    var uri = item.href || item
    var rpOptions = {
        url: options.uri + curPage,
        headers: options.headers
    }
    return node
        .axios(rpOptions)
        .then(({ data }) => {
            console.log('下载页面成功：%s'.green, uri)
            return {
                curPage,
                uri,
                html: data
            }
        })
        .catch(function (err) {
            console.log(err)
        })
}

var getMorePic = mid => {
    var url = `https://weibo.com/aj/mblog/getover9pic?ajwvr=6&mid=${mid}&__rnd=${new Date().getTime()}`
    var rpOptions = {
        url,
        headers: {
            Referer: 'https://weibo.com',
            Cookie: config.webCookies,
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent':
                'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36'
        }
    }
    return node
        .axios(rpOptions)
        .then(({ data }) => {
            if (data.code === '100000') {
                return data.data.pids
            }
            return []
        })
        .catch(function () {})
}

var parseList = async page => {
    console.log('开始分析页面数据：%s'.blue, page.uri)
    var json = page.html
    var cards = json.data.cards
    var $return = []
    var length = cards.length
    for (let i = 0; i < length; i++) {
        const item = cards[i]
        const id = item.mblog.mid || item.mblog.id || item.mblog.idstr
        var img = []
        if (item.mblog.pics && item.mblog.pics.length > 0) {
            // eslint-disable-next-line no-loop-func
            item.mblog.pics.forEach(jj => {
                img.push(jj.large.url)
            })
            if (item.mblog.pic_num > 9) {
                const more = await getMorePic(id)
                if (more && more.length > 0) {
                    // eslint-disable-next-line no-loop-func
                    more.forEach(ss => {
                        img.push('https://wx4.sinaimg.cn/large/' + ss + '.jpg')
                    })
                }
            }
            $return.push({
                id,
                img,
                text: item.mblog.text,
                user: item.mblog.user.screen_name
            })
        }
    }
    return {
        page: page.curPage,
        imgList: $return
    }
}

var makeDir = item => {
    return new Promise(resolve => {
        var path = node.path
        var dir = path.join(options.saveTo, item.user + '/' + item.id)
        console.log('准备创建目录：%s'.blue, dir)
        if (item.img.length > 0) {
            if (node.fs.existsSync(dir)) {
                console.log('目录：%s 已经存在'.red, dir)
                resolve(item)
            } else {
                node.mkdirp(dir).then(() => {
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

// eslint-disable-next-line no-unused-vars
var writeText = item => {
    var path = node.path
    var dir = path.join(options.saveTo, item.user + '/' + item.id)
    console.log('准备写入微博内容：%s'.blue, dir)
    node.fs.writeFileSync(dir + '/content.txt', node.strip_tags(item.text), { flag: 'w' })
    console.log('写入微博内容成功：%s'.green, dir)
}

var downImage = (imgsrc, dir, page) => {
    return new Promise((resolve, reject) => {
        var url = new node.url.URL(imgsrc)
        var fileName = node.path.basename(url.pathname)
        var toPath = node.path.join(options.saveTo, dir, fileName)
        console.log('开始下载图片：%s，保存到：%s，页数：%s / %s'.blue, fileName, dir, page, options.totalPage)
        if (node.fs.existsSync(toPath)) {
            console.log('图片已经存在：%s'.yellow, imgsrc)
            resolve()
        } else {
            node.axios({
                method: 'get',
                url: imgsrc,
                responseType: 'stream'
            })
                .then(({ data }) => {
                    data.pipe(node.fs.createWriteStream(toPath))
                        .on('close', () => {
                            console.log('图片下载成功：%s'.green, imgsrc)
                            resolve()
                        })
                        .on('error', err => {
                            console.log('图片下载失败：%s'.red, imgsrc)
                            reject(err)
                        })
                })
                .catch(error => {
                    console.log('图片下载失败, code = ' + error.code + '：%s'.error, imgsrc)
                    resolve(imgsrc + ' => 0')
                })
        }
    })
}

const asyncMapLimit = (imgs, dir, page) => {
    return new Promise(resolve => {
        node.mapLimit(
            imgs,
            options.downLimit,
            async function (img) {
                await downImage(img, dir, page)
                return img
            },
            err => {
                if (err) {
                    console.log(err)
                }
                resolve()
            }
        )
    })
}

var init = async () => {
    const successPage = []
    if (!options.totalPage) options.totalPage = options.endPage
    if (options.totalPage && !options.endPage) options.endPage = options.startPage + options.totalPage - 1
    for (let i = options.startPage; i <= options.endPage; i++) {
        console.log('======================'.yellow)
        const uri = options.uri + i
        console.log('开始下载页面：%s'.blue, uri)
        let total = 1
        let page
        let list
        while (total <= 5) {
            page = await getPage(uri, i)
            list = await parseList(page)
            if (list.imgList.length > 0) {
                total = 6
                successPage.push(i)
            } else total += 1
        }
        for (let j = 0; j < list.imgList.length; j++) {
            var item = list.imgList[j]
            await makeDir(item)
            // await writeText(item)
            var length = item.img.length
            console.log('开始下载图片, 总数：%s'.blue, length)
            await asyncMapLimit(item.img, item.user + '/' + item.id, list.page)
        }
    }
    console.log(successPage.join(','))
    console.log('抓取完成!'.green)
}

init()
// getMorePic('4574019242694869')
