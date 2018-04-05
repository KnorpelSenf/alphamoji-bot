module Eanes
  (transform)
where

import Data.Char
import Data.List
import Data.List.Split
import Numeric (showHex)

transform :: [(String,String)] -> [[[String]]] -> String
transform mapping = ("{'data':[" ++)
                    . (++ "]}")
                    . unlines
                    . toJson
                    . applyMapping mapping
                    . process (snd . unzip $ mapping)
                    . prepare

prepare :: [[[String]]] -> [[[String]]]
prepare fs = let emojione  = fs !! 0
                 emojilib  = fs !! 1
                 konklone  = fs !! 2
                 peterson  = fs !! 3
                 emojidata = fs !! 4
                 custom    = fs !! 5
             in [tail emojione,tail emojilib,tail konklone,tail peterson,emojidata,custom]

process :: [String] -> [[[String]]] -> [[([String], [String])]]
process alphaNames fs = let emojione  = fs !! 0
                            emojilib  = fs !! 1
                            konklone  = fs !! 2
                            peterson  = fs !! 3
                            emojidata = fs !! 4
                            custom    = fs !! 5

                            -- unicode output name
                            uemojione  = map (\r -> ((r !! 3) : (splitOn "|" (r !! 4)), take 3 r)) emojione
                            -- (15 keywords) char fitzpatrick_scale category
                            uemojilib  = map (\r -> (map toAlphaName [r !! 0], drop 2 r)) emojilib
                            -- emoji desciption (4 tags) (35 emoticons)
                            ukonklone  = map (\r -> (map toAlphaName . take 3 . drop 2 $ r,(take 2 r) ++ (drop 6 r))) konklone
                            -- name-ja category unicode attribution alts/0 alts/1 url alto/0 emoticon contributor
                            upeterson  = map (\r -> (map toAlphaName [r !! 1],(r !! 0) : (take 10 . drop 2 $ r))) peterson
                            -- first column with unicode data
                            uemojidata = map (\r -> (map toAlphaName [r !! 1],[r !! 0])) emojidata
                            -- second column with alias data
                            ucustom    = map (\r -> (r,[])) custom
                            
                        in map (filter (not . null . fst))
                           . map (map (\(n,a) -> (filter (flip elem alphaNames) n,a)))
                           $ [uemojione,uemojilib,ukonklone,upeterson,uemojidata,ucustom]

applyMapping :: [(String, String)] -> [[([String], [String])]] -> [[(String, String, [String])]]
applyMapping m = map (applyMappingToFile m)
  where
    applyMappingToFile :: [(String, String)] -> [([String], [String])] -> [(String, String, [String])]
    applyMappingToFile m = map (applyMappingToRow m)
      where
        applyMappingToRow :: [(String, String)] -> ([String], [String]) -> (String, String, [String])
        applyMappingToRow []          _                  = error "unknown emoji"
        applyMappingToRow ((e,an):ls) r@(alphaName,atts) | an == alphaName = (e,an,atts)
                                                         | otherwise       = applyMappingToRow ls r

toJson :: [[(String, String, [String])]] -> [String]
toJson fs = let emojione  = fs !! 0
                emojilib  = fs !! 1
                konklone  = fs !! 2
                peterson  = fs !! 3
                emojidata = fs !! 4
                custom    = fs !! 5
                
                jemojione  = map toEmojioneJson emojione
                jemojilib  = map toEmojilibJson emojilib
                jkonklone  = map toKonkloneJson konklone
                jpeterson  = map toPetersonJson peterson
                jemojidata = map toEmojidataJson emojidata
                jcustom    = map toCustomJson custom
                
            in concat [jemojione,jemojilib,jkonklone,jpeterson,jemojidata,jcustom]
  where
    toEmojioneJson :: (String, String, [String]) -> String
    toEmojioneJson  row@(emoji,alphaName,atts) = let (unicode,moji) = stdParse emoji
                                                     description = stringify
                                                                   . init -- drop last newline
                                                                   . unlines
                                                                   . map (!! 2)
                                                                   . snd
                                                                   . unzip
                                                                   $ napairs
                                                 in buildJsonEntry alphaNames unicode moji description "" "" ""
    toEmojilibJson  row@(emoji,alphaName,atts) = let (unicode,moji) = stdParse emoji
                                                     tags           = take 15
                                                                      $ atts
                                                     fs             = atts !! 15
                                                     cat
                                                 in buildJsonEntry alphaName

    stdParse :: String -> (String, String)
    stdParse emoji = (unicodePoint emoji, stringify emoji)
    
    toKonkloneJson  = defaultParse
    toPetersonJson  = defaultParse
    toEmojidataJson = defaultParse
    toCustomJson    = defaultParse

    buildJsonEntry :: String -> String -> String -> String -> String -> String -> String -> String
    buildJsonEntry an uc em des tags fs cat = let a = "'alpha_names':" ++ an
                                                  u = "'unicode':" ++ uc
                                                  e = "'emoji':" ++ em
                                                  d | null des  = ""
                                                    | otherwise = "'description':" ++ des
                                                  t | null tags = ""
                                                    | otherwise = "'tags':" ++ tags
                                                  f | null fs   = ""
                                                    | otherwise = "'supports_skintone':" ++ fs
                                                  c | null cat  = ""
                                                    | otherwise = "'category:'" ++ cat
                                                  entries = intercalate ","
                                                            . ([a,u,e] ++)
                                                            . filter (not . null)
                                                            $ [d,t,f,c]
                                       in '{' : entries ++ "}"

    defaultParse (e,an,atts) = (e ++ " | as: ["
                                  ++ an
                                  ++ "], attributes: ["
                                  ++ (replace "," "~"
                                      . show
                                      . nub
                                      . concat
                                      . snd
                                      . unzip
                                      $ napairs)
                                  ++ "]")

