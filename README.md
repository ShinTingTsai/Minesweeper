# Minesweeper

經典遊戲 -- 踩地雷

## Features

+ 程式架構：MVC
  + model執行運算，由controller判斷什麼情況取用哪種資料，然後由view顯示出來。
  + 將Reset按鈕上的各種臉孔、程式提示訊息也都統一收到model。
  + 新增程式狀態(GameStatus)，view可以依據狀態顯示提示訊息

+ 初始地圖大小 10 x 10，地雷數 9。
  + 有計時器與地雷數顯示。

+ Customize按鈕：使用者可以自訂地圖大小與地雷數。
  + 但地圖限制一定是方形。
  + 地雷數公式：1 < x < (列數-1)＾2
  + 地雷數欄位也會依照地圖大小的數值，動態提示使用者可以設定地雷數的範圍是多少

+ Reset按鈕：讓遊戲回到剛開始。
  + 按鈕上的臉孔會隨著遊戲狀態（mousedown, mouseup, game over, success）改變

+ Debug Board按鈕：顯示上帝視角的地圖。顯示全地圖炸彈與周邊數字等資訊。
  + 當使用者第一次點擊時，如果踩到地雷，會隨機選取一個非地雷的區域互換。debug board也會同步更新互換後的資訊
  + 重複點擊Debug Board按鈕，可以顯示或隱藏Debug Board

+ Others
  + 第一次點擊一定不會踩到地雷
  + 點到空白格子時，展開周邊連續空白區域
  + 挑戰失敗時，畫面顯示：全部地雷與數字，醒目標示出被踩到的地雷
  + 挑戰成功時，畫面也顯示全部地雷與數字


Format Reference:
[markdown-it](https://markdown-it.github.io)
[Mastering Markdown](https://guides.github.com/features/mastering-markdown/)