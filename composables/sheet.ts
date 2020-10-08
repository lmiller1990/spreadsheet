import { computed, reactive, ref, readonly } from 'vue'
import { Sheet, render, UpdateCell, updateCell, addRow } from '../spreadsheet'

const sheet: Sheet = reactive<Sheet>({
  states: [{
    'a1': {
      value: '100',
      type: 'primitive'
    },
    'a3': {
      value: '200',
      type: 'primitive'
    },
  }]
})

const currentStateIndex = ref(0)
const selectedCell = ref<number>()

function setSelectedCell(cell: number) {
  selectedCell.value = cell
}

function update(cell: UpdateCell) {
  const newState = updateCell(sheet.states[currentStateIndex.value], cell)
  sheet.states.push(newState)
  currentStateIndex.value += 1
}

function insertRowAfter(row: number) {
  const newState = addRow(sheet.states[currentStateIndex.value], { at: row, position: 'after' })
  sheet.states.push(newState)
  currentStateIndex.value += 1
}

export function useSheet() {
  return {
    selectedCell: readonly(selectedCell),
    insertRowAfter,
    sheet,
    setSelectedCell,
    update,
    currentStateIndex
  }
}