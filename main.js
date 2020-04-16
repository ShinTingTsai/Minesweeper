const gameStatus = {
  firstPressAwaits: 'firstPressAwaits',
  secondPressAwaits: 'secondPressAwaits',
  gameFailed: 'gameFailed',
  gameFinished: 'gameFinished'
}

const view = {
  boardBottom: document.querySelector("#boardBottom"),
  timerElement: document.getElementById("timer"),
  resetBtn: document.querySelector(".reset"),
  restMineCountElement: document.getElementById("restMineCount"),
  face: document.getElementById("face"),
  toDefault: document.getElementById("toDefault"),
  customizeBtn: document.getElementById("customizeBtn"),
  numOfRows: document.getElementById("numOfRows"),
  numOfMines: document.getElementById("numOfMines"),
  debugBoard: document.getElementById("debugBoard"),
  debugBtn: document.getElementById("debugBtn"),
  setRightClickBlocked() {
    document.oncontextmenu = () => {
      return false
    }},
  getFieldHtml(fieldIdx) {
    return document.getElementById(fieldIdx);
  },
  getBoardElement(fieldIdx) {
    return ` <div class="field d-flex justify-content-center align-items-center flex-{grow|shrink}-0" id='${fieldIdx}' data-target="#boardBottom" data-id="${fieldIdx}"></div>`;
  },
  /**
   * displayFields()
   * 顯示踩地雷的遊戲版圖在畫面上，
   * 輸入的 rows 是指版圖的行列數。
   */
  displayFields(rows, numberOfRows) {
    this.boardBottom.innerHTML = rows.map((index) => view.getBoardElement(index)).join("");
    const boardWidth = numberOfRows * 30 + 16;
    $(".board").css({ width: boardWidth });
    if (boardWidth <= 160) $(".boardTop").css({ width: "160px" });
  },
  /**
   * showFieldContent()
   * 更改單一格子的內容，像是顯示數字、地雷，或是海洋。
   */
  showFieldContent(field) {
    let fieldHtml = this.getFieldHtml(field.fieldIdx);
    fieldHtml.innerHTML =
      field.type === "mine" ? `<i class="fas fa-bomb"></i>` : `${field.number}`;
    fieldHtml.classList.add("digged");
    field.isDigged = true;
    if (field.type === "mine") fieldHtml.classList.add("mine");
  },
  /**
   * renderTime()
   * 顯示經過的遊戲時間在畫面上。
   */
  renderTime(time) {
    if (time > 999) time = 999;
    let timeString = time.toString();
    for (let i = 3; i > time.toString().length; i--)
      timeString = "0" + timeString;
    let timer = view.timerElement;
    timer.innerHTML = `${timeString}`;
  },
  renderMineCount(number) {
    let restMines = "";
    if (number < 0) {
      number = Math.abs(number);
      if (number > 99) number = 99;
      restMines = number.toString();
      for (let i = 2; i > number.toString().length; i--)
        restMines = "0" + restMines;
      restMines = "-" + restMines;
    } else {
      restMines = number.toString();
      for (let i = 3; i > number.toString().length; i--)
        restMines = "0" + restMines;
    }
    let restMineCount = view.restMineCountElement;
    restMineCount.innerHTML = `${restMines}`;
  },
  /**
   * showBoard()
   * 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
   */
  showBoard(fieldIdx) {
    model.fields.forEach((item) => {
      // 踩到地雷而結束遊戲時，被踩到的地雷背景為紅色，這部分不動
      if (item.fieldIdx === fieldIdx) return;

      // let fieldHtml = document.getElementById(field.fieldIdx)
      let fieldHtml = view.getFieldHtml(item.fieldIdx);
      fieldHtml.innerHTML =
        item.type === "mine" ? `<i class="fas fa-bomb"></i>` : `${item.number}`;
      if (!item.isDigged) {
        fieldHtml.classList.add("digged");
        item.isDigged = true;
      }
    });
  },
  /** Debug Board */
  setDebugBoard(fields) {
    let debugBoardHtml = "";
    let content = "";
    for (i = 0; i < fields.length; i++) {
      content = isNaN(fields[i].number)
        ? `<i class="fas fa-bomb"></i>`
        : `${fields[i].number}`;
      debugBoardHtml += ` <div class="field d-flex justify-content-center align-items-center flex-{grow|shrink}-0" >${content}</div>`;
    }
    view.debugBoard.innerHTML = debugBoardHtml;
  },
  /** Hind selected flag and return false */
  removeFlag(target) {
    if (target.matches(".fas")) target.parentNode.removeChild(target);
    else target.removeChild(target.childNodes[0]);
  },
  /** Put flag on the board and return true */
  showFlag(target) {
    target.innerHTML = `<i class="fas fa-flag flagged d-flex justify-content-center align-items-center" data-id="${target.dataset.id}"></i>`;
  },
  /** show/hind debug board */
  toggleDebugBoard(debugBoard) {
    debugBoard.style.display = (debugBoard.style.display === "none") ? "flex" : "none";
  },
  showFace(emoji) {
    view.face.innerHTML = emoji;
  },
  setModalPlaceholder() {
    $("#numOfMines")
      .focus(function () {
        let numberOfRows = Number(view.numOfRows.value);
        if (numberOfRows !== 0) {
          let maxMineNum = Math.pow(numberOfRows - 1, 2);
          if (maxMineNum < 2) maxMineNum = 2;
          this.setAttribute("placeholder", `2 ~ ${maxMineNum - 1}`);
          this.readOnly = false;
        }
      })
      .blur(function () {
        if (!$("#numOfMines").val()) {
          this.setAttribute("placeholder", "請先輸入Rows");
          this.readOnly = true;
        }
      });
  },
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
    this.setGame(numberOfRows, numberOfMines);
    this.setClick();
    // setup buttons
    this.setToggleDebugBtn();
    this.setResetBtn();
    this.setCustomizeBtn();
    this.setDefaultBtn();
    view.setModalPlaceholder();
    view.setRightClickBlocked();
  },
  setGame(numberOfRows, numberOfMines) {
    model.setCurrentStatus("firstPressAwaits");
    model.setSettings('current', 'rows', numberOfRows)
    model.setSettings('current', 'mines', numberOfMines)
  
    // 1. 顯示遊戲畫面
    // const rows = utility.getRandomNumberArray(Math.pow(model.currentSettings.rows, 2));
    // view.displayFields(rows, model.currentSettings.rows);
    const rows = utility.getRandomNumberArray(Math.pow(numberOfRows, 2));
    view.displayFields(rows, numberOfRows);

    view.showFace(model.getEmoji());
    // 2. 遊戲計時
    clearInterval(model.getTimerID());
    view.renderTime(model.setTime(0));
    // 3. 埋地雷 (先全部設定成ocean, 再填入mine, 最後計算number)
    model.initFields(rows);
    this.setMinesAndFields(model.getSettings('current', 'mines'));
    const restMine = model.setRestMineCount();
    view.renderMineCount(restMine);
    // 4. 綁定事件監聽器到格子上
    // this.setClick()
    //Reset debug board
    view.setDebugBoard(model.getFields());
  },
  setDefaultBtn() {
    view.toDefault.addEventListener("click", (event) => {
      event.preventDefault();
      this.setGame(model.getSettings('default', 'rows'), model.getSettings('default', 'mines'));
    });
  },
  setCustomizeBtn() {
    view.customizeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      let numberOfRows = Number(view.numOfRows.value);
      let numberOfMines = Number(view.numOfMines.value);
      //檢查輸入的值是否為正整數
      let result =
        utility.checkInt(numberOfRows) && utility.checkInt(numberOfMines);
      if (!result) {
        controller.showMessage(model.getMessage('checkInt'));
        return;
      }
      //Row的最小值應為3
      if (numberOfRows < 3) {
        numberOfRows = 3;
        controller.showMessage(model.getMessage('checkRowNum'));
        return;
      }
      //檢查地雷數
      result = model.checkMineNumber(numberOfRows, numberOfMines);
      if (result !== "true") {
        controller.showMessage(result);
        return;
      } else {
        this.setGame(numberOfRows, numberOfMines);
      }
    });
  },
  setResetBtn() {
    view.resetBtn.addEventListener("click", () => {
      this.setGame(model.getSettings('current', 'rows'), model.getSettings('current', 'mines'));
    });
  },
  /** Set (1) left click for dig; (2) right click for put/hind flag*/
  setClick() {
    view.boardBottom.addEventListener("click", (event) => {
      const field = model.getFieldData(Number(event.target.dataset.id));
      console.log("filed",field)
      /** set left click event listener */
      if (field.isDigged === true || field.isFlag === true) return;
      this.dig(field);
    });
    view.boardBottom.addEventListener("contextmenu", (event) => {
      const field = model.getFieldData(Number(event.target.dataset.id));
      if (field.isDigged) return;
      if (field.isFlag) {
        view.removeFlag(event.target);
        field.isFlag = false;
      } else {
        view.showFlag(event.target);
        field.isFlag = true;
      }
      const restMine = model.setRestMineCount();
      view.renderMineCount(restMine);
    });
    view.boardBottom.addEventListener("mousedown", () =>
      view.showFace(model.getEmoji('scream'))
    );
    view.boardBottom.addEventListener("mouseup", () => {
      const status = model.getCurrentStatus
      view.showFace(model.getEmoji(status))
    });
  },
  setToggleDebugBtn() {
    view.debugBtn.addEventListener("click", () => {
         view.toggleDebugBoard(view.debugBoard);
    });
  },
  /**
   * setMinesAndFields()
   * 設定格子的內容，以及產生地雷的編號。
   */
  setMinesAndFields(numberOfMines) {
    const mines = []
    // model.mines.length = 0;
    for (i = 0; i < numberOfMines; i++) {
      let mine = model.getFieldData(i);
      //update model.mines
      // model.mines.push(mine.position);
      mines.push(mine.position)
      //update model.fields
      mine.type = "mine";
      mine.number = NaN;
      //update 地雷周邊數字
      const surroundIndexes = utility.getSurroundIndex(mine.position, model.getSettings('current', 'rows'));
      model.updateNum(surroundIndexes);
    }
    model.setMines(mines)
  },

  /**
   * dig()
   * 使用者挖格子時要執行的函式，
   * 會根據挖下的格子內容不同，執行不同的動作，
   * 如果是號碼或海洋 => 顯示格子
   * 如果是地雷      => 遊戲結束
   */
  dig(field) {
    const position = field.position;
    let currentStatus = model.getCurrentStatus()
    
    //第一次不踩雷
    if (currentStatus === gameStatus.firstPressAwaits) {
      if (model.isMine(position)) {
        model.switchMine(field);
        view.setDebugBoard(model.getFields());
      }
      // start from 1st sec
      model.setTime(1)
      view.renderTime(model.getTime());
      model.setTimer();
    }
    // 開啟格子
    view.showFieldContent(field);
    switch (field.type) {
      case "ocean":
        this.spreadOcean(field);
        currentStatus = this.isFinished() ? gameStatus.gameFinished : gameStatus.secondPressAwaits;
        break;
      case "mine":
        currentStatus = gameStatus.gameFailed;
        break;
      default:
        currentStatus = this.isFinished() ? gameStatus.gameFinished : gameStatus.secondPressAwaits;
        break;
    }
    model.setCurrentStatus(currentStatus)
    // 檢查是否結束遊戲
    if (currentStatus === gameStatus.gameFailed || currentStatus === gameStatus.gameFinished)
      this.gameClose(field);
  },
  isFinished() {
    const nonMineFields = model.getFields().filter((item) => item.type !== "mine");
    const result = nonMineFields.every((item) => item.isDigged === true);
    return result;
  },
  gameClose(field) {
    clearInterval(model.getTimerID());
    const diggedFiledIdx = model.isMine(field.position) ? field.fieldIdx : -1;
    view.showBoard(diggedFiledIdx);
    controller.showMessage();
    view.face.innerHTML = model.getEmoji(model.getCurrentStatus())
  },
  spreadOcean(field) {
    const surroundIndexes = utility.getSurroundIndex(
      field.position,
      model.getSettings('current', 'rows')
    );
    surroundIndexes.forEach((value) => {
      const surroundField = model.getFieldData(value);
      //插旗子的格子、已挖過的格子不處理
      if (!surroundField.isFlag && !surroundField.isDigged) {
        // view.showFieldContent(value)
        view.showFieldContent(surroundField);
        if (surroundField.type === "ocean") this.spreadOcean(surroundField);
      }
    });
  },
  /** Show message for fail or success the challenge */
  showMessage(message) {
    if (message === undefined) {
      switch (model.getCurrentStatus()) {
        case "gameFinished":
          message = model.getMessage("gameFinished");
          break;
        case "gameFailed":
          message = model.getMessage("gameFailed")
          break;
        default:
          break;
      }
    }
    alert(message);
  },
};

