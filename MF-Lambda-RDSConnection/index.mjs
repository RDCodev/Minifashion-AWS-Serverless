import connection from './config'

export const handle = async (event) => {

  const result = []
  const { queries } = event

  try {

    const [rows, _] = await Promise.all(
      queries.map(sql => connection.query(sql))
    )

    if (!rows.length) throw new Error("Result's not found")

    result = [...rows.flat(Infinity)]

    return { result }

  } catch (error) {
    throw error
  }
}