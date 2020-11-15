import { split } from '../src/shlex'
;
['data:"hello world":1 "gb s"'].map((q) => {
  console.dir(split(q), { depth: null })
})
