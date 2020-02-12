import QSearch from '../src'

describe('learn-unicode', () => {
  const search = new QSearch({
    schema: {
      codePoint: { type: 'number' },
      frequency: { type: 'number' },
      type: { isAny: false },
      description: {},
      hint: {},
      alt: { isAny: false },
      code: {}
    }
  })

  ;[
    '+type:emoji',
    '+type:emoji ?function',
    '+type:emoji ?function -funeral'
  ].map((q) => {
    it(q, () => {
      console.dir(search.parse(q), { depth: null })
    })
  })
})
