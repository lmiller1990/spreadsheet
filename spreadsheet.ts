export type CellType = 'primitive' | 'formula'
export interface Cell {
  value: string // a, ct, dog, =SUM()
  type: CellType
}


export type Cells = Record<string, Cell>

export interface Sheet {
  states: Cells[]
}

export interface UICell {
  value: string
  displayValue: () => string
  col: string // a, b, c.... z
  row: number // 1 2 3....
}

export interface UpdateCell {
  value: string
  index: string // a1, b2
}

function inferType(cell: UpdateCell): CellType {
  if (cell.value.startsWith('=')) {
    return 'formula'
  }

  return 'primitive'
}

export interface AddRow {
  at: number // 1, 2, 3...
  position: 'before' | 'after'
}

export function addRow(state: Cells, { at, position }: AddRow): Cells {
  // at the end
  const { rows } = calcMaxDimensions(state)
  if (rows === at) {
    const newState: Cells = JSON.parse(JSON.stringify(state))
    newState[`a${rows + 1}`] = { type: 'primitive', value: '' }
    return newState
  } 

  const newState: Cells = {}

  for (const key of Object.keys(state)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)

    if (parseInt(row) <= at) {
      newState[`${col}${row}`] = state[`${col}${row}`]
    } else {
      newState[`${col}${parseInt(row) + 1}`] = state[`${col}${row}`]
    } 
  }


  return newState
}

export function updateCell(state: Cells, cell: UpdateCell) {
  const newState: Cells = JSON.parse(JSON.stringify(state))
  if (!newState[cell.index]) {
    newState[cell.index] = { 
      value: cell.value,
      type: inferType(cell)
    }
  }

  newState[cell.index].value = cell.value
  newState[cell.index].type = inferType(cell)
  return newState
}

// =SUM(a1, a2)
export function deriveFormula(state: Cells, cell: Cell): string {
  const [_, matches] = cell.value.match(/=SUM\((.*)\)/)
  const indexes = matches.split(',')
  const invalid = indexes.some(x => {
    if (!state[x.trim()]) {
      return true
    }

    if (isNaN(parseInt(state[x.trim()].value))) {
      return true
    }
  })

  if (invalid) {
    return 'NaN'
  }

  const numbers = matches.split(',').map(x => parseInt(state[x.trim()].value))
  return numbers.reduce((acc, curr) => acc + curr, 0).toString()
}

function displayValueFactory(state: Cells, cell?: Cell): () => string {
  if (!cell) {
    return () => ''
  }

  if (cell.type === 'primitive') {
    return () => cell.value
  }

  if (cell.type === 'formula') {
    return () => deriveFormula(state, cell)
  }
}

export function render(state: Cells): UICell[][] {
  const rendered: UICell[][] = []
  const { cols, rows } = calcMaxDimensions(state)

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []

    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 'a'.charCodeAt(0))
      const idx = `${letter}${j + 1}`
      const cell = state[idx]

      row.push({
        value: cell?.value || '',
        displayValue: displayValueFactory(state, cell),
        col: letter,
        row: j + 1
      })
    }
    rendered.push(row)
  }

  return rendered
}

export interface Dimensions {
  cols: number
  rows: number
}

export function calcMaxDimensions(state: Cells): Dimensions { 
  const rows: number[] = []
  const cols: string[] = []

  for (const key of Object.keys(state)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rows: Math.max(...rows)
  }
}