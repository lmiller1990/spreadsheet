import { computed, reactive, ref } from 'vue'
import { Sheet, render, UpdateCell, updateCell } from '../spreadsheet'

const sheet: Sheet = reactive<Sheet>({
  states: [{
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
  }]
})

const currentStateIndex = ref(0)

function update(cell: UpdateCell) {
  const newState = updateCell(sheet.states[currentStateIndex.value], cell)
  sheet.states.push(newState)
  currentStateIndex.value += 1
}

export function useSheet() {
  return {
    sheet,
    update,
    currentStateIndex
  }
}