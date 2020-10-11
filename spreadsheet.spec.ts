import { insertRow, Dimensions, calcMaxDimensions, Cell, Sheet, render, UICell, updateCell, deriveFormula, Cells } from './spreadsheet'

const createSheet = (): Sheet => ({
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

test('deriveFormula', () => {
  const sheet = createSheet()
  const actual = deriveFormula(sheet.states[0], sheet.states[0]['b2'])
  expect(actual).toBe('300')
})

test('deriveFormula', () => {
  const state: Cells = {
    a1: {
      value: '=SUM(a2)',
      type: 'formula'
    }
  }
  const actual = deriveFormula(state, state['a1'])
  expect(actual).toBe('NaN')
})

test('updateCell', () => {
  const sheet = createSheet()
  const actual = updateCell(sheet.states[0], {
    value: '1000',
    index: 'b1'
  })
  expect(actual['b1'].value).toBe('1000')
})

test('updateCell', () => {
  const sheet = createSheet()
  const actual = updateCell(sheet.states[0], {
    value: '1000',
    index: 'b100'
  })
  expect(actual['b100'].value).toBe('1000')
})

test('insertRow', () => {
  const state: Cells = {
    a1: {
      type: 'primitive',
      value: '100'
    },
    a2: {
      type: 'primitive',
      value: '200'
    }
  }

  const expected = {
    a1: {
      type: 'primitive',
      value: '100'
    },
    a3: {
      type: 'primitive',
      value: '200'
    }
  }

  const actual = insertRow(state, { at: 1, position: 'after' })
  expect(actual).toEqual(expected)
})

test('insertRow', () => {
  const state: Cells = {
    a1: {
      type: 'primitive',
      value: '100'
    }
  }

  const expected = {
    a1: {
      type: 'primitive',
      value: '100'
    },
    a2: {
      type: 'primitive',
      value: ''
    }
  }

  const actual = insertRow(state, { at: 1, position: 'after' })
  expect(actual).toEqual(expected)
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