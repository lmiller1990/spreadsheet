export interface Cell {
  value: string // a, ct, dog, =SUM()
  type: 'primitive' | 'formula'
}

export interface Sheet {
  cells: Record<string, Cell>
}

export interface UICell {
  value: string
  displayValue: () => string
  col: string // a, b, c.... z
  row: number // 1 2 3....
}

interface UpdateCell {
  value: string
  index: string // a1, b2
}

export function updateCell(sheet: Sheet, cell: UpdateCell) {
  sheet.cells[cell.index].value = cell.value
}

// =SUM(a1, a2)
export function deriveFormula(sheet: Sheet, cell: Cell) {
  const [_, matches] = cell.value.match(/=SUM\((.*)\)/)
  const numbers = matches.split(',').map(x => parseInt(sheet.cells[x.trim()].value))
  return numbers.reduce((acc, curr) => acc + curr, 0).toString()
}

function displayValueFactory(sheet: Sheet, cell?: Cell): () => string {
  if (!cell) {
    return () => ''
  }

  if (cell.type === 'primitive') {
    return () => cell.value
  }

  if (cell.type === 'formula') {
    return () => deriveFormula(sheet, cell)
  }
}

export function render(sheet: Sheet): UICell[][] {
  const rendered: UICell[][] = []
  const { cols, rows } = calcMaxDimensions(sheet)

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []

    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 'a'.charCodeAt(0))
      const idx = `${letter}${j + 1}`
      const cell = sheet.cells[idx]

      row.push({
        value: cell?.value || '',
        displayValue: displayValueFactory(sheet, cell),
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

export function calcMaxDimensions(sheet: Sheet): Dimensions { 
  const rows: number[] = []
  const cols: string[] = []

  for (const key of Object.keys(sheet.cells)) {
    const [_, col, row] = key.match(/(\w.*?)(\d.*)/)
    rows.push(parseInt(row))
    cols.push(col)
  }

  return {
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    rows: Math.max(...rows)
  }
}