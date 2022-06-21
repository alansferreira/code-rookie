import { readFileSync } from 'fs'
import { app } from './app'

const packageJson = JSON.parse(readFileSync('../package.json').toString())

const PORT_NUMBER = process.env.PORT_NUMBER || 3000

app.listen(PORT_NUMBER, () => {
  console.log(` 🚀 ${packageJson.name} listen on ${PORT_NUMBER}!`)
})
