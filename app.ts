import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import axios from 'axios'
import { mkdirp } from 'mkdirp'
import { mapLimit } from 'async'

import strip_tags from 'locutus/php/strings/strip_tags'

import colors from 'colors'

import type { MorePic, RootObject } from 'types'
import * as config from './config'

colors.setTheme({
    red: 'red',
    green: 'green',
    blue: 'blue',
    yellow: 'yellow',
})

const options = {
    uri: `https://m.weibo.cn/api/container/getIndex?containerid=${config.containerid}&page=`,
    headers: {
        'Referer': `https://m.weibo.cn/p/index?containerid=${config.containerid}`,
        'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        'Cookie': config.cookies,
        'X-Requested-With': 'XMLHttpRequest',
    },
    saveTo: './images',
    startPage: 1,
    // 39270-38910-38162-37532
    endPage: 36,

    downLimit: 5,
    totalPage: 0,
}

interface PageType {
    curPage: number
    uri: string
    html: RootObject
}

async function getPage(item: string, curPage: number): Promise<Nullable<PageType>> {
    const uri = item
    const rpOptions = {
        url: options.uri + curPage,
        headers: options.headers,
    }
    try {
        const { data } = await axios<RootObject>(rpOptions)
        console.log('下载页面成功：%s'.green, uri)
        return {
            curPage,
            uri,
            html: data,
        }
    }
    catch (err) {
        console.log(err)
    }
}

function getMorePic(mid: string): Promise<string[]> {
    const url = `https://weibo.com/aj/mblog/getover9pic?ajwvr=6&mid=${mid}&__rnd=${new Date().getTime()}`
    const rpOptions = {
        url,
        headers: {
            'Referer': 'https://weibo.com',
            'Cookie': config.webCookies,
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent':
                'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36',
        },
    }
    return axios<MorePic>(rpOptions)
        .then(({ data }) => {
            if (data.code === '100000')
                return data.data.pids

            return []
        })
        .catch(() => {
            return []
        })
}

interface ParseListItem {
    id: string
    img: string[]
    text: string
    user: string
}
interface ParseListType {
    page: number
    imgList: ParseListItem[]
}

async function parseList(page: PageType): Promise<ParseListType> {
    console.log('开始分析页面数据：%s'.blue, page.uri)
    const json = page.html
    const cards = json.data.cards
    const $return = []
    const length = cards.length
    for (let i = 0; i < length; i++) {
        const item = cards[i]
        const id = item.mblog.mid || item.mblog.id
        const img: string[] = []
        if (item.mblog.pics && item.mblog.pics.length > 0) {
            item.mblog.pics.forEach((jj) => {
                img.push(jj.large.url)
            })
            if (item.mblog.pic_num > 9) {
                const more = await getMorePic(id)
                if (more && more.length > 0) {
                    more.forEach((ss) => {
                        img.push(`https://wx4.sinaimg.cn/large/${ss}.jpg`)
                    })
                }
            }
            $return.push({
                id,
                img,
                text: item.mblog.text,
                user: item.mblog.user.screen_name,
            })
        }
    }
    return {
        page: page.curPage,
        imgList: $return,
    }
}

function makeDir(item: ParseListItem): Promise<ParseListItem> {
    return new Promise((resolve) => {
        const dir = path.join(options.saveTo, `${item.user}/${item.id}`)
        console.log('准备创建目录：%s'.blue, dir)
        if (item.img.length > 0) {
            if (fs.existsSync(dir)) {
                console.log('目录：%s 已经存在'.red, dir)
                resolve(item)
            }
            else {
                mkdirp(dir).then(() => {
                    console.log('目录：%s 创建成功'.green, dir)
                    resolve(item)
                })
            }
        }
        else {
            console.log('目录：%s 图片为空, 不创建'.red, dir)
            resolve(item)
        }
    })
}

// @ts-expect-error 111
function _writeText(item: ParseListItem) {
    const dir = path.join(options.saveTo, `${item.user}/${item.id}`)
    console.log('准备写入微博内容：%s'.blue, dir)
    fs.writeFileSync(`${dir}/content.txt`, strip_tags(item.text), { flag: 'w' })
    console.log('写入微博内容成功：%s'.green, dir)
}

async function downImage(imgsrc: string, dir: string, page: number) {
    const url = new URL(imgsrc)
    const fileName = path.basename(url.pathname)
    const toPath = path.join(options.saveTo, dir, fileName)
    console.log('开始下载图片：%s，保存到：%s，页数：%s / %s'.blue, fileName, dir, page, options.totalPage)
    if (fs.existsSync(toPath)) {
        console.log('图片已经存在：%s'.yellow, imgsrc)
    }
    else {
        try {
            const { data } = await axios({
                method: 'get',
                url: imgsrc,
                responseType: 'arraybuffer',
                timeout: 10000,
            })
            console.log('图片下载成功：%s'.green, imgsrc)
            await fs.promises.writeFile(toPath, data, 'binary')
            console.log('图片保存成功：%s'.yellow, fileName)
        }
        catch (error) {
            console.log('图片下载失败：%s'.red, imgsrc)
            await downImage(imgsrc, dir, page)
        }
    }
}

function asyncMapLimit(imgs: string[], dir: string, page: number): Promise<Nullable<string>> {
    return new Promise((resolve) => {
        mapLimit(
            imgs,
            options.downLimit,
            async (img: string) => {
                await downImage(img, dir, page)
                return img
            },
            (err) => {
                if (err)
                    console.log(err)

                resolve(null)
            },
        )
    })
}

async function init() {
    const successPage: number[] = []
    if (!options.totalPage)
        options.totalPage = options.endPage
    if (options.totalPage && !options.endPage)
        options.endPage = options.startPage + options.totalPage - 1
    for (let i = options.startPage; i <= options.endPage; i++) {
        console.log('======================'.yellow)
        const uri = options.uri + i
        console.log('开始下载页面：%s'.blue, uri)
        let total = 1
        let page: Nullable<PageType>
        let list: ParseListType = {
            page: 0,
            imgList: [],
        }
        while (total <= 5) {
            page = await getPage(uri, i)
            list = await parseList(page!)
            if (list.imgList.length > 0) {
                total = 6
                successPage.push(i)
            }
            else { total += 1 }
        }
        for (let j = 0; j < list.imgList.length; j++) {
            const item = list.imgList[j]
            await makeDir(item)
            // await writeText(item)
            const length = item.img.length
            console.log('开始下载图片, 总数：%s'.blue, length)
            await asyncMapLimit(item.img, `${item.user}/${item.id}`, list.page)
        }
    }
    console.log(successPage.join(','))
    console.log('抓取完成!'.green)
}

init()
// getMorePic('4574019242694869')
