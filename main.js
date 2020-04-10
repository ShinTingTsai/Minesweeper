const gameStatus = {
  firstPressAwaits: 'firstPressAwaits',
  secondPressAwaits: 'secondPressAwaits',
  gameFailed: 'gameFailed',
  gameFinished: 'gameFinished'
}

const view = {
  getBoardElement(fieldIdx) {
    return ` <div class="field" id='${fieldIdx}' data-target="#boardBottom" data-id="${fieldIdx}"></div>`
  },
  /**
   * displayFields()
   * 顯示踩地雷的遊戲版圖在畫面上，
   * 輸入的 rows 是指版圖的行列數。
   */
  displayFields(rows) {
    document.querySelector('#boardBottom').innerHTML = rows.map(index => view.getBoardElement(index)).join('')
    const boardWidth = (model.numberOfRows * 30) + 16
    $('.board').css({ width: boardWidth})
    if (boardWidth <= 160) $('.boardTop').css({width: '160px'})
  },
  /**
   * showFieldContent()
   * 更改單一格子的內容，像是顯示數字、地雷，或是海洋。
   */
  showFieldContent(fieldIdx) {
    const field = controller.getFieldData(fieldIdx)
    let fieldHtml = document.getElementById(fieldIdx)
    fieldHtml.innerHTML = (field.type === "mine") ? `<i class="fas fa-bomb"></i>` : `${field.number}`
    fieldHtml.classList.add('digged')
    field.isDigged = true
    if (field.type === "mine") fieldHtml.classList.add('mine')
  },
  /**
   * renderTime()
   * 顯示經過的遊戲時間在畫面上。
   */
  renderTime(time) {
    if (time > 999) time = 999
    let timeString = time.toString()
    for (let i = 3; i > time.toString().length; i--) timeString = "0" + timeString
    let timer = document.getElementById('timer')
    timer.innerHTML = `${timeString}`
  },
  renderMineCount(number) {
    let restMines = ""
    if (number < 0) {
      number = Math.abs(number)
      if (number > 99) number = 99
      restMines = number.toString()
      for (let i = 2; i > number.toString().length; i--) restMines = "0" + restMines
      restMines = "-" + restMines
    } else {
      restMines = number.toString()
      for (let i = 3; i > number.toString().length; i--) restMines = "0" + restMines
    }
    let restMineCount = document.getElementById('restMineCount')
    restMineCount.innerHTML = `${restMines}`
  },
  /**
   * showBoard()
   * 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
   */
  showBoard(fieldNum) {
    const diggedField = controller.getFieldData(fieldNum)
    if (diggedField.type !== "mine") fieldNum = ""

    model.fields.forEach (field => {
      // 踩到地雷而結束遊戲時，被踩到的地雷背景為紅色，這部分不動
      if (field.fieldIdx === fieldNum) return;
      
      let fieldHtml = document.getElementById(field.fieldIdx)
      fieldHtml.innerHTML = (field.type === "mine") ? `<i class="fas fa-bomb"></i>` : `${field.number}`
      if (!field.isDigged) {
        fieldHtml.classList.add('digged')
        field.isDigged = true
      }
    })
  },
  /** Debug Board */
  displayDebugBoard(debugBoard) {
    let debugBoardHtml = ""
    let content = ""
    for (i = 0; i < model.fields.length; i++) {
      content = (isNaN(model.fields[i].number)) ? `<i class="fas fa-bomb"></i>` : `${ model.fields[i].number }`
      debugBoardHtml += ` <div class="field" >${content}</div>`
    }
    debugBoard.innerHTML = debugBoardHtml
  },
  /** Show message for fail or success the challenge */
  showMessage(message){
    if (message === undefined) {
      switch (model.currentStatus) {
        case 'gameFinished':
          message = model.messages[model.currentStatus]
          break
        case 'gameFailed':
          message = model.messages[model.currentStatus]
          break
        default:
          break
      }
    } 
    alert(message)
  },
  /** Hind selected flag and return false */
  removeFlag(target){
    target.parentNode.removeChild(target.parentNode.childNodes[0])
    return false
  },
  /** Put flag on the board and return true */
  showFlag(target){
    target.innerHTML = `<i class="fas fa-flag" data-id="${target.dataset.id}"></i>`
    return true
  },
  /** show/hind debug board */
  toggleDebugBoard(debugBoard) {  
    debugBoard.style.display = (debugBoard.style.display === "none") ? "flex" : "none"
  },
  setFace(currentStatus) {
    document.getElementById('face').innerHTML = (currentStatus === undefined) ? model.emojis[model.currentStatus] : model.emojis[currentStatus]
  },
  setModalPlaceholder() {
    $("#numOfMines").focus(function() {
      let numberOfRows = document.getElementById("numOfRows").value
      numberOfRows = Number(numberOfRows)
      if (numberOfRows !== 0) {
        let maxMineNum = Math.pow(numberOfRows - 1, 2)
        if (maxMineNum < 2) maxMineNum = 2
        this.setAttribute("placeholder", `2 ~ ${maxMineNum - 1}`);
        this.readOnly = false
      }
    }).blur(function() {
      if (!$("#numOfMines").val()) {
        this.setAttribute("placeholder", "請先輸入Rows");
        this.readOnly = true
      }
    })
  }
};

