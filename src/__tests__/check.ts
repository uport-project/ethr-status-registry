
//TODO: paste the token to be checked in this string
const token =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzMxNDA1NjQsInN0YXR1cyI6eyJ0eXBlIjoiRXRoclN0YXR1c1JlZ2lzdHJ5MjAxOSIsImlkIjoicmlua2VieToweDFFNDY1MWRjYTVFZjM4NjM2ZTJFNEQ3QTZGZjRkMjQxM2ZDNTY0NTAifSwiaXNzIjoiZGlkOmV0aHI6MHgxRkNmOGZmNzhhQzUxMTdkOWM5OUI4MzBjNzRiNjY2OEQ2QUMzMjI5In0.lJbc6Je-tFtQeZnGd6Rv-QvLKJZhN3UmdVZ9hGWRQy7za88fo2YlNeZ6eRN6YnnHLYUl4lnIDkmzg6mVgBqZygA"

//TODO: get an infura project ID
const infuraId = "your infura project ID"

import { EthrStatusRegistry } from '../index'

it('should check the token', async () => {
  const status = new EthrStatusRegistry({infuraProjectId : infuraId})
  console.log( await status.checkStatus(token))
})