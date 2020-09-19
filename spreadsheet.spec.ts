import { Dimensions, calcMaxDimensions, Cell, Sheet, render, UICell, updateCell, deriveFormula } from './spreadsheet'

const createSheet = (): Sheet => ({
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

test('deriveFormula', () => {
  const sheet = createSheet()
  const actual = deriveFormula(sheet, sheet.cells['b2'])
  expect(actual).toBe('300')
})

test('updateCell', () => {
  const sheet = createSheet()
  updateCell(sheet, {
    value: '1000',
    index: 'b1'
  })
  expect(sheet.cells['b1'].value).toBe('1000')
})

describe('calcMaxDimensions', () => {
  it('calcualtion dimensions', () => {
    const sheet = createSheet()
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
    const sheet = createSheet()
    const actual = render(sheet).map(row => {
      return row.map(cell => {
        const { displayValue, ...rest } = cell
        return rest
      })
    })

    const expected = [
      [{ row: 1, col: 'a', value: '100' }, { row: 1, col: 'b', value: '300' }],
      [{ row: 2, col: 'a', value: '200' }, { row: 2, col: 'b', value: '=SUM(a1, a2)' }]
    ]

    expect(actual).toEqual(expected)
  })
})