const controller = {
  /**
   * createGame()
   * 根據參數決定遊戲版圖的行列數，以及地雷的數量，
   * 一定要做的事情有：
   *   1. 顯示遊戲畫面
   *   2. 遊戲計時
   *   3. 埋地雷
   *   4. 綁定事件監聽器到格子上
   */
  createGame(numberOfRows, numberOfMines) {
    this.setGame(numberOfRows, numberOfMines)
    // setup buttons
    this.setToggleDebugBtn()
    this.setResetBtn()
    this.setCustomizeBtn()
    this.setDefaultBtn()
    view.setModalPlaceholder()
    document.oncontextmenu = function () { return false; };
  },
  setGame(numberOfRows, numberOfMines) {
    model.currentStatus = gameStatus.firstPressAwaits  
    model.numberOfRows = numberOfRows
    model.numberOfMines = numberOfMines
    // 1. 顯示遊戲畫面
    const rows = utility.getRandomNumberArray(Math.pow(model.numberOfRows, 2))
    view.displayFields(rows)
    view.setFace()
    // 2. 遊戲計時
    clearInterval(model.timerID)
    view.renderTime(model.time = 0)
    // 3. 埋地雷 (先全部設定成ocean, 再填入mine, 最後計算number)
    model.initFields(rows)
    this.setMinesAndFields(model.numberOfMines)
    model.setRestMineCount()
    // 4. 綁定事件監聽器到格子上
    this.setClick()
    //Reset debug board
    this.setDebugBoard()
  },
  setDefaultBtn() {
    document.getElementById('toDefault').addEventListener('click', event => {
      event.preventDefault();
      this.setGame(model.defaultSettings.rows, model.defaultSettings.mines)
    })
  },
  setCustomizeBtn() {
    document.getElementById("customizeBtn").addEventListener("click", event => {
      event.preventDefault();
      let numberOfRows = document.getElementById("numOfRows").value
      let numberOfMines = document.getElementById("numOfMines").value
      numberOfRows = Number(numberOfRows)
      numberOfMines = Number(numberOfMines)
      //檢查輸入的值是否為正整數
      let result = utility.checkInt(numberOfRows) && utility.checkInt(numberOfMines)
      if (!result) {
        view.showMessage(model.showMessage.checkInt)
        return;
      }
      //Row的最小值應為3
      if (numberOfRows < 3) {
        numberOfRows = 3
        view.showMessage(model.messages.checkRowNum)
        return;
      }
      //檢查地雷數
      result = model.checkMineNumber(numberOfRows, numberOfMines)
      if (result !== "true") {
        view.showMessage(result)
        return;
      } else {
        this.setGame(numberOfRows, numberOfMines)
      }
    })
  },
  setResetBtn() {
    const resetBtn = document.querySelector('.reset')
    resetBtn.addEventListener('click', (event) => {
      this.setGame(model.numberOfRows, model.numberOfMines)
    })
  },
  /** Set (1) left click for dig; (2) right click for put/hind flag*/
  setClick() {
    const boardBottom = document.getElementById('boardBottom')
    boardBottom.addEventListener('click', (event) => {
      const field = this.getFieldData(Number(event.target.dataset.id))
      /** set left click event listener */
      if (field.isDigged === true || field.isFlag === true) return;
      this.dig(field)
    })
    boardBottom.addEventListener('contextmenu', () => {
      const field = this.getFieldData(Number(event.target.dataset.id))
      if (field.isDigged) return;
      field.isFlag = (field.isFlag) ? view.removeFlag(event.target) : view.showFlag(event.target)
      model.setRestMineCount()
    })
    boardBottom.addEventListener('mousedown', () => view.setFace("scream"))
    boardBottom.addEventListener('mouseup', () => view.setFace())
  },
  /** Set Debug board for show hind mines and numbers */
  setDebugBoard() {
    const debugBoard = document.getElementById("debugBoard")
    view.displayDebugBoard(debugBoard);
  },
  setToggleDebugBtn(){
    const debugBoard = document.getElementById("debugBoard")
    document.getElementById("debugBtn").addEventListener("click", () => view.toggleDebugBoard(debugBoard))
  },
  /**
   * setMinesAndFields()
   * 設定格子的內容，以及產生地雷的編號。
   */
  setMinesAndFields(numberOfMines) {
    model.mines.length = 0
    for (i = 0; i < numberOfMines; i++) {
      let mine = this.getFieldData(i)
      //update model.mines
      model.mines.push(mine.position)
      //update model.fields
      mine.type = "mine"
      mine.number = NaN
      //update 地雷周邊數字
      const surroundIndexes = utility.getSurroundIndex(mine.position, model.numberOfRows)
      model.updateNum(surroundIndexes)
    }
  },
  /**
   * getFieldData()
   * 取得單一格子的內容，決定這個格子是海洋還是號碼，
   * 如果是號碼的話，要算出這個號碼是幾號。
   * （計算周圍地雷的數量）
   */
  getFieldData(fieldIdx) {
    return model.fields.find(field => field.fieldIdx === fieldIdx)
  },
  /**
   * dig()
   * 使用者挖格子時要執行的函式，
   * 會根據挖下的格子內容不同，執行不同的動作，
   * 如果是號碼或海洋 => 顯示格子
   * 如果是地雷      => 遊戲結束
   */
  dig(field) {
    const position = field.position
    //第一次不踩雷
    if (model.currentStatus === gameStatus.firstPressAwaits) {
      if (model.isMine(position)) {
        model.switchMine(field)
        this.setDebugBoard()
      }
      model.setTimer()
    } 
    // 開啟格子
    view.showFieldContent(field.fieldIdx)
    switch (field.type) {
      case "ocean":
        this.spreadOcean(field)
        model.currentStatus = (this.isFinished()) ? gameStatus.gameFinished : gameStatus.secondPressAwaits
        break
      case "mine":
        model.currentStatus = gameStatus.gameFailed
        break
      default:
        model.currentStatus = (this.isFinished()) ? gameStatus.gameFinished : gameStatus.secondPressAwaits
        break
    }
    // 檢查是否結束遊戲
    if (model.currentStatus === gameStatus.gameFailed || model.currentStatus === gameStatus.gameFinished) this.gameClose(field)
  },
  isFinished(){
    const nonMineFields = model.fields.filter(field => field.type !== "mine")
    const result = nonMineFields.every(field => field.isDigged === true)
    return result
  },
  gameClose(field){
    clearInterval(model.timerID)
    view.showBoard(field.fieldIdx)
    view.showMessage()
    document.getElementById('face').innerHTML = model.emojis[model.currentStatus] 
  },
  spreadOcean(field) {
    const surroundIndexes = utility.getSurroundIndex(field.position, model.numberOfRows)
    surroundIndexes.forEach(value => {
      const surroundField = this.getFieldData(value)
      //插旗子的格子、已挖過的格子不處理
      if (!surroundField.isFlag && !surroundField.isDigged) {
        view.showFieldContent(value) 
        if (surroundField.type === "ocean") this.spreadOcean(surroundField)
      }
    })
  }
};

