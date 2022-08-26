-- 商品マスタテーブル定義
CREATE TABLE M002(
    KIGYOCODE CHARACTER VARYING(13),                -- 企業コード
    SHOHINCODE CHARACTER VARYING(14) NOT NULL,      -- 商品コード
    HINBAN CHARACTER VARYING(20),                   -- 品番
    COLOR CHARACTER VARYING(3),                     -- カラー
    SIZE CHARACTER VARYING(2),                      -- サイズ
    NISUGATA CHARACTER VARYING(3),                  -- 荷姿
    TOUROKUKAISYA CHARACTER VARYING(24),            -- 登録会社
    SANSYOKENGEN CHARACTER VARYING(250),            -- 参照権限
    PRIMARY KEY (KIGYOCODE, HINBAN)
);