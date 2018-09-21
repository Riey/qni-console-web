import { QniColor, QniFont, QniTextAlign, QniFontStyle, QniConsoleMessage, QniConsoleMessageType, QniConsoleResponseType, QniConsoleRequest, QniConsoleResponse, QniInputResponse, QniInputRequest, QniInputResponseData, QniProgramCommand, QniProgramCommandType, QniConsolePrintDataType, QniPrintButtonData, QniProgramMessage, QniProgramMessageType, QniProgramRequest, QniProgramRequestType, QniProgramResponse, QniProgramResponseType, QniConsoleRequestType, QniConsoleSettingItem, QniConsoleSettingItemType, QniInputRequestDataType, QniInputTag, QniInputResponseDataType } from "./apis/qni_codes.js";

declare var msgpack: any;

const MAX_LOG = 1000;

class QniConsoleSetting {
  textColor: string | null = null;
  backColor: string | null = null;
  highlightColor: string | null = null;
  font: QniFont = [null, 3, QniFontStyle.REGULAR];
  fontSizeCache: string = "3rem";
  align: string = "line-left";

  setFont (font: QniFont) {
    this.font = font;
    this.fontSizeCache = font[1] + "rem";
  }
}

function qniTextAlignToHtml (align: QniTextAlign) {
  switch (align) {
    case QniTextAlign.LEFT: return "line-left";
    case QniTextAlign.CENTER: return "line-center";
    case QniTextAlign.RIGHT: return "line-right";
  }
}

function qniColorToHtml (color: QniColor) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

const inputUploadEvent = new Event("qni-input-upload", {
  bubbles: false
});

enum InputRoot {
  Normal,
  Enter,
  Touch
}

