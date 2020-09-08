import { Sheet, calcMaxDimensions, render, Cell, UICell } from './spreadsheet'

describe('calcDimensions', () => {
  it('works for many cells', () => {
    const cell = (): Cell => ({
      type: 'primitive',
      value: ''
    })

    expect(calcMaxDimensions({
      cells: {
        'a1': cell(),
        'b1': cell(),
        'c1': cell(),
        'a2': cell(),
        'b2': cell(),
        'c2': cell()
      }
    })).toEqual({ rows: 2, cols: 3 })
  })
})

describe('render', () => {
  test('transforms into a multidimensions array suitable for looping', () => {
    const sheet: Sheet = {
      cells: {
        'a1': {
          value: '1',
          type: 'primitive',
        },
        'a2': {
          value: '2',
          type: 'primitive',
        },
        'b1': {
          value: '3',
          type: 'primitive',
        },
        'b2': {
          value: '4',
          type: 'primitive',
        }
      }
    }

    const expected: UICell[][] = [
      [{ value: '1', col: 'a', row: 1 }, { value: '3', col: 'b', row: 1 }],
      [{ value: '2', col: 'a', row: 2 }, { value: '4', col: 'b', row: 2 }],
    ]

    expect(render(sheet)).toEqual(expected)
  })
})
