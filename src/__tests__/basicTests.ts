import 'jest-extended'

import { EthrStatusRegistry } from '../index'

test('should be able to instantiate Status', () => {
  expect(new EthrStatusRegistry()).not.toBeNil()
})
