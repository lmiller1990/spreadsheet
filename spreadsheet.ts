export interface Cell {
  value: string
  type: 'primitive' | 'formula'
}

export interface Sheet {
  cells: Record<string, Cell>
}

interface Dimensions {
  rows: number
  cols: number
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
    rows: Math.max(...rows),
    cols: cols.sort().reverse()[0].charCodeAt(0) - 'a'.charCodeAt(0) + 1
  }
}

export interface UICell {
  value: string
  row: number
  col: string
}

export function updateCell(sheet: Sheet, cell: UICell, value: string) {
  const idx = `${cell.col}${cell.row}`
  sheet.cells[idx].value = value
}

export function render(sheet: Sheet): UICell[][] {
  const { rows, cols } = calcMaxDimensions(sheet)
  const rendered: UICell[][] = []

  for (let j = 0; j < rows; j++) {
    const row: UICell[] = []
    for (let i = 0; i < cols; i++) {
      const letter = String.fromCharCode(i + 97)
      const index = `${letter}${j + 1}`
      row.push({ 
        row: j + 1,
        col: letter,
        value: sheet.cells[index].value
      })
    }
    rendered.push(row)
  }

  return rendered
}
