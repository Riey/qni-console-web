export class QniInputRequest {
  data: any
  expire: number
  tag: number

  constructor (data: any, expire: number, tag: number) {
    this.data = data
    this.expire = expire
    this.tag = tag
  }
}
