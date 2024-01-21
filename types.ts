export interface CardlistInfo {
    containerid: string
    v_p: number
    total: number
    title_top: string
    show_style: number
    page: number
}

export interface Visible {
    type: number
    list_id: number
}

export interface Badge {
    bind_taobao: number
    unread_pool: number
    vip_activity2: number
    unread_pool_ext: number
    user_name_certificate: number
    qixi_2018: number
    weibo_display_fans: number
    relation_display: number
    hongbaofei_2019: number
    china_2019: number
    family_2019: number
    shuang11_2019: number
    hongbao_2020: number
    pc_new: number
    party_cardid_state: number
    aoyun_2021: number
    dailu_2021: number
    yingxionglianmengs11_2021: number
    hongbaofei2022_2021: number
    bddxrrdongaohui_2022: number
    biyeji_2022: number
    gaokao_2022: number
    hongrenjie_2022: number
    gaokao_2023: number
    yayunhuiguoqi_2023: number
    user_identity_auth: number
}

export interface User {
    id: number
    screen_name: string
    profile_image_url: string
    profile_url: string
    statuses_count: number
    verified: boolean
    verified_type: number
    verified_type_ext: number
    verified_reason: string
    close_blue_v: boolean
    description: string
    gender: string
    mbtype: number
    svip: number
    urank: number
    mbrank: number
    follow_me: boolean
    following: boolean
    follow_count: number
    followers_count: string
    followers_count_str: string
    cover_image_phone: string
    avatar_hd: string
    like: boolean
    like_me: boolean
    badge: Badge
    special_follow: boolean
}

export interface Bg_end {
    a: string
    b: string
    s: string
    h: string
}

export interface Bg_start {
    a: string
    b: string
    s: string
    h: string
}

export interface Card {
    a: string
    b: string
    s: string
    h: string
}

export interface Bg {
    bg_start_argb: string
    bg_end: Bg_end
    bg_start: Bg_start
    bg_end_argb: string
    card_argb: string
    card: Card
}

export interface E_sport_event {
    topic: string
    event_name: string
    bg: Bg
}

export interface Number_display_strategy {
    apply_scenario_flag: number
    display_text_min_number: number
    display_text: string
}

export interface Comment_manage_info {
    comment_permission_type: number
    approval_comment_type: number
    comment_sort_type: number
}

export interface Hot_page {
    fid: string
    feed_detail_type: number
}

export interface Page_pic {
    url: string
}

export interface Page_info {
    type: string
    object_type: number
    page_pic: Page_pic
    page_url: string
    page_title: string
    content1: string
    content2: string
}

export interface Geo {
    width: number
    height: number
    croped: boolean
}

export interface Geo {
    width: number
    height: number
    croped: boolean
}

export interface Large {
    size: string
    url: string
    geo: Geo
}

export interface Pic {
    pid: string
    url: string
    size: string
    geo: Geo
    large: Large
}

export interface Mblog {
    visible: Visible
    created_at: string
    id: string
    mid: string
    can_edit: boolean
    show_additional_indication: number
    text: string
    textLength: number
    source: string
    favorited: boolean
    pic_ids: string[]
    thumbnail_pic: string
    bmiddle_pic: string
    original_pic: string
    is_paid: boolean
    mblog_vip_type: number
    user: User
    picStatus: string
    reposts_count: number
    comments_count: number
    reprint_cmt_count: number
    attitudes_count: number
    pending_approval_count: number
    isLongText: boolean
    show_mlevel: number
    topic_id: string
    sync_mblog: boolean
    is_imported_topic: boolean
    darwin_tags: any[]
    ad_marked: boolean
    e_sport_event: E_sport_event
    mblogtype: number
    item_category: string
    cardid: string
    extern_safe: number
    number_display_strategy: Number_display_strategy
    content_auth: number
    safe_tags: number
    comment_manage_info: Comment_manage_info
    pic_num: number
    jump_type: number
    hot_page: Hot_page
    new_comment_style: number
    ab_switcher: number
    mlevel: number
    region_name: string
    region_opt: number
    page_info: Page_info
    pics: Pic[]
    bid: string
}

export interface Card {
    card_type: number
    itemid: string
    scheme: string
    mblog: Mblog
}

export interface Data {
    cardlistInfo: CardlistInfo
    cards: Card[]
    scheme: string
    showAppTips: number
    openApp: number
}

export interface RootObject {
    ok: number
    data: Data
}

export interface MorePicData {
    pids: string[]
}

export interface MorePic {
    code: string
    msg: string
    data: MorePicData
}
