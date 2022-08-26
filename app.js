const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const fs = require('fs');
const rd = require("readline");
const bodyParser = require('body-parser');
const tools = require('./module/tools.js');
const msg = require('./module/message.js');
const db = require('./module/db.js');
const tc = require('./module/tablecolumn.js');
const multer = require('multer');
const get = require('https');
const app = express();
const pageSize = 20; // download画面の1ページの表示データ行数
const splitMark = "\t"; // tsvファイル分割符号

//session情報を設定
app.use(session({
    secret: 'secret',
    name: "fashion",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30,
        secure: false
    },
    rolling: true
}))

app.use(express.static("static")); // 配置ファイルのインポート
app.engine('html', ejs.__express); // ejs→htmlファイルに変更
app.set('view engine', 'html'); // htmlファイルのインポート
app.use(bodyParser.urlencoded({ extended: false })); // formデータ
app.use(bodyParser.json()); // JSONデータ

// 初期画面
app.get("/", (req, res) => {
    // ログインセッションの有無を確認する
    if (req.session.sessUserName) {
        // セッションがある場合、main画面へ遷移する
        res.render("main", {})
    } else {
        // セッションがない場合、login画面へ遷移する
        res.render("login", {
            msg: "",
            username: ""
        })
    }
})

// ログイン画面の「ログイン」ボタン
app.post("/doLogin", (req, res) => {
    console.log('doLoginをアクセスしました。');

    // ユーザとパスワードを取得
    var postData = req.body;
    var userName = postData.username;
    var password = postData.password;

    // sql作成
    var checkLoginSql = `select loginid from M001 as a where a.loginid ='${userName}' and a.loginpw ='${password}'`;

    try {
        (async () => {
            // DBコネクションとSQL実行
            var pool = db.pool;
            await pool.connect();
            const result = await pool.query(checkLoginSql);

            // データ取得できない場合
            if (result.rowCount == 0) {
                console.log("ログイン情報認証失敗");
                res.render("login", {
                    msg: msg.M0001,
                    username: userName
                });
                return;
            }

            // セッションの設定
            req.session.sessUserName = userName;
            res.render("main", {})
        })();
    } catch (error) {
        console.log("ログインが失敗しました");
        console.log(error);
        res.render("error", { msg: msg.M0011 })
    }
})

// メイン画面の「アップロード画面遷移」ボタン
app.get("/moveUploadPage", (req, res) => {
    req.session.sessUserName = "test";
    console.log('moveUploadPageをアクセスしました。');
    // ログインセッションの有無を確認する
    if (req.session.sessUserName) {
        // セッションがある場合、upload画面へ遷移する
        res.render("upload", { msg: "" })
    } else {
        // セッションがない場合、error画面へ遷移する
        res.render("error", { msg: msg.M0010 })
    }
})

// アップロード画面の「アップロードファイルフォルダ指定」ボタン
var cpUpload = tools.multer().fields([{ name: 'uploadFile', maxCount: 1 }])
app.post("/uploadFile", cpUpload, (req, res) => {
    console.log('uploadFileをアクセスしました。');
});