export function start (url: string, qniConsole: HTMLElement, input: HTMLInputElement, inputBtn: HTMLButtonElement) {

  const setting = new QniConsoleSetting();

  function makeNewLine () {
    const line = document.createElement("div");
    return qniConsole.appendChild(line);
  }

  let lastLine = makeNewLine();
  lastLine.className = setting.align;

  let newLineFlag = true;

  function clearConsole () {
    if (qniConsole.lastChild !== null) {
      qniConsole.removeChild(qniConsole.lastChild);
    }
    newline();
  }

  clearConsole();

  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  let curInputReq: QniInputRequest | null = null;
  let curInputMaxLen: number | null = null;
  let statusPos = 0;

  function sendMsg (msg: QniConsoleMessage) {
    const pack: Uint8Array = msgpack.encode(msg);
    ws.send(pack);
  }

  function sendReq (req: QniConsoleRequest) {
    sendMsg([QniConsoleMessageType.CON_MSG_REQ, req]);
  }

  function sendRes (res: QniConsoleResponse) {
    sendMsg([QniConsoleMessageType.CON_MSG_RES, res]);
  }

  function sendInputRes (_: InputRoot, input: QniInputResponse) {
    if (curInputReq === null) return;

    sendRes([QniConsoleResponseType.CON_RES_OK_INPUT, input]);
    qniConsole.dispatchEvent(inputUploadEvent);
  }

  function updateStatus () {
    sendReq([QniConsoleRequestType.CON_REQ_GET_STATE, statusPos]);

    if (curInputReq === null && ws.readyState === ws.CONNECTING) {
      setTimeout(updateStatus, 200);
    }
  }

  function sendInputByInputElem (root: InputRoot) {
    if (curInputReq === null) return;

    switch (curInputReq[0][0]) {
      case QniInputRequestDataType.INPUT_REQ_ANYKEY:
      case QniInputRequestDataType.INPUT_REQ_ENTER:
      case QniInputRequestDataType.INPUT_REQ_TOUCH:
        {
          sendInputRes(root,
            [[QniInputResponseDataType.INPUT_RES_EMPTY, null], curInputReq[2]]);
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_INT:
      case QniInputRequestDataType.INPUT_REQ_INT_MAX_LEN:
        {
          if (isNaN(input.valueAsNumber)) return;

          sendInputRes(root,
            [[QniInputResponseDataType.INPUT_RES_INT, input.valueAsNumber], curInputReq[2]]);
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_STR:
      case QniInputRequestDataType.INPUT_REQ_STR_MAX_LEN:
        {
          sendInputRes(root,
            [[QniInputResponseDataType.INPUT_RES_STR, input.value], curInputReq[2]]);
          break;
        }
      default:
        {
          // TODO implmenet
          break;
        }
    }

    input.value = "";
  }

  inputBtn.addEventListener("click", function (e) {
    sendInputByInputElem(InputRoot.Enter);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      sendInputByInputElem(InputRoot.Enter);
    } else if (input.value.length === curInputMaxLen) {
      sendInputByInputElem(InputRoot.Normal);
    }
  });

  function checkMaxLog () {
    let diff = qniConsole.childElementCount - MAX_LOG;
    while (--diff >= 0 && qniConsole.firstChild !== null) {
      qniConsole.removeChild(qniConsole.firstChild);
    }
  }

  function updateInput () {
    if (curInputReq === null) return;

    switch (curInputReq[0][0]) {
      case QniInputRequestDataType.INPUT_REQ_ANYKEY:
      case QniInputRequestDataType.INPUT_REQ_ENTER:
      case QniInputRequestDataType.INPUT_REQ_TOUCH:
        {
          input.hidden = true;
          curInputMaxLen = null;
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_STR_MAX_LEN:
        {
          input.type = "text";
          curInputMaxLen = curInputReq[0][1] as number;
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_STR:
        {
          input.type = "text";
          curInputMaxLen = null;
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_INT:
        {
          input.type = "number";
          curInputMaxLen = null;
          break;
        }
      case QniInputRequestDataType.INPUT_REQ_INT_MAX_LEN:
        {
          input.type = "number";
          curInputMaxLen = curInputReq[0][1] as number;
          break;
        }
      default:
        {
          input.type = "text";
          break;
        }
    }
  }

  qniConsole.dispatchEvent(inputUploadEvent);

  function newline () {
    lastLine = makeNewLine();
    newLineFlag = true;
  }

  function deleteline (count: number) {

    if (newLineFlag) {
      qniConsole.removeChild(lastLine);
    }

    while (--count >= 0 && qniConsole.lastChild !== null) {
      qniConsole.removeChild(qniConsole.lastChild);
    }

    if (newLineFlag) {
      newline();
    }
  }

  function createPrintSpan (highlight: boolean): HTMLSpanElement {
    const span = document.createElement("span");
    span.style.color = setting.textColor;
    span.style.background = setting.backColor;
    span.style.fontFamily = setting.font[0];
    span.style.fontSize = setting.fontSizeCache;

    if (setting.font[2] & QniFontStyle.BOLD) {
      span.style.fontWeight = "bold";
    }

    if (setting.font[2] & QniFontStyle.ITALIC) {
      span.style.fontStyle = "italic";
    }

    if (setting.font[2] & QniFontStyle.UNDERLINE) {
      span.classList.add("underline");
    }

    if (highlight) {
      const color = setting.textColor;
      const highlight = setting.highlightColor;

      const mouseenter = () => {
        span.style.color = highlight;
      };

      const mouseleave = () => {
        span.style.color = color;
      };

      span.addEventListener("mouseenter", mouseenter);
      span.addEventListener("touchstart", mouseenter);
      span.addEventListener("mouseleave", mouseleave);
      span.addEventListener("touchend", mouseleave);

      qniConsole.addEventListener("qni-input-upload", function inputupdate () {
        span.style.color = color;
        span.removeEventListener("mouseenter", mouseenter);
        span.removeEventListener("touchstart", mouseenter);
        span.removeEventListener("mouseleave", mouseleave);
        span.removeEventListener("touchend", mouseleave);
        qniConsole.removeEventListener("qni-input-upload", inputupdate);
      });
    }

    return span;
  }

  function print (str: string) {
    const span = createPrintSpan(false);

    span.innerText = str;
    lastLine.appendChild(span);
  }

  function printbtn (str: string, data: QniInputResponseData) {
    const span = createPrintSpan(true);

    span.innerText = str;
    const click = (e: any) => {
      if (!curInputReq) return false;

      switch (e.button) {
        // left btn
        case 0:
        // middle btn
        case 1: {
          sendInputRes(InputRoot.Touch, [data, curInputReq[2]]);
          break;
        }
      }
    };

    span.addEventListener("click", click);

    qniConsole.addEventListener("qni-input-upload", function inputUpdate () {
      span.removeEventListener("click", click);
      qniConsole.removeEventListener("qni-input-upload", inputUpdate);
    });

    lastLine.appendChild(span);
  }

  function runCommand (com: QniProgramCommand) {
    switch (com[0]) {
      case QniProgramCommandType.PROG_COM_PRINT: {
        const dataType = com[1][0];
        const data = com[1][1];
        console.log(`print [${dataType}]: ${data}`);

        switch (dataType) {
          case QniConsolePrintDataType.PRINT: {
            print(data as string);
            newLineFlag = false;
            break;
          }
          case QniConsolePrintDataType.PRINT_BUTTON: {
            const btnData = data as QniPrintButtonData;
            printbtn(btnData[0], btnData[1]);
            newLineFlag = false;
            break;
          }

          case QniConsolePrintDataType.PRINT_LINE: {
            print(data as string);
            newline();
            break;
          }

          case QniConsolePrintDataType.CLEAR_LINE: {
            clearConsole();
            break;
          }

          case QniConsolePrintDataType.DELETE_LINE: {
            deleteline(data as number);
            break;
          }

          case QniConsolePrintDataType.NEW_LINE: {
            newline();
            break;
          }
        }
        break;
      }

      case QniProgramCommandType.PROG_COM_UPDATE_SETTING: {
        const item = com[1] as QniConsoleSettingItem;

        switch (item[0]) {
          case QniConsoleSettingItemType.SETTING_FONT: {
            setting.setFont(item[1] as QniFont);
            break;
          }
          case QniConsoleSettingItemType.SETTING_TEXT_COLOR: {
            setting.textColor = qniColorToHtml(item[1] as QniColor);
            break;
          }
          case QniConsoleSettingItemType.SETTING_BACK_COLOR: {
            setting.backColor = qniColorToHtml(item[1] as QniColor);
            break;
          }
          case QniConsoleSettingItemType.SETTING_HIGHLIGHT_COLOR: {
            setting.highlightColor = qniColorToHtml(item[1] as QniColor);
            break;
          }
          case QniConsoleSettingItemType.SETTING_TEXT_ALIGN: {
            setting.align = qniTextAlignToHtml(item[1] as QniTextAlign);
            lastLine.className = setting.align;
            break;
          }
        }

        break;
      }
    }
  }

  function processRequest (req: QniProgramRequest) {
    switch (req[0]) {
      case QniProgramRequestType.PROG_REQ_INPUT: {
        curInputReq = req[1] as QniInputRequest;
        updateInput();
        break;
      }

      case QniProgramRequestType.PROG_REQ_ACCEPT_INPUT: {
        if (curInputReq !== null && curInputReq[2] <= (req[1] as QniInputTag)) {
          curInputReq = null;
        }
        sendRes([QniConsoleResponseType.CON_RES_OK_ACCEPT_INPUT, null]);
        updateInput();
        updateStatus();
        break;
      }
    }
  }

  function processResponse (res: QniProgramResponse) {
    switch (res[0]) {
      case QniProgramResponseType.PROG_RES_OK_GET_STATE: {
        const commands = res[1] as QniProgramCommand[];
        commands.forEach(runCommand);
        statusPos += commands.length;
        break;
      }
      case QniProgramResponseType.PROG_RES_OK_LOAD_STATE: {
        statusPos = 0;
        clearConsole();
        updateStatus();
        break;
      }
      case QniProgramResponseType.PROG_RES_OK_SHARE_STATE: {
        console.log("share success! index: " + (res[1] as number));
        break;
      }
      case QniProgramResponseType.PROG_RES_ERR: {
        console.error(`program fail: ${res[1] as string}`);
        break;
      }
    }
  }

  ws.addEventListener("open", e => {
    updateStatus();
  });

  ws.addEventListener("message", e => {
    try {
      const dat = new Uint8Array(e.data);
      const msg: QniProgramMessage = msgpack.decode(dat);

      switch (msg[0]) {
        case QniProgramMessageType.PROG_MSG_REQ: {
          const req = msg[1] as QniProgramRequest;
          processRequest(req);
          break;
        }
        case QniProgramMessageType.PROG_MSG_RES: {
          const res = msg[1] as QniProgramResponse;
          processResponse(res);
          checkMaxLog();
          break;
        }
      }

      document.documentElement.style.backgroundColor = setting.backColor;
      input.style.color = setting.textColor;
      inputBtn.style.color = setting.textColor;

    } catch (e) {
      console.error(e);
      ws.close();
    }

    return true;
  });
}
