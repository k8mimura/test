-- 出荷依頼情報テーブル定義
CREATE TABLE T002(
    KIGYOCODE CHARACTER VARYING(17),                     -- 企業コード
    TENPOCODE CHARACTER VARYING(17) NOT NULL,            -- 店舗コード
    SHOHINCODE CHARACTER VARYING(14) NOT NULL,           -- 商品コード
    HINBAN CHARACTER VARYING(25),                        -- 品番
    SUURYO CHARACTER VARYING(9),                         -- 数量
    TOUROKUKAISYA CHARACTER VARYING(24),                 -- 登録会社
    SANSYOKENGEN CHARACTER VARYING(250),                 -- 参照権限
    PRIMARY KEY (KIGYOCODE, HINBAN)
);