// アップロード画面の「実行」ボタン
app.post("/doUpload", (req, res) => {
    req.session.sessUserName = "test";
    console.log('doUploadをアクセスしました。');
    // ログインセッションの有無を確認する
    if (!req.session.sessUserName) {
        // セッションがない場合、error画面へ遷移する
        res.render("error", { msg: msg.M0010 });
        return;
    }
    // 画面入力データ取得
    var postData = req.body;
    var fileName = postData.uploadFileName;                // アップロードファイル名
    var filePath = "./static/upload/" + fileName;
    (async () => {
        try {
            // ファイルチェック
            if (fileName == "" || !fs.existsSync(filePath) || fileName.split("_").length < 2) {
                // エラー情報
                console.log("アップロードファイルを選択していない");
                res.render("upload", { msg: msg.M0003 });
                return;
            }
            console.log('アップロードファイル名：' + fileName);

            // ファイル名中のテーブル名と日付を取得
            var tableName = fileName.split("_")[0].toLowerCase();
            var fileDate = fileName.split("_")[1].toLowerCase().replace('.tsv', '');

            // 日付チェック
            if (!tools.chcekDate(fileDate)) {
                console.log("csvファイル名の日付が不正");
                res.render("upload", { msg: msg.M0003 });
                return;
            }

            // DBコネクションとSQL実行
            var pool = db.pool;
            await pool.connect();
            var checkTableNameSql = `select count(1) as count from pg_tables where tablename = '${tableName}'`;
            var tableNameResult = await pool.query(checkTableNameSql);
            if (tableNameResult.rows[0].count == 0) {
                console.log(`csvファイル名のテーブル名(${tableName})がDBに存在しません`);
                res.render("upload", { msg: msg.M0003 });
                return;
            }

            // csvデータ取得
            var allFileData = fs.readFileSync(filePath).toString();
            var fileData = [];
            if (allFileData.match('\r\n')) {  // 改行の確認
                fileData = allFileData.split('\r\n');
            } else {
                fileData = allFileData.split('\n');
            }

            // ファイルレコード数と指定テーブル項目数をチェック
            var getColumnsSql = `select count(column_name) as columncnt from information_schema.columns where table_name = '${tableName}'`;
            var getColumnsResult = await pool.query(getColumnsSql);
            var columnCnt = getColumnsResult.rows[0].columncnt;
            for (var i = 0; i < fileData.length; i++) {
                var lineString = fileData[i];
                // 最終行が空行の場合
                if (i == fileData.length - 1 && lineString.length == 0) {
                    break;
                };

                // 項目数チェック
                if (columnCnt != lineString.split(splitMark).length) {
                    var lineNo = i + 1;
                    console.log("ファイルレコード数と指定テーブル項目数が合わないです。行番号：" + lineNo);
                    res.render("upload", { msg: msg.M0004 });
                    return;
                }
            }

            // csvデータ更新処理
            for (var i = 0; i < fileData.length; i++) {
                var lineString = fileData[i];
                // 最終行が空行の場合
                if (i == fileData.length - 1 && lineString.length == 0) {
                    break;
                };

                var lineArray = lineString.split(splitMark); //1行データの解析

                // 既存データが存在するかチェック
                var searchCondition = getKeyCondition(tableName, lineArray);
                var checkeySql = `select count(1) as count from ${tableName} ${searchCondition}`;
                var keyResult = await pool.query(checkeySql);
                if (keyResult.rows[0].count == 0) { //存在しない、データ挿入
                    var insertSql = getInsertSql(tableName, lineArray); // insert文の取得
                    await pool.query(insertSql);
                } else {//存在する、データ更新
                    var updateSql = getUpdateSql(tableName, lineArray, searchCondition); // update文の取得
                    await pool.query(updateSql);
                }
            }

            res.render("upload", { msg: msg.M0005 });
            return;
        } catch (error) {
            console.log("csvデータ更新処理にエラーが発生しました");
            console.log(error);
            res.render("upload", { msg: msg.M0004 });
            return;
        } finally {
            fs.unlink(filePath, (err) => { });   // ファイル削除
        }
    })();
});

// 画面の「戻る」ボタン
app.get("/goback", (req, res) => {
    console.log('gobackをアクセスしました。');
    // ログインセッションの有無を確認する
    if (req.session.sessUserName) {
        // セッションがある場合、main画面へ遷移する
        res.render("main", {})
    } else {
        // セッションがない場合、error画面へ遷移する
        res.render("error", { msg: msg.M0010 })
    }
});

// メイン画面の「ダウンロード画面へ遷移」ボタン
app.get('/moveDownloadPage', function (req, res) {
    console.log('moveDownloadPageをアクセスしました。')
    // ログインセッションの有無を確認する
    if (req.session.sessUserName) {
        // セッションがある場合、download画面へ遷移する
        res.render("download", {
            orderNo: "",                                // 発注番号
            nyukayoteibi: "",                           // 出荷日
            tyakuyoteibi: "",                           // 着日
            kigyocode: "",                              // 企業コード 
            shohincode: "",                             // 商品コード
            hinban: "",                                 // 品番
            tenpocode: "",                              // 店舗コード
            itakumotoshukkamoto: "",                    // 出荷元
            deliveryAddress: "",                        // 納品先
            datalist: [],                               // 画面データ
            currentPage: 1,                             // 現在ページ
            page: 0,                                    // 総ページ数
            downloadMsg: "",                            // ダウンロード正常メッセージ
            downloadFlag: 0,                            // downloadファイル作成フラグ
            msg: ""
        })
    } else {
        // セッションがない場合、error画面へ遷移する
        res.render("error", { msg: msg.M0010 })
    }
});

