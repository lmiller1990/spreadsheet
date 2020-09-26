import { reactive, ref, toRaw } from 'vue'
import { Sheet, updateCell, UpdateCell } from '../spreadsheet'

const sheet: Sheet = reactive<Sheet>({
  states: [
    {
      'a1': {
        value: '100',
        type: 'primitive'
      },
      'a2': {
        value: '200',
        type: 'primitive'
      },
      'b1': {
        value: '300',
        type: 'primitive'
      },
      'b2': {
        value: '=SUM(a1, a2)',
        type: 'formula'
      },
    }
  ]
})

const currentState = ref<number>(0)

function update(index: string, value: string) {
  const state = JSON.parse(JSON.stringify(sheet.states[currentState.value]))
  const newState = updateCell(state, {
    index,
    value
  })
  sheet.states.push(newState)
  currentState.value += 1
}

export function useSheet() {
  return {
    currentState,
    sheet,
    update
  }
}