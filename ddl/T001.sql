-- 入庫予定情報テーブル定義
CREATE TABLE T001(
    KIGYOCODE CHARACTER VARYING(17),                        -- 企業コード
    ITAKUMOTOSHUKKAMOTO CHARACTER VARYING(60) NOT NULL,     -- 委託元・出荷元
    SHOHINCODE CHARACTER VARYING(14) NOT NULL,              -- 商品コード
    HINBAN CHARACTER VARYING(25),                           -- 品番
    SUURYO CHARACTER VARYING(11),                           -- 数量
    TYAKUYOTEIBI CHARACTER VARYING(10),                     -- 着予定日
    BUNNOU1SUURYO CHARACTER VARYING(11),                    -- 分納１数量
    BUNNOU1TOUTYAKUYOTEIBI CHARACTER VARYING(10),           -- 分納１到着予定日
    BUNNOU2SUURYO CHARACTER VARYING(11),                    -- 分納２数量
    BUNNOU2TOUTYAKUYOTEIBI CHARACTER VARYING(10),           -- 分納２到着予定日
    BUNNOU3SUURYO CHARACTER VARYING(11),                    -- 分納３数量
    BUNNOU3TOUTYAKUYOTEIBI CHARACTER VARYING(10),           -- 分納３到着予定日
    TOUROKUKAISYA CHARACTER VARYING(24),                    -- 登録会社
    SANSYOKENGEN CHARACTER VARYING(250),                    -- 参照権限
    PRIMARY KEY (KIGYOCODE, HINBAN)
);