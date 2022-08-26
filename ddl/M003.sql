-- 事業所マスタテーブル定義
CREATE TABLE M003(
    KIGYOCODE CHARACTER VARYING(13),            -- 企業コード
    TENPOCODE CHARACTER VARYING(16),            -- 店舗コード
    TENPOMEI CHARACTER VARYING(40) NOT NULL,    -- 店舗名
    AREA CHARACTER VARYING(50),                 -- エリア
    AREACODE CHARACTER VARYING(6),              -- エリアコード
    YUUBINBANGO CHARACTER VARYING(10) NOT NULL, -- 郵便番号
    JUUSHO CHARACTER VARYING(100) NOT NULL,     -- 住所
    TOUROKUKAISYA CHARACTER VARYING(24),        -- 登録会社
    SANSYOKENGEN CHARACTER VARYING(250),        -- 参照権限
    PRIMARY KEY (KIGYOCODE, TENPOCODE)
);