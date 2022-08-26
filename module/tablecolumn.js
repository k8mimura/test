// 定義方法：テーブルカラムID, アップロードファイルのindex
module.exports = {
    // 商品マスタのカラム情報とキー情報
    m002: [["kigyocode", 0], ["shohincode", 1], ["hinban", 2], ["color", 3], ["size", 4], ["nisugata", 5], ["tourokukaisya", 6], ["sansyokengen", 7]],
    keyinfo_m002: [["kigyocode", 0], ["hinban", 2]],
    // 事業所マスタのカラム情報とキー情報
    m003: [["kigyocode", 0], ["tenpocode", 1], ["tenpomei", 2], ["area", 3], ["areacode", 4], ["yuubinbango", 5], ["juusho", 6], ["tourokukaisya", 7], ["sansyokengen", 8]],
    keyinfo_m003: [["kigyocode", 0], ["tenpomei", 2]],
    // 入庫予定情報のカラム情報とキー情報
    t001: [["kigyocode", 0], ["itakumotoshukkamoto", 1], ["shohincode", 2], ["hinban", 3], ["suuryo", 4], ["tyakuyoteibi", 5], ["bunnou1suuryo", 6], ["bunnou1toutyakuyoteibi", 7], ["bunnou2suuryo", 8], ["bunnou2toutyakuyoteibi", 9], ["bunnou3suuryo", 10], ["bunnou3toutyakuyoteibi", 11], ["tourokukaisya", 12], ["sansyokengen", 13]],
    keyinfo_t001: [["kigyocode", 0], ["hinban", 3]],
    // 出荷依頼情報のカラム情報とキー情報
    t002: [["KIGYOCODE", 0], ["TENPOCODE", 1], ["SHOHINCODE", 2], ["HINBAN", 3], ["SUURYO", 4], ["TOUROKUKAISYA", 5], ["SANSYOKENGEN", 6]],
    keyinfo_t002: [["kigyocode", 0], ["hinban", 3]],
    // 事前納品通知情報（確定前）のカラム情報とキー情報
    t003: [["kigyocode", 0], ["tenpocode", 1], ["nyukayoteibi", 2], ["scmlaberu", 3], ["shohincode", 4], ["hinban", 5], ["suuryo", 6], ["tourokukaisya", 7], ["sansyokengen", 8]],
    keyinfo_t003: [["kigyocode", 0], ["nyukayoteibi", 2], ["hinban", 5]],
};