const model = {
  currentStatus: 'firstPressAwaits',
  defaultSettings: {rows: 9, mines: 10},
  /**
   * mines
   * 存放地雷的編號（第幾個格子）
   */
  mines: [],
  /**
   * fields
   * 存放格子內容
   * {
   *  "position": position, default: 1 ~ 81
   *  "fieldIdx" : index, default: 0 ~ 80
   *  "type" : "ocean", 
   *  "number" : "",
   *  "isDigged": false,
   *  "isFlag": false
   * }
   */
  fields: [],
  numberOfRows: 9,
  numberOfMines: 10,
  time: 0,
  timerID: 0,
  messages: {
    checkInt: 'Please type in the positive integer.',
    checkMineNum: 'Bombs should be set up between 2 and ',
    checkRowNum: 'Rows should be more than 2',
    gameFinished: 'Congratulations, You win the game!',
    gameFailed: 'Oh, here is a mine, you lose!'
  },
  /** 初始化 Model.Fields */
  initFields(rows) {
    this.fields.length = 0
    rows.forEach((value, index) => {
      const field = {
        position: index + 1,
        fieldIdx: value,
        type: "ocean",
        number: "",
        isDigged: false,
        isFlag: false
      }
      this.fields.push(field)
    })
  },
  /**
   * isMine()
   * 輸入一個格子編號，並檢查這個編號是否是地雷
   */
  isMine(position) {
    return this.mines.includes(position);
  },
  switchMine(field) {
    const tempFields = model.fields.filter(item => item.type !== "mine")
    const randomIndex = Math.floor(Math.random() * tempFields.length);
    let newField = tempFields[randomIndex]
      ;[field['type'], newField['type']] = [newField['type'], field['type']]
      ;[field['number'], newField['number']] = [newField['number'], field['number']]
        // * "isDigged": false, --> 第一次一定沒有挖過
        // * "isFlag": false --> 旗子跟著位置走 不用換
    //update number (舊地雷的周邊數字減1)
    let surroundIndexes = utility.getSurroundIndex(field.position, model.numberOfRows)
    let surroundMineCount = 0
    surroundIndexes.forEach(value => {
      let surroundField = controller.getFieldData(value)
      if (surroundField.type === "mine") {
        surroundMineCount++
        return;
      } 
      surroundField.number--
      if (surroundField.number === 0) {
        surroundField.type = "ocean"
        surroundField.number = ""
      }
    })
    //update number (新地雷的周邊數字加1)
    surroundIndexes = utility.getSurroundIndex(newField.position, model.numberOfRows)
    model.updateNum(surroundIndexes)
    //update number (舊地雷原本的位置)
    if (surroundMineCount === 0) {
      field.type = "ocean"
      field.number = ""
    } else {
      field.type = "number"
      field.number = surroundMineCount
    }
    //update model.mines
    const oldPosition = model.mines.indexOf(field.position)
    model.mines[oldPosition] = newField.position
  },
  /** 如果不是地雷，更新該顯示的數字 */
  updateNum(surroundIndexes) {
    surroundIndexes.forEach(value => {
      let surroundField = controller.getFieldData(value)
      if (surroundField.type === "mine") return;
      surroundField.type = "number"
      surroundField.number++
    })
  },
  emojis: {
    "firstPressAwaits": "🙂",
    "secondPressAwaits": "🙂",
    "gameFailed": "😵",
    "scream": "😱",
    "surprise": "😮",
    "gameFinished": "😎",
  },
  /** 檢查地雷數量
   * role: 1 < 地雷數 < (列數-1)^2
   */
  checkMineNumber(numberOfRows, numberOfMines) {
    const maxMineNum = Math.pow(numberOfRows - 1, 2)
    const message = `${this.messages.checkMineNum}${maxMineNum-1}`
    if (numberOfMines > 1 && numberOfMines < maxMineNum) {
      return "true";
    } else {
      return message;
    }
  },
  setTimer() {
    this.timerID = setInterval(() => {
      this.time += 1
      view.renderTime(this.time)
    }, 1000)
  },
  setRestMineCount() {
    const flagCount = model.fields.filter(field => field.isFlag === true).length
    const mineCount = model.mines.length
    view.renderMineCount(mineCount - flagCount)
  },
};

