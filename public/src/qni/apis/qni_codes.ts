export enum QniInputRequestDataType {
  INPUT_REQ_TOUCH = 0,
  INPUT_REQ_ENTER = 1,
  INPUT_REQ_ANYKEY = 2,
  INPUT_REQ_BOOLEAN = 3,
  INPUT_REQ_STR = 10,
  INPUT_REQ_STR_MAX_LEN = 11,
  INPUT_REQ_STR_SELECT = 12,
  INPUT_REQ_INT = 20,
  INPUT_REQ_INT_MAX_LEN = 21,
  INPUT_REQ_FLOAT = 30,
  INPUT_REQ_FLOAT_MAX_LEN = 31,
  INPUT_REQ_DATE = 40,
  INPUT_REQ_DATETIME = 41,
  INPUT_REQ_TIME = 42,
  INPUT_REQ_COLOR = 50
}

export type QniInputTag = number;
export type QniInputRequestData = [number, null | number | string[]];
export type QniInputRequest = [QniInputRequestData, string | null, QniInputTag];

export enum QniInputResponseDataType {
  INPUT_RES_EMPTY = 0,
  INPUT_RES_BOOLEAN = 10,
  INPUT_RES_STR = 11,
  INPUT_RES_INT = 12,
  INPUT_RES_FLOAT = 13,
  INPUT_RES_DATE = 20,
  INPUT_RES_DATETIME = 21,
  INPUT_RES_TIME = 22
}

export type QniInputResponseData = [QniInputResponseDataType, null | number | string | boolean | QniColor];
export type QniInputResponse = [QniInputResponseData, QniInputTag];

export enum QniConsolePrintDataType {
  PRINT = 0,
  PRINT_LINE = 1,
  PRINT_BUTTON = 2,
  PRINT_IMG = 3,
  NEW_LINE = 10,
  DELETE_LINE = 20,
  CLEAR_LINE = 21
}

export type QniPrintButtonData = [string, QniInputResponseData];
export type QniConsolePrintData = [QniConsolePrintDataType, string | QniPrintButtonData | number | null];

export enum QniFontStyle {
  REGULAR = 0b000,
  ITALIC = 0b001,
  BOLD = 0b010,
  UNDERLINE = 0b100
}

export type QniFont = [string | null, number, QniFontStyle];

export enum QniConsoleSettingItemType {
  SETTING_TEXT_COLOR = 0,
  SETTING_BACK_COLOR = 1,
  SETTING_HIGHLIGHT_COLOR = 2,
  SETTING_FONT = 10,
  SETTING_TEXT_ALIGN = 20
}

export enum QniTextAlign {
  LEFT = 0,
  RIGHT = 1,
  CENTER = 2
}

export type QniColor = [number, number, number];
export type QniConsoleSettingItem = [QniConsoleSettingItemType, QniColor | QniFont | QniTextAlign];

export enum QniConsoleRequestType {
  CON_REQ_LOAD_STATE = 0,
  CON_REQ_SHARE_STATE = 1,
  CON_REQ_GET_STATE = 2
}

export type QniConsoleRequest = [QniConsoleRequestType, number | null];

export enum QniConsoleResponseType {
  CON_RES_OK_INPUT = 0,
  CON_RES_OK_ACCEPT_INPUT = 1,
  CON_RES_ERR = 255
}

export type QniConsoleResponse = [QniConsoleResponseType, QniInputResponse | null | string];

export enum QniConsoleMessageType {
  CON_MSG_REQ = 0,
  CON_MSG_RES = 1
}

export type QniConsoleMessage = [QniConsoleMessageType, QniConsoleRequest | QniConsoleResponse];

export enum QniProgramCommandType {
  PROG_COM_PRINT = 0,
  PROG_COM_UPDATE_SETTING = 1
}

export type QniProgramCommand = [QniProgramCommandType, QniConsolePrintData | QniConsoleSettingItem];

export enum QniProgramRequestType {
  PROG_REQ_INPUT = 0,
  PROG_REQ_ACCEPT_INPUT = 1
}

export type QniProgramRequest = [QniProgramRequestType, QniInputRequest | QniInputTag];

export enum QniProgramResponseType {
  PROG_RES_OK_LOAD_STATE = 0,
  PROG_RES_OK_SHARE_STATE = 1,
  PROG_RES_OK_GET_STATE = 2,
  PROG_RES_ERR = 255
}

export type QniProgramResponse = [QniProgramResponseType, null | QniProgramCommand[] | string | number];

export enum QniProgramMessageType {
  PROG_MSG_REQ = 0,
  PROG_MSG_RES = 1
}

export type QniProgramMessage = [QniProgramMessageType, QniProgramRequest | QniProgramResponse];