toAlphaName :: String -> String
toAlphaName s = wrap ':' s

stringify :: String -> String
stringify = wrap '\''

wrap :: a -> [a] -> [a]
wrap x xs = x : xs ++ [x]

replace :: String -> String -> String -> String
replace old new s = intercalate new (splitOn old s)

col :: Eq a => Int -> [[a]] -> [a]
col n = map (!! n)
        . filter ((n <) . length)

unicodePoint :: String -> String
unicodePoint = intercalate "-"
               . map (("U+" ++)
                      . (map toUpper)
                      . flip showHex ""
                      . ord)


{-
expand :: [[[String]]] -> [[[String]]]
expand fs = let emojione  = fs !! 0
                emojilib  = fs !! 1
                konklone  = fs !! 2
                peterson  = fs !! 3
                emojidata = fs !! 4
                custom    = fs !! 5

                eemojione  = concatMap (\r -> take 3 r
                                              ++ ((r !! 3) : splitOn "|" (r !! 4))
                                              ++ drop 5 r) emojione
                             
            in 

cfilter :: [[[String]]] -> [[String]] -> [[[String]]]
cfilter fs merged = let emojione  = fs !! 0
                        emojilib  = fs !! 1
                        konklone  = fs !! 2
                        peterson  = fs !! 3
                        emojidata = fs !! 4
                        custom    = fs !! 5
                        
                        alphaNames = col 6 merged
                        names = map (init . tail) alphaNames
                        
                        femojione  = filter (\r -> (r !! 3) `elem` alphaNames
                                              || (any (flip elem alphaNames)
                                                  . splitOn "|"
                                                  . (!! 4)
                                                  $ r)) emojione
                        femojilib  = filter (\r -> (r !! 0) `elem` names) emojilib
                        fkonklone  = filter (\r -> (r !! 0) `elem` names
                                              || (r !! 1) `elem` names
                                              || (r !! 2) `elem` names) konklone
                        fpeterson  = filter (\r -> (r !! 1) `elem` names) peterson
                        femojidata = filter (\r -> ((r !! 0) `elem` names)
                                              || (flip elem names
                                                  . replace "-" "_"
                                                  . replace "/" "_"
                                                  . (!! 1)
                                                  $ r)
                                              || (any (flip elem names)
                                                  . splitOn "/"
                                                  . (!! 0)
                                                  $ r)) emojidata
                        fcustom = custom
                        
                    in [femojione,femojilib,fkonklone,fpeterson,femojidata,fcustom]
-}
{-
expand :: [[([String], [String])]] -> [[(String, [String])]]
expand = map expandFile
  where
    expandFile :: [([String], [String])] -> [(String, [String])]
    expandFile = concatMap expandRow
      where
        expandRow :: ([String], [String]) -> [(String, [String])]
        expandRow (n,a) = map (\s -> (s, a)) n
-}
{-
nubByUnicode :: [[(String, String, [String])]] -> [[(String, [(String, [String])])]]
nubByUnicode = map nubFileByUnicode
  where
    nubFileByUnicode :: [(String, String, [String])] -> [(String, [(String, [String])])]
    nubFileByUnicode []                     = []
    nubFileByUnicode ((unic,aName,atts):ls) = let entries = (aName, atts) : (map tail3
                                                                             . filter (\(u,_,_) -> u == unic)
                                                                             $ ls)
                                                  new = (unic, entries)
                                                  rest = nubFileByUnicode
                                                         . filter (\(u,_,_) -> u /= unic)
                                                         $ ls
                                              in new : rest
    
    tail3 (_,x,y) = (x,y)
-}
