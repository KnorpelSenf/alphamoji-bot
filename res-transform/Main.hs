import Data.List
import Data.List.Split
import System.Environment
import System.IO

import Eanes(transform)

main = do
  emojione <- readFile "/home/steffen/Dokumente/emojione.csv"
  emojilib <- readFile "/home/steffen/Dokumente/emojilib.csv"
  konklone <- readFile "/home/steffen/Dokumente/konklone.csv"
  peterson <- readFile "/home/steffen/Dokumente/peterson.csv"
  emojidata <- readFile "/home/steffen/Dokumente/emojidata.csv"
  custom <- readFile "/home/steffen/Dokumente/custom.csv"
  unicode <- readFile "/home/steffen/Dokumente/unicode.txt"
  alphaNames <- readFile "/home/steffen/Dokumente/alpha_names.txt"
  writeFile "/home/steffen/Dokumente/emoji_debug.txt"
    . ('[' :)
    . (++ "]")
    . intercalate ","
    . map (\(u,a) -> ('{' : u ++ ", " ++ a ++ "}"))
    . zip (lines unicode)
    $ lines alphaNames
  writeFile "/home/steffen/Dokumente/emoji_res.csv"
    . transform (zip (lines unicode) (lines alphaNames))
    . map parseCSV
    $ [emojione,emojilib,konklone,peterson,emojidata,custom]

parseCSV :: String -> [[String]]
parseCSV = let esc = "~"
           in map (splitOn esc)
           . map (replaceUnquotedCommas esc)
           . lines
           . filter (/= '\r')

replaceUnquotedCommas :: String -> String -> String
replaceUnquotedCommas = ruc True
  where
    ruc :: Bool -> String -> String -> String
    ruc _    _   []       = []
    ruc mode rpl ('"':cs) = '"' : (ruc (not mode) rpl cs)
    ruc mode rpl (',':cs) = (if mode then rpl else ",") ++ (ruc mode rpl cs)
    ruc mode rpl (c:cs)   = c : (ruc mode rpl cs)

unparseCSV :: [[String]] -> String
unparseCSV = unlines
             . map (intercalate ",")
{-
m = do
  emojione <- readFile "/home/steffen/Dokumente/emojione.csv"
  emojilib <- readFile "/home/steffen/Dokumente/emojilib.csv"
  konklone <- readFile "/home/steffen/Dokumente/konklone.csv"
  peterson <- readFile "/home/steffen/Dokumente/peterson.csv"
  emojidata <- readFile "/home/steffen/Dokumente/emojidata.csv"
  custom <- readFile "/home/steffen/Dokumente/custom.csv"
  merged <- readFile "/home/steffen/Dokumente/merged.csv"
  print
    . take 5
    . parseCSV
    $ emojione
  print "-----"
  print
    . take 5
    . flip transform (parseCSV merged)
    . map parseCSV
    $ [emojione,emojilib,konklone,peterson,emojidata,custom]
  print "-----"
  print
    . unparseCSV
    . take 5
    . flip transform (parseCSV merged)
    . map parseCSV
    $ [emojione,emojilib,konklone,peterson,emojidata,custom]
-}
