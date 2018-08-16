
export const CON_RES_INPUT = 0
export const CON_RES_FAIL = 100

export const HUB_REQ_CONSOLE_INPUT = 0
export const HUB_REQ_CONSOLE_PRINT = 1
export const HUB_REQ_CONSOLE_STATE_CHANGE = 2
export const HUB_RES_FAIL = 100

export enum QniHubStatus {
  Starting = 0,
  Running = 1,
  Waiting = 2,
  Ended = 3
}

export const INPUT_REQ_TOUCH = 0
export const INPUT_REQ_ENTER = 1
export const INPUT_REQ_ANYKEY = 2
export const INPUT_REQ_BOOLEAN = 3
export const INPUT_REQ_STR = 10
export const INPUT_REQ_STR_MAX_LEN = 11
export const INPUT_REQ_STR_SELECT = 12
export const INPUT_REQ_INT = 20
export const INPUT_REQ_INT_MAX_LEN = 21
export const INPUT_REQ_FLOAT = 30
export const INPUT_REQ_FLOAT_MAX_LEN = 31
export const INPUT_REQ_DATE = 40
export const INPUT_REQ_DATETIME = 41
export const INPUT_REQ_TIME = 42

export const INPUT_RES_EMPTY = 0
export const INPUT_RES_BOOLEAN = 10
export const INPUT_RES_STR = 11
export const INPUT_RES_INT = 12
export const INPUT_RES_FLOAT = 13
export const INPUT_RES_DATE = 20
export const INPUT_RES_DATETIME = 21
export const INPUT_RES_TIME = 22

export const PRINT = 0
export const PRINT_LINE = 1
export const PRINT_BUTTON = 2
export const PRINT_IMG = 3
export const NEW_LINE = 10
export const DELETE_LINE = 20
export const CLEAR_LINE = 21
