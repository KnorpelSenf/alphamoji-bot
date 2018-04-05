module CSV
  (CSV(..), fromCSV)
where

-- Datentyp fuer Comma Separated Values:
data CSV a = CSV [[a]]

-- Instanz fuer Show:
instance Show a => Show (CSV a) where
  show (CSV xss) = unlines (map separate xss)
    where
      -- Zeilenformatierung:
      separate []     = ""
      separate [x]    = show x -- show-Aufruf fuer Elemente
      separate (x:xs) = show x ++ "," ++ separate xs


-- Instanz fuer Read:
instance Read a => Read (CSV a) where
  readsPrec p s = case s of
    ""      -> [ (CSV []          , "") ]
    '\n':s1 -> [ (CSV ([]:xs)     , s2)
                    | (CSV xs      , s2) <- readsPrec p s1 ]
    ',' :s1 -> [ (CSV ((x:xs):xss), s3)
                    | (x           , s2) <- readsPrec p s1 -- Parser fuer EIN Element
                    , (CSV (xs:xss), s3) <- readsPrec p s2 ] -- Parser fuer CSV
    _       -> [ (CSV ((x:xs):xss), s2)
                    | (x           , s1) <- readsPrec p s
                    , (CSV (xs:xss), s2) <- readsPrec p s1 ]

fromCSV :: CSV a -> [[a]]
fromCSV (CSV xss) = xss
