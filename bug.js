const { reactive, ref, toRaw } = require('vue')

const sheet = reactive({
  state: [
    {
      a1: {
        val: 1
      }
    }
  ]
})

const current = {...sheet.state[0]}

function addAnotherState(curr) {
  const copy = curr
  copy.a1.val = 3
  return copy
}

const newOne = addAnotherState(current)
sheet.state.push(newOne)

console.log(sheet)
console.log(JSON.stringify(sheet))
