import { computed, reactive } from 'vue'
import { Sheet, render } from '../spreadsheet'

const sheet: Sheet = reactive<Sheet>({
  cells: {
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
})

export function useSheet() {
  return {
    sheet
  }
}