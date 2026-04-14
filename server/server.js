const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000
require('dotenv').config()
const Data = require('./models/dataModel')

app.use(cors())

cors({
  accessControlAllowOrigin: '*',
})

/// utility functions
const classifyAge = (age) => {
  let ageGroup

  if (age >= 0 && age <= 12) ageGroup = 'child'
  else if (age > 12 && age <= 19) ageGroup = 'teenager'
  else if (age > 19 && age <= 59) ageGroup = 'adult'
  else if (age >= 60) ageGroup = 'senior'

  return ageGroup
}

const getHighestProbability = (data) => {
  data.sort((a, b) => b.probability - a.probability)
  return data[0]
}
////////
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' })
})


app.get('/api/classify', async (req, res) => {

  try {
    const { name } = req.query
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (!name || name.trim().length === 0 || name === "''") 
      return res.status(400).json({ status: "error", message: "Missing or empty name parameter" })

    if (typeof name !== "string")
      return res.status(422).json({ status: "error", message: "Name is not a string" })

    
    const apiRes = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`)
    
    const apiData = await apiRes.json()
    
    if (!apiData.gender || !apiData.count) 
      return res.json({ status: "error", message: "No apiData or prediction available for the provided name" })
    
    const UTCDate = new Date().toISOString()

    const response = {
      name,
      gender: apiData?.gender,
      probability: apiData?.probability,
      sample_Size: apiData?.count,
      is_confident: apiData?.probability >= 0.7 && apiData?.count >= 100,
      processed_at: UTCDate
    }

    res.status(200).json({
      status: "success",
      data: response
    })

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'An error occurred while processing the request.'
    })
  }
})

app.post('/api/profiles', async(req, res) => {
  try{
    const {name} = req.query
    
    if (!name || name.trim().length === 0 || name === "''") 
      return res.status(400).json({ status: "error", message: "Missing or empty name parameter" })

    if (typeof name !== "string")
      return res.status(422).json({ status: "error", message: "Name is not a string" })

    const genderData = await (await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`)).json()
    const ageData = await (await fetch(`https://api.agify.io?name=${encodeURIComponent(name)}`)).json()
    const countryData = await (await fetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`)).json()

    

    const compiledData = {
      name,
      gender:genderData.gender,
      gender_probability: genderData.probability,
      sample_size:genderData.count,
      age:ageData.age,
      age_group: classifyAge(ageData.age),
      country_id: getHighestProbability(countryData.country).country_id,
      country_probability: getHighestProbability(countryData.country).probability
    }

    if (!genderData.gender || !genderData.count) 
      return res.json({ status: "error", message: "No gender prediction available for the provided name" })
    
    if (!ageData.age) 
      return res.json({ status: "error", message: "No age prediction available for the provided name" })

    if (!countryData.country) 
      return res.json({ status: "error", message: "No country data available for the provided name" })
    
    const existingData = await Data.findOne({name})
    
    if(existingData)
      return res.json({status:"success", message:"Profile already exists", data: existingData}) 

    const savedData = new Data (compiledData)

    await savedData.save()
    
    
    res.status(200).json({
      status: "success",
      data: savedData
    })

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Server Error"
    })
  }
})



mongoose.connect(process.env.MONGODB_URI)
.then(()=> {
  
  console.log('Connected to database')

  if (process.env.ENVIRONMENT !== 'production') {
    app.listen(PORT, () => console.log(`Local server running on port ${PORT}`))
  }  
})


module.exports = app