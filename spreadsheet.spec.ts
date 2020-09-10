import { Dimensions, calcMaxDimensions, Cell, Sheet, render, UICell } from './spreadsheet'

const sheet: Sheet = {
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
  }
}

describe('calcMaxDimensions', () => {
  it('calcualtion dimensions', () => {
    const actual = calcMaxDimensions(sheet)
    const expected: Dimensions = {
      cols: 2,
      rows: 2
    }

    expect(actual).toEqual(expected)
  })
})

describe('render', () => {
  it('transforms into a ui rep', () => {
    const actual = render(sheet)
    const expected: UICell[][] = [
      [{ row: 1, col: 'a', value: '100' }, { row: 1, col: 'b', value: '300' }],
      [{ row: 2, col: 'a', value: '200' }, { row: 2, col: 'b', value: '' }],
    ]

    expect(actual).toEqual(expected)
  })
})