const model = {
  currentStatus: "firstPressAwaits",
  setCurrentStatus(status){
    model.currentStatus = gameStatus[status]
  },
  getCurrentStatus(){
    return model.currentStatus
  },
  defaultSettings: { rows: 9, mines: 10 },
  currentSettings: { rows: 9, mines: 10 },
  setSettings(type, setting, value){
    switch (type) {
      case 'default':
        model.defaultSettings[setting] = value
        break;
      case 'current':
        model.currentSettings[setting] = value
        break;
      default:
        break;
    }
  },
  getSettings(type, setting){
    let result = 0
    switch (type) {
      case 'default':
        result = model.defaultSettings[setting] 
        break;
      case 'current':
        result = model.currentSettings[setting] 
        break;
      default:
        break;
    }
    return result
  },
  emojis: {
    firstPressAwaits: "🙂",
    secondPressAwaits: "🙂",
    gameFailed: "😵",
    scream: "😱",
    surprise: "😮",
    gameFinished: "😎",
  },
  getEmoji(){
    return model.emojis[model.currentStatus]
  },
  /**
   * mines
   * 存放地雷的編號（第幾個格子）
   */
  mines: [],
  setMines(mines){
    model.mines.length = 0
    model.mines = mines
  },

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
  /** 初始化 Model.Fields */
  initFields(rows) {
    this.fields.length = 0;
    rows.forEach((value, index) => {
      const field = {
        position: index + 1,
        fieldIdx: value,
        type: "ocean",
        number: "",
        isDigged: false,
        isFlag: false,
      };
      this.fields.push(field);
    });
  },
  getFields(){
    return model.fields;
  },
  time: 0,
  setTime(time){
    model.time = time
    return model.time
  },
  getTime(){
    return model.time
  },
  timerID: 0,
  setTimerID(id){
    model.timerID = id
  },
  getTimerID(){
    return model.timerID
  },
  messages: {
    checkInt: "Please type in the positive integer.",
    checkMineNum: "Bombs should be set up between 2 and ",
    checkRowNum: "Rows should be more than 2",
    gameFinished: "Congratulations, You win the game!",
    gameFailed: "Oh, here is a mine, you lose!",
  },
  getMessage(status){
    return model.messages[status]
  },

  /**
   * isMine()
   * 輸入一個格子編號，並檢查這個編號是否是地雷
   */
  isMine(position) {
    return this.mines.includes(position);
  },
  switchMine(field) {
    const tempFields = model.fields.filter((item) => item.type !== "mine");
    const randomIndex = Math.floor(Math.random() * tempFields.length);
    let newField = tempFields[randomIndex];
    [field["type"], newField["type"]] = [newField["type"], field["type"]];
    [field["number"], newField["number"]] = [
      newField["number"],
      field["number"],
    ];
    // * "isDigged": false, --> 第一次一定沒有挖過
    // * "isFlag": false --> 旗子跟著位置走 不用換

    // this.updateSwitchNum(field, newField)

    //update number (舊地雷的周邊數字減1)
    let surroundIndexes = utility.getSurroundIndex(
      field.position,
      model.getSettings('current', 'rows')
    );
    let surroundMineCount = 0;
    surroundIndexes.forEach((value) => {
      let surroundField = model.getFieldData(value);
      if (surroundField.type === "mine") {
        surroundMineCount++;
        return;
      }
      surroundField.number--;
      if (surroundField.number === 0) {
        surroundField.type = "ocean";
        surroundField.number = "";
      }
    });
    //update number (新地雷的周邊數字加1)
    surroundIndexes = utility.getSurroundIndex(
      newField.position,
      model.getSettings('current', 'rows')
    );
    model.updateNum(surroundIndexes);
    //update number (舊地雷原本的位置)
    if (surroundMineCount === 0) {
      field.type = "ocean";
      field.number = "";
    } else {
      field.type = "number";
      field.number = surroundMineCount;
    }
    //update model.mines
    model.updateMinesList(field, newField);
  },
  /** update model.mines */
  updateMinesList(oldField, newField) {
    const oldPosition = model.mines.indexOf(oldField.position);
    model.mines[oldPosition] = newField.position;
  },
  /** 如果不是地雷，更新該顯示的數字 */
  updateNum(surroundIndexes) {
    surroundIndexes.forEach((value) => {
      let surroundField = model.getFieldData(value);
      if (surroundField.type === "mine") return;
      surroundField.type = "number";
      surroundField.number++;
    });
  },

  /** 檢查地雷數量
   * role: 1 < 地雷數 < (列數-1)^2
   */
  checkMineNumber(numberOfRows, numberOfMines) {
    const maxMineNum = Math.pow(numberOfRows - 1, 2);
    const message = `${this.messages.checkMineNum}${maxMineNum - 1}`;
    if (numberOfMines > 1 && numberOfMines < maxMineNum) {
      return "true";
    } else {
      return message;
    }
  },
  setTimer() {
    this.timerID = setInterval(() => {
      this.time += 1;
      view.renderTime(this.time);
    }, 1000);
  },
  setRestMineCount() {
    const flagCount = model.fields.filter((field) => field.isFlag === true)
      .length;
    const mineCount = model.mines.length;
    return mineCount - flagCount;
  },
  /**
   * getFieldData()
   * 取得單一格子的內容，決定這個格子是海洋還是號碼，
   * 如果是號碼的話，要算出這個號碼是幾號。
   * （計算周圍地雷的數量）
   */
  getFieldData(fieldIdx) {
    return model.fields.find((field) => field.fieldIdx === fieldIdx);
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