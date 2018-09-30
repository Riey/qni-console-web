import { TextAlign, Font, FontStyle, InputRequest, ConsoleMessage, ConsoleRequest, ConsoleResponse, InputResponse, ProgramCommand, ConsolePrintData, ConsolePrintButtonData, ConsoleSettingItem, ProgramRequest, ProgramResponse, ProgramMessage } from "./qni-api_pb.js";
import { Empty } from "google-protobuf/google/protobuf/empty_pb.js";

const MAX_LOG = 1000;

function make_new_font(fontSize: number) {
  const font = new Font();
  font.setFontFamily("");
  font.setFontSize(fontSize);
  font.setFontStyle(FontStyle.REGULAR);

  return font;
}

class QniConsoleSetting {
  textColor: string | null = null;
  backColor: string | null = null;
  highlightColor: string | null = null;
  font = make_new_font(3);
  fontSizeCache: string = "3rem";
  align: string = "line-left";

  setFont(font: Font) {
    this.font = font;
    this.fontSizeCache = font.getFontSize() + "rem";
  }
}

function qniTextAlignToHtml(align: TextAlign) {
  switch (align) {
    case TextAlign.LEFT: return "line-left";
    case TextAlign.CENTER: return "line-center";
    case TextAlign.RIGHT: return "line-right";
  }
}

function qniColorToHtml(color: number) {
  return `rgb(${color & 0x00FF0000 >> 4}, ${color & 0x0000FF00 >> 2}, ${color & 0x000000FF >> 0})`;
}

const inputUploadEvent = new Event("qni-input-upload", {
  bubbles: false
});

enum InputRoot {
  Normal,
  Enter,
  Touch
}

