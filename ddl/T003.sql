-- 事前納品通知情報（確定前）テーブル定義
CREATE TABLE T003(
    KIGYOCODE CHARACTER VARYING(17),                 -- 企業コード
    TENPOCODE CHARACTER VARYING(17) NOT NULL,        -- 店舗コード
    NYUKAYOTEIBI CHARACTER VARYING(8),               -- 入荷予定日
    SCMLABERU CHARACTER VARYING(23),                 -- SCMラベルNo
    SHOHINCODE CHARACTER VARYING(13) NOT NULL,       -- 商品コード
    HINBAN CHARACTER VARYING(16),                    -- 品番
    SUURYO CHARACTER VARYING(7),                     -- 数量
    TOUROKUKAISYA CHARACTER VARYING(24),             -- 登録会社
    SANSYOKENGEN CHARACTER VARYING(250),             -- 参照権限
    PRIMARY KEY (KIGYOCODE, NYUKAYOTEIBI, HINBAN)
);