const utility = {
  /**
   * getRandomNumberArray()
   * 取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列。
   * 例如：
   *   getRandomNumberArray(4)
   *     - [3, 0, 1, 2]
   */
  getRandomNumberArray(count) {
    const number = [...Array(count).keys()];
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index]
      ];
    }
    return number;
  },
  /**輸入一個位置(地雷)，算出周邊位置的編號，同時排除邊界不需納入計算的編號 */
  getSurroundIndex(position, numberOfRows){
    const positions = {
      top_left: position - numberOfRows - 1, 
      top_center: position - numberOfRows, 
      top_right: position - numberOfRows + 1,
      left: position - 1, 
      right: position + 1,
      bottom_left: position + numberOfRows - 1, 
      bottom_center: position + numberOfRows, 
      bottom_right: position + numberOfRows + 1
    }
    //當position位於上邊界
    if (position <= numberOfRows) {
      delete positions.top_right 
      delete positions.top_center
      delete positions.top_left
    }
    //當position位於下邊界
    // let bottomNum = Math.pow(numberOfRows, 2) - numberOfRows
    if (position > Math.pow(numberOfRows, 2) - numberOfRows) {
      delete positions.bottom_left
      delete positions.bottom_center
      delete positions.bottom_right
    }
    //當position位於右邊界
    if (position % numberOfRows === 0) {
      delete positions.top_right
      delete positions.right
      delete positions.bottom_right
    }
    //當position位於左邊界
    if (position % numberOfRows === 1) {
      delete positions.top_left
      delete positions.left
      delete positions.bottom_left
    }
    // use position to get randomNum of each field
    const surroundIndexes = Object.values(positions).map(value => {
      return model.fields.find(field => field.position === value).fieldIdx
    })
    return surroundIndexes
  },
  
  checkInt(input) {
    if (/^(\-|\+)?([0-9]+)$/.test(input)) {
      let num = Number(input)
      if (num >= 0 && num <= 255) {
        return true
      } else return false
    } else return false;
  }
  
};