export function start(url: string, qniConsole: HTMLElement, input: HTMLInputElement, inputBtn: HTMLButtonElement) {
  const setting = new QniConsoleSetting();

  function makeNewLine() {
    const line = document.createElement("div");
    return qniConsole.appendChild(line);
  }

  let lastLine = makeNewLine();
  lastLine.className = setting.align;

  let newLineFlag = true;

  function newline() {
    lastLine = makeNewLine();
    newLineFlag = true;
  }

  function clearConsole() {
    if (qniConsole.lastChild !== null) {
      qniConsole.removeChild(qniConsole.lastChild);
    }
    newline();
  }

  clearConsole();

  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  let curInputReq: InputRequest | null = null;
  let curInputMaxLen: number | null = null;
  let statusPos = 0;

  function sendMsg(msg: ConsoleMessage) {
    ws.send(msg.serializeBinary());
  }

  function sendReq(req: ConsoleRequest) {
    const msg = new ConsoleMessage();
    msg.setReq(req);
    sendMsg(msg);
  }

  function sendRes(res: ConsoleResponse) {
    const msg = new ConsoleMessage();
    msg.setRes(res);
    sendMsg(msg);
  }

  function sendInputRes(_: InputRoot, input: InputResponse) {
    if (curInputReq === null) return;

    const res = new ConsoleResponse();
    res.setOkInput(input);

    sendRes(res);
    qniConsole.dispatchEvent(inputUploadEvent);
  }

  function updateStatus() {
    const req = new ConsoleRequest();
    req.setGetState(statusPos);
    sendReq(req);

    if (curInputReq === null && ws.readyState === ws.CONNECTING) {
      setTimeout(updateStatus, 200);
    }
  }

  function sendInputByInputElem(root: InputRoot) {
    if (curInputReq === null) return;

    switch (curInputReq.getDataCase()) {
      case InputRequest.DataCase.ANYKEY:
      case InputRequest.DataCase.ENTER:
      case InputRequest.DataCase.TOUCH:
        {
          const res = new InputResponse();
          res.setEmpty(new Empty());
          sendInputRes(root, res);
          break;
        }
      case InputRequest.DataCase.INT:
      case InputRequest.DataCase.INT_MAX_LEN:
        {
          if (isNaN(input.valueAsNumber)) return;

          const res = new InputResponse();
          res.setInt(input.valueAsNumber);
          sendInputRes(root, res);
          break;
        }
      case InputRequest.DataCase.STR:
      case InputRequest.DataCase.STR_MAX_LEN:
        {
          const res = new InputResponse();
          res.setStr(input.value);
          sendInputRes(root, res);
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

  function checkMaxLog() {
    let diff = qniConsole.childElementCount - MAX_LOG;
    while (--diff >= 0 && qniConsole.firstChild !== null) {
      qniConsole.removeChild(qniConsole.firstChild);
    }
  }

  function updateInput() {
    if (curInputReq === null) return;

    switch (curInputReq.getDataCase()) {
      case InputRequest.DataCase.ANYKEY:
      case InputRequest.DataCase.ENTER:
      case InputRequest.DataCase.TOUCH:
        {
          input.hidden = true;
          curInputMaxLen = null;
          break;
        }
      case InputRequest.DataCase.STR_MAX_LEN:
        {
          input.type = "text";
          curInputMaxLen = curInputReq.getStrMaxLen();
          break;
        }
      case InputRequest.DataCase.STR:
        {
          input.type = "text";
          curInputMaxLen = null;
          break;
        }
      case InputRequest.DataCase.INT:
        {
          input.type = "number";
          curInputMaxLen = null;
          break;
        }
      case InputRequest.DataCase.INT_MAX_LEN:
        {
          input.type = "number";
          curInputMaxLen = curInputReq.getIntMaxLen();
          break;
        }
      default:
        {
          input.type = "text";
          break;
        }
    }
  }

  function deleteline(count: number) {

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

  function createPrintSpan(highlight: boolean): HTMLSpanElement {
    const span = document.createElement("span");
    span.style.color = setting.textColor;
    span.style.background = setting.backColor;
    span.style.fontFamily = setting.font.getFontFamily();
    span.style.fontSize = setting.fontSizeCache;

    if (setting.font.getFontStyle() & FontStyle.BOLD) {
      span.style.fontWeight = "bold";
    }

    if (setting.font.getFontStyle() & FontStyle.ITALIC) {
      span.style.fontStyle = "italic";
    }

    if (setting.font.getFontStyle() & FontStyle.UNDERLINE) {
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

      qniConsole.addEventListener("qni-input-upload", function inputupdate() {
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

  function print(str: string) {
    const span = createPrintSpan(false);

    span.innerText = str;
    lastLine.appendChild(span);
  }

  function printbtn(str: string, data: InputResponse | undefined) {
    const span = createPrintSpan(true);

    span.innerText = str;

    if (data !== undefined) {

      const click = (e: any) => {
        if (!curInputReq) return false;

        switch (e.button) {
          // left btn
          case 0:
          // middle btn
          case 1: {
            sendInputRes(InputRoot.Touch, data);
            break;
          }
        }
      };

      span.addEventListener("click", click);

      qniConsole.addEventListener("qni-input-upload", function inputUpdate() {
        span.removeEventListener("click", click);
        qniConsole.removeEventListener("qni-input-upload", inputUpdate);
      });
    }

    lastLine.appendChild(span);
  }

  function runCommand(com: ProgramCommand) {
    switch (com.getDataCase()) {
      case ProgramCommand.DataCase.PRINT: {
        console.log(`print: ${com.toObject()}`);

        const printData = com.getPrint();

        if (printData === undefined) return;

        switch (printData.getDataCase()) {
          case ConsolePrintData.DataCase.PRINT: {
            print(printData.getPrint());
            newLineFlag = false;
            break;
          }

          case ConsolePrintData.DataCase.PRINT_BUTTON: {
            const btnData = printData.getPrintButton();

            if (btnData === undefined) return;

            printbtn(btnData.getText(), btnData.getValue());
            newLineFlag = false;
            break;
          }

          case ConsolePrintData.DataCase.PRINT_LINE: {
            print(printData.getPrintLine());
            newline();
            break;
          }

          case ConsolePrintData.DataCase.CLEAR_LINE: {
            clearConsole();
            break;
          }

          case ConsolePrintData.DataCase.DELETE_LINE: {
            deleteline(printData.getDeleteLine());
            break;
          }

          case ConsolePrintData.DataCase.NEW_LINE: {
            newline();
            break;
          }
        }
        break;
      }

      case ProgramCommand.DataCase.UPDATE_SETTING: {
        const item = com.getUpdateSetting();

        if (item === undefined) return;

        switch (item.getDataCase()) {
          case ConsoleSettingItem.DataCase.FONT: {
            const font = item.getFont();

            if (font === undefined) return;

            setting.setFont(font);
            break;
          }
          case ConsoleSettingItem.DataCase.TEXT_COLOR: {
            setting.textColor = qniColorToHtml(item.getTextColor());
            break;
          }
          case ConsoleSettingItem.DataCase.BACK_COLOR: {
            setting.backColor = qniColorToHtml(item.getBackColor());
            break;
          }
          case ConsoleSettingItem.DataCase.HIGHLIGHT_COLOR: {
            setting.highlightColor = qniColorToHtml(item.getHighlightColor());
            break;
          }
          case ConsoleSettingItem.DataCase.TEXT_ALIGN: {
            setting.align = qniTextAlignToHtml(item.getTextAlign());
            lastLine.className = setting.align;
            break;
          }
        }

        break;
      }
    }
  }

  function processRequest(req: ProgramRequest) {
    switch (req.getDataCase()) {
      case ProgramRequest.DataCase.INPUT: {
        curInputReq = req.getInput() || null;
        updateInput();
        break;
      }

      case ProgramRequest.DataCase.ACCEPT_INPUT: {
        if (curInputReq !== null && curInputReq.getTag() <= (req.getAcceptInput())) {
          curInputReq = null;
        }

        const res = new ConsoleResponse();
        res.setOkAcceptInput(new Empty());
        sendRes(res);
        updateInput();
        updateStatus();
        break;
      }
    }
  }

  function processResponse(res: ProgramResponse) {
    switch (res.getDataCase()) {
      case ProgramResponse.DataCase.OK_GET_STATE: {
        const state = res.getOkGetState();

        if (state === undefined) return;

        const commands = state.getCommandsList();
        commands.forEach(runCommand);
        statusPos += commands.length;
        break;
      }
      case ProgramResponse.DataCase.OK_LOAD_STATE: {
        console.log("load success!");
        statusPos = 0;
        clearConsole();
        updateStatus();
        break;
      }
      case ProgramResponse.DataCase.OK_SHARE_STATE: {
        console.log("share success! key: " + res.getOkShareState());
        break;
      }
      case ProgramResponse.DataCase.ERR: {
        const err = res.getErr();

        if (err === undefined) return;

        console.error(`request failed: order [${err.getReqType()} reason [${err.getReason()}]`);
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
      const msg = ProgramMessage.deserializeBinary(dat);

      switch (msg.getDataCase()) {
        case ProgramMessage.DataCase.REQ: {
          const req = msg.getReq();

          if (req !== undefined) {
            processRequest(req);
          }
          break;
        }
        case ProgramMessage.DataCase.RES: {
          const res = msg.getRes();

          if (res !== undefined) {
            processResponse(res);
          }
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

window.addEventListener("load", () => {
  const consoleBox = document.getElementById("qni-console-box");
  const input = document.getElementById("qni-input");
  const inputBtn = document.getElementById("qni-input-btn");

  if (!consoleBox || !input || !inputBtn) {
    console.error("element not found");
    return;
  }

  let url = window.location.search;

  if (url.length === 0) {
    url = "ws://127.0.0.1:4434";
  }

  start(url, consoleBox, input as HTMLInputElement, inputBtn as HTMLButtonElement);

});
