const multer = require('multer');
const fs = require("fs");

let tools = {
    // ファイルアップロード機能
    multer() {
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'static/upload'); //アップロードファイルパス
            },
            //アップロードファイル名の設定
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        })

        var upload = multer({ storage: storage })

        return upload;
    },

    // 日付チェック機能
    chcekDate(strDate) {
        try {
            var y = strDate.substr(0, 4);
            var m = strDate.substr(4, 2);
            var d = strDate.substr(6);
            var date = new Date(y, m, d);
            if (date.getFullYear() != y || date.getMonth() != m || date.getDate() != d) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = tools