// ダウンロード画面の「検索」ボタン
app.post('/doSearch', function (req, res) {
    console.log('doSearchをアクセスしました。');
    // ログインセッションの有無を確認する
    if (!req.session.sessUserName) {
        // セッションがない場合、error画面へ遷移する
        res.render("error", { msg: msg.M0010 });
        return;
    }

    // 画面入力データ取得
    var postData = req.body;
    var orderNo = postData.orderNo;                                       // 発注番号
    var nyukayoteibi = postData.nyukayoteibi;                             // 出荷日
    var tyakuyoteibi = postData.tyakuyoteibi;                             // 着日
    var kigyocode = postData.kigyocode;                                   // 企業コード 
    var shohincode = postData.shohincode;                                 // 商品コード
    var hinban = postData.hinban;                                         // 品番
    var tenpocode = postData.tenpocode;                                   // 店舗コード
    var itakumotoshukkamoto = postData.itakumotoshukkamoto;               // 出荷元
    var deliveryAddress = postData.deliveryAddress;                       // 納品先
    var currentPage = postData.index                                      // 現在ページ
    var index = (postData.index - 1) * pageSize;                          // SQLのOFFSET設定値
    var count = 0;                                                        // 画面表示データ件数
    var page = 0;                                                         // 総ページ数

    (async function () {
        try {
            // データ件数の取得
            var pool = db.pool;
            await pool.connect();
            var countSearchSql = "select count(1) count " + getSearchCondition(req);
            const countResult = await pool.query(countSearchSql);
            count = countResult.rows[0].count;
            page = Math.ceil(count / pageSize);

            // ダウンロードフラグの設定
            if (count > 0) {
                downloadFlag = 1;
            } else {
                downloadFlag = 0;
            }

            // データ件数検索-- 仕様未定
            var searchSql = "select ";
            searchSql += getColumn();
            searchSql += getSearchCondition(req);
            searchSql += ` LIMIT ${pageSize} OFFSET ${index}`;  // 指定ページのデータを取得

            const displayResult = await pool.query(searchSql);   // データ検索

            res.render("download", {
                orderNo: orderNo,                                // 発注番号
                nyukayoteibi: nyukayoteibi,                      // 出荷日
                tyakuyoteibi: tyakuyoteibi,                      // 着日
                kigyocode: kigyocode,                            // 企業コード 
                shohincode: shohincode,                          // 商品コード
                hinban: hinban,                                  // 品番
                tenpocode: tenpocode,                            // 店舗コード
                itakumotoshukkamoto: itakumotoshukkamoto,        // 出荷元
                deliveryAddress: deliveryAddress,                // 納品先
                datalist: displayResult.rows,                    // 画面表示データ
                currentPage: currentPage,                        // 現在ページ
                page: page,                                      // 総ページ数
                downloadFlag: downloadFlag,                      // downloadファイル作成フラグ
                downloadMsg: msg.M0009,                          // ダウンロード正常メッセージ
                msg: count + msg.M0007                           // 検索メッセージ
            });

        } catch (error) {
            // エラー情報
            console.log("ダウンロード画面はエラーが発生しました");
            console.log(error);
            res.render("error", { msg: msg.M0011 })
        }
    })();
});

