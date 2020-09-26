import { Dimensions, calcMaxDimensions, Cell, Sheet, render, UICell, updateCell, deriveFormula } from './spreadsheet'

const createSheet = (): Sheet => ({
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

test('deriveFormula', () => {
  const sheet = createSheet()
  const actual = deriveFormula(sheet.states[0], sheet.states[0]['b2'])
  expect(actual).toBe('300')
})

describe('updateCell', () => {
  it('updates value and type', () => {
    const sheet = createSheet()
    updateCell(sheet, {
      value: '=SUM(a1)',
      index: 'b1'
    })

    expect(sheet.states[1]['b1'].value).toBe('=SUM(a1)')
    expect(sheet.states[1]['b1'].type).toBe('formula')
  })
})

describe('calcMaxDimensions', () => {
  it('calcualtion dimensions', () => {
    const sheet = createSheet()
    const actual = calcMaxDimensions(sheet.states[0])
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
    const actual = render(sheet.states[0]).map(row => {
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