controller.createGame(9, 10);






/**
 * 待開發功能：
 * modal介面美化：rows的大小用拉霸、地雷數量可輸入 (done)
 * 事件委派
 * 
 * Bug:第一次不踩雷，數量計算有誤，有時會出現踩雷圖示 (done)
 * reset按鈕 (done)
 * 介面美化  (done)
 * 第一次不會踩到地雷 (done)
 * timer start after first press (done)
 * 連續展開空白區域 (done)
 * 功能：自訂行列數 : 美化介面 (done)
 * 功能：自訂地雷數 : 數量規則 (done)
 * change face (done)
 * show message in one function (done)
 * check async await
 * 
 * 
 * 
 * 
 * 
 * 
 * ref from web: 
 * http://wp.mlab.tw/?p=375
 * https://medium.com/alpha-camp-台灣/用-react-重現經典踩地雷-8ae7989671c6
 * https://github.com/ShizukuIchi/minesweeper
 * https://ithelp.ithome.com.tw/users/20091910/ironman/2579?page=1
 * https://a7069810.pixnet.net/blog/post/393527578
 * https://www.cnblogs.com/cccj/p/8659838.html
 * [best] https://www.cnblogs.com/kilomChou/p/10652405.html
 * https://jsfiddle.net/zinzin/Y4aHU/
 * https://codepen.io/bali_balo/pen/BLJONk?editors=1100
 * 
 * ref from GitHub
 * https://github.com/Joeynoh/HTML5-Minesweeper
 * https://github.com/dev-academy-challenges/minesweeper
 * https://github.com/APCSLowell/Minesweeper
 * https://gist.github.com/noorxbyte/747bed70ec921fa06813
 * https://github.com/muan/emoji-minesweeper/blob/gh-pages/index.html
 * 
 * http://jsgears.com/thread-2304-1-1.html
 * 邏輯運算子 || (OR) 跟 &&(AND) 的傳回值不只是true
 * 
 * CSS
 * https://www.oxxostudio.tw/articles/201501/css-flexbox.html
 * https://wcc723.github.io/css/2017/07/21/css-flex/
 * 
 * EMOJI CSS (good)
 * https://emoji-css.afeld.me
 * 
 * Face from Font awesome
 * https://fontawesome.com/icons/smile?style=regular
 * 
 * digital numbers font family
 * https://www.1001fonts.com/digital+clock-fonts.html
 * (stack overflow)
 * https://stackoverflow.com/questions/33649957/how-to-set-the-font-family-like-a-digital-clock-css
 * 
 * google font 
 * <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css" />
  <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=black Ops One' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=Wallpoet' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=Saira Stencil One' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=ZCOOL QingKe HuangYou' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=Revalia' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=Cute Font' rel='stylesheet' type='text/css'>
 * 
 * var oldonload = window.onload || function () {}; 
 * 就會知道，他是在判斷假如window.onload有設定，那傳回window.onload，沒有的話就建立一個新的函式。
 */