// ダウンロード画面の「ダウンロード」ボタン
app.post('/download', (req, res) => {
    console.log('downloadをアクセスしました。');

    // 画面入力データ取得
    var postData = req.body;
    var orderNo = postData.orderNo;                                       // 発注番号
    var nyukayoteibi = postData.nyukayoteibi;                             // 出荷日
    var tyakuyoteibi = postData.tyakuyoteibi;                             // 着日
    var kigyocode = postData.kigyocode;                                   // 企業コード 
    var shohincode = postData.shohincode;                                 // 商品コード
    var hinban = postData.hinban;                                         // 品番
    var tenpocode = postData.tenpocode;                                   // 店舗コード
    var itakumotoshukkamoto = postData.itakumotoshukkamoto;               // 出荷元
    var deliveryAddress = postData.deliveryAddress;                       // 納品先
    var currentPage = postData.index                                      // 現在ページ
    var index = (postData.index - 1) * pageSize;                          // SQLのOFFSET設定値
    var page = 0;                                                         // 総ページ数
    var downloadFlag = postData.downloadFlag;                             // downloadファイル作成フラグ
    var date = new Date();
    var year = date.getFullYear();      // 年
    var month = date.getMonth() + 1;    // 月
    if (month < 10) {
        month = "0" + month;
    }
    var day = date.getDate();           // 日
    if (day < 10) {
        day = "0" + day;
    }
    var hour = date.getHours();         // 時
    if (hour < 10) {
        hour = "0" + hour;
    }
    var minutes = date.getMinutes();    // 分
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var seconds = date.getSeconds();    // 秒
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var nowDate = year + month + day + "_" + hour + minutes + seconds;
    var outputFilePath = "./static/output/download.tmp";               //出力ファイルパス

    (async function () {
        if (downloadFlag == "1") { //ファイル出力フラグ
            try {
                var pool = db.pool;
                await pool.connect();

                // ダウンロードデータ取得-- 仕様未定
                var searchSql = "select ";
                searchSql += getColumn();
                searchSql += getSearchCondition(req);

                const allDataResult = await pool.query(searchSql);
                var datalist = allDataResult.rows;
                page = Math.ceil(datalist.length / pageSize);

                // 画面データ表示
                var loopMax = 0;
                if (index + pageSize < datalist.length) {
                    loopMax = index + pageSize;
                } else {
                    loopMax = datalist.length;
                }
                var displayData = [];
                for (var i = index; i < loopMax; i++) {
                    displayData.push(datalist[i]);
                }

                // csvファイルデータの作成
                var line = "";
                for (var i = 0; i < datalist.length; i++) {
                    line += datalist[i].kigyocode + splitMark;
                    line += datalist[i].hinban + splitMark;
                    line += datalist[i].shohincode + splitMark;
                    line += datalist[i].color + splitMark;
                    line += datalist[i].size + splitMark;
                    line += datalist[i].nisugata + splitMark;
                    line += datalist[i].tenpocode + splitMark;
                    line += datalist[i].scmlaberu + splitMark;
                    line += datalist[i].dsuuryo + splitMark;
                    line += datalist[i].esuuryo + splitMark;
                    line += datalist[i].csuuryo + splitMark;
                    line += datalist[i].nyukayoteibi + splitMark;
                    line += datalist[i].tyakuyoteibi + splitMark;
                    line += datalist[i].bunnou1suuryo + splitMark;
                    line += datalist[i].bunnou1toutyakuyoteibi + splitMark;
                    line += datalist[i].bunnou2suuryo + splitMark;
                    line += datalist[i].bunnou2toutyakuyoteibi + splitMark;
                    line += datalist[i].bunnou3suuryo + splitMark;
                    line += datalist[i].bunnou3toutyakuyoteibi + splitMark;
                    line += datalist[i].tenpomei + splitMark;
                    line += datalist[i].area + splitMark;
                    line += datalist[i].areacode + splitMark;
                    line += datalist[i].yuubinbango + splitMark;
                    line += datalist[i].juusho + "\n";
                }

                // ファイル出力とダウンロード
                fs.writeFileSync(outputFilePath, line);
                res.download(outputFilePath, nowDate + '.tsv', function (err) {
                    fs.unlink(outputFilePath, (err) => { });   // ファイル削除
                });

            } catch (error) {
                // エラー情報
                console.log("ダウンロード画面はダウンロードエラーが発生しました");
                console.log(error);
                res.render("download", {
                    orderNo: orderNo,                                // 発注番号
                    nyukayoteibi: nyukayoteibi,                      // 出荷日
                    tyakuyoteibi: tyakuyoteibi,                      // 着日
                    kigyocode: kigyocode,                            // 企業コード 
                    shohincode: shohincode,                          // 商品コード
                    hinban: hinban,                                  // 品番
                    tenpocode: tenpocode,                            // 店舗コード
                    itakumotoshukkamoto: itakumotoshukkamoto,        // 出荷元
                    deliveryAddress: deliveryAddress,                // 納品先
                    datalist: displayData,                           // 画面表示データ
                    currentPage: currentPage,                        // 現在ページ
                    page: page,                                      // 総ページ数
                    downloadFlag: 1,                                 // downloadファイル作成フラグ
                    downloadMsg: msg.M0009,                          // ダウンロード正常メッセージ
                    msg: msg.M0008                                   // downloadメッセージ
                });
            }
        }

    })();
});

// ほかのURL
app.use((req, res, next) => {
    res.render("error", { msg: msg.M0011 });
})

app.listen(8080, () => {
    console.log('Server running at http://localhost:8080');
});

// 主キー情報の取得
function getKeyCondition(tableName, lineArray) {
    var keyInfo = eval("tc.keyinfo_" + tableName); // 定義ファイルのキー情報を取得

    // 検索条件の作成
    var searchCondition = " where ";
    for (var i = 0; i < keyInfo.length; i++) {
        searchCondition = searchCondition + keyInfo[i][0] + " = '" + lineArray[keyInfo[i][1]] + "'";
        if (i < keyInfo.length - 1) {
            searchCondition = searchCondition + " and ";
        }
    }
    return searchCondition;
}

