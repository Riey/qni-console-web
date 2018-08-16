import * as Qni from './apis/qni_codes.js'
import { QniInputRequest } from './apis/qni_inputreq.js'

declare var msgpack: any

const MAX_LOG = 1000

export function start (url: string, qniConsole: HTMLElement, input: HTMLInputElement, inputBtn: HTMLButtonElement) {

  function clearConsole () {
    while (qniConsole.hasChildNodes()) {
      qniConsole.removeChild(qniConsole.lastChild)
    }
  }

  clearConsole()

  const status = new Map<string, string>()

  function updateSystemElementStyle (element: HTMLElement) {
    const font = status.get('sys-font')

    if (font) element.style.font = font
    element.style.color = status.get('sys-txcolor') || status.get('txcolor')
    element.style.background = status.get('sys-bgcolor') || status.get('bgcolor')
  }

  const ws = new WebSocket(url)
  ws.binaryType = 'arraybuffer'

  function sendCom (opcode: number, data: any) {
    console.log('send [' + opcode + '] : ' + data)
    const dat = [opcode, data]
    const pack: Uint8Array = msgpack.encode(dat)
    ws.send(pack)
  }

  inputBtn.addEventListener('click', function (e) {
    sendCom(Qni.CON_RES_INPUT, input.value)
    input.type = ''
    input.value = ''
  })

  ws.addEventListener('open', () => {
    console.log('ws open')
  })

  function checkMaxLog () {
    while (qniConsole.childElementCount > MAX_LOG) {
      qniConsole.removeChild(qniConsole.firstChild)
    }
  }

  function makeNewLine () {
    const line = document.createElement('div')
    return qniConsole.appendChild(line)
  }

  let lastLine = makeNewLine()
  let curInputReq: QniInputRequest = null

  function updateInput () {
    return
  }

  const inputUploadEvent = new Event('qni-input-upload', {
    bubbles: false
  })

  qniConsole.dispatchEvent(inputUploadEvent)

  function newline () {
    lastLine = makeNewLine()
  }

  function deleteline (count: number) {
    while (qniConsole.hasChildNodes() && count > 0) {
      qniConsole.removeChild(qniConsole.lastChild)
      count -= 1
    }
  }

  function createPrintSpan (highlight: boolean): HTMLSpanElement {
    const span = document.createElement('span')
    span.style.color = status.get('txcolor')
    span.style.background = status.get('bgcolor')
    span.style.font = status.get('font')

    if (highlight) {
      const color = status.get('txcolor')
      const highlight = status.get('hlcolor')

      const mouseenter = () => {
        span.style.color = highlight
      }

      const mouseleave = () => {
        span.style.color = color
      }

      span.addEventListener('mouseenter', mouseenter)
      span.addEventListener('touchstart', mouseenter)
      span.addEventListener('mouseleave', mouseleave)
      span.addEventListener('touchend', mouseleave)

      qniConsole.addEventListener('qni-input-upload', function inputupdate () {
        span.removeEventListener('mouseenter', mouseenter)
        span.removeEventListener('touchstart', mouseenter)
        span.removeEventListener('mouseleave', mouseleave)
        span.removeEventListener('touchend', mouseleave)
        qniConsole.removeEventListener('qni-input-upload', inputupdate)
      })
    }

    return span
  }

  function print (str: string) {
    const span = createPrintSpan(false)

    span.innerText = str
    lastLine.appendChild(span)
  }

  function printbtn (str: string, data: any[]) {
    const span = createPrintSpan(true)

    span.innerText = str
    const click = (e) => {
      if (!curInputReq) return false

      switch (e.button) {
        // left btn
        case 0:
        // middle btn
        case 1: {
          sendCom(Qni.CON_RES_INPUT, [data, curInputReq.tag])
          break
        }
      }
    }
    span.addEventListener('click', click)

    qniConsole.addEventListener('qni-input-upload', function inputUpdate () {
      span.removeEventListener('click', click)
      qniConsole.removeEventListener('qni-input-upload', inputUpdate)
    })

    lastLine.appendChild(span)
  }

  function run_command (com: any[]) {
    switch (com[0]) {
      case Qni.HUB_REQ_CONSOLE_PRINT: {
        const dataType = com[1][0]
        const data = com[1][1]
        console.log(`print [${dataType}]: ${data}`)

        switch (dataType) {
          case Qni.PRINT: {
            print(data)
            break
          }
          case Qni.PRINT_BUTTON: {
            printbtn(data[0], data[1])
            break
          }

          case Qni.PRINT_LINE: {
            print(data)
            newline()
            break
          }

          case Qni.CLEAR_LINE: {
            clearConsole()
            break
          }

          case Qni.DELETE_LINE: {
            deleteline(data)
            break
          }

          case Qni.NEW_LINE: {
            newline()
            break
          }
        }
        break
      }
      case Qni.HUB_RES_FAIL: {
        console.error(`hub fail: ${com[1]}`)
        break
      }
      case Qni.HUB_REQ_CONSOLE_STATE_CHANGE: {
        console.log(`status update ${com[1][0]}: ${com[1][1]}`)
        status.set(com[1][0], com[1][1])
        break
      }
      case Qni.HUB_REQ_CONSOLE_INPUT: {
        curInputReq = new QniInputRequest(com[1][0], com[1][1], com[1][2])
        updateInput()
        break
      }
    }
  }

  ws.addEventListener('message', e => {
    try {
      const dat = new Uint8Array(e.data)
      const res = msgpack.decode(dat)
      console.log(`recv: [${res[0]}] ${res[1]}`)

      res[1].forEach(run_command)
      checkMaxLog()
      updateSystemElementStyle(document.body)
      updateSystemElementStyle(input)
      updateSystemElementStyle(inputBtn)

      switch (res.status) {
        case Qni.QniHubStatus.Ended:
          ws.close()
          break
      }

    } catch {
      ws.close()
    }

    return true
  })
}
