



import express from 'express' 
import path from 'path'


const app = express()
const port = 3000
const __dirname = path.resolve()



app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/Waiwoot', (req, res) => {
  res.send('Hello Waiwoot...!')
})
app.get('/dashboard', (req, res) => {
     res.sendFile('test3.html', { root: __dirname })
    
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