// insertSQL文の取得
function getInsertSql(tableName, lineArray) {
    var columnInfo = eval("tc." + tableName); // 定義ファイルのカラム情報を取得

    // insertSQL文の作成
    var insertColumn = "";
    var insertData = "";
    for (var i = 0; i < columnInfo.length; i++) {
        insertColumn = insertColumn + columnInfo[i][0];
        insertData = insertData + "'" + lineArray[columnInfo[i][1]] + "'";
        if (i < columnInfo.length - 1) {
            insertColumn = insertColumn + ", ";
            insertData = insertData + ", ";
        }
    }
    var insertSql = `insert into ${tableName} (${insertColumn}) values (${insertData})`;
    return insertSql;
}

// updateSQL文の取得
function getUpdateSql(tableName, lineArray, searchCondition) {
    var columnInfo = eval("tc." + tableName); // 定義ファイルのカラム情報を取得

    // updateSQL文の作成
    var updateColumn = "";
    for (var i = 0; i < columnInfo.length; i++) {
        updateColumn = updateColumn + columnInfo[i][0] + "=" + "'" + lineArray[columnInfo[i][1]] + "'";

        if (i < columnInfo.length - 1) {
            updateColumn = updateColumn + ", ";
        }
    }
    var updateSql = `update ${tableName} set ${updateColumn} ${searchCondition}`;
    return updateSql;
}

// 検索項目の作成
function getColumn() {
    var getColumn = "a.kigyocode, ";
    getColumn += "a.shohincode, ";
    getColumn += "a.hinban, ";
    getColumn += "a.color, ";
    getColumn += "a.size, ";
    getColumn += "a.nisugata, ";
    getColumn += "e.tenpocode, ";
    getColumn += "e.scmlaberu, ";
    getColumn += "d.suuryo as dsuuryo, ";
    getColumn += "e.suuryo as esuuryo, ";
    getColumn += "c.suuryo as csuuryo, ";
    getColumn += "e.nyukayoteibi, ";
    getColumn += "c.tyakuyoteibi, ";
    getColumn += "c.bunnou1suuryo, ";
    getColumn += "c.bunnou1toutyakuyoteibi, ";
    getColumn += "c.bunnou2suuryo, ";
    getColumn += "c.bunnou2toutyakuyoteibi, ";
    getColumn += "c.bunnou3suuryo, ";
    getColumn += "c.bunnou3toutyakuyoteibi, ";
    getColumn += "b.tenpomei, ";
    getColumn += "b.area, ";
    getColumn += "b.areacode, ";
    getColumn += "b.yuubinbango, ";
    getColumn += "b.juusho ";
    return getColumn;
}

// 検索条件の作成
function getSearchCondition(req) {
    var postData = req.body;
    var nyukayoteibi = postData.nyukayoteibi;                             // 出荷日
    var tyakuyoteibi = postData.tyakuyoteibi;                             // 着日
    var kigyocode = postData.kigyocode;                                   // 企業コード 
    var shohincode = postData.shohincode;                                 // 商品コード
    var hinban = postData.hinban;                                         // 品番
    var tenpocode = postData.tenpocode;                                   // 店舗コード

    var searchSql = " from ";
    searchSql += "m002 as a, ";
    searchSql += "m003 as b, ";
    searchSql += "t001 as c, ";
    searchSql += "t002 as d, ";
    searchSql += "t003 as e ";
    searchSql += "where ";
    searchSql += "a.kigyocode = '" + kigyocode + "' and ";
    searchSql += "a.hinban = '" + hinban + "' and ";
    searchSql += "a.shohincode= '" + shohincode + "' or ";
    searchSql += "b.kigyocode = '" + kigyocode + "' and ";
    searchSql += "b.tenpocode = '" + tenpocode + "' or ";
    searchSql += "c.kigyocode = '" + kigyocode + "' and ";
    searchSql += "c.hinban = '" + hinban + "' and ";
    searchSql += "c.shohincode = '" + shohincode + "' and ";
    searchSql += "c.tyakuyoteibi = '" + tyakuyoteibi + "' and ";
    searchSql += "c.itakumotoshukkamoto = '" + tyakuyoteibi + "' or ";
    searchSql += "d.kigyocode = '" + kigyocode + "' and ";
    searchSql += "d.hinban = '" + hinban + "' and ";
    searchSql += "d.shohincode = '" + shohincode + "' and ";
    searchSql += "d.tenpocode = '" + tenpocode + "' or ";
    searchSql += "e.kigyocode = '" + kigyocode + "' and ";
    searchSql += "e.hinban = '" + hinban + "' and ";
    searchSql += "e.shohincode = '" + shohincode + "' and ";
    searchSql += "e.tenpocode = '" + tenpocode + "' and ";
    searchSql += "e.nyukayoteibi = '" + nyukayoteibi + "' ";
    return searchSql;
}