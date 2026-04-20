const mongoose = require('mongoose')
const crypto = require('crypto')

const uuidv7 = () => {
  const bytes = crypto.randomBytes(16)
  const time = BigInt(Date.now())

  bytes[0] = Number((time >> 40n) & 0xffn)
  bytes[1] = Number((time >> 32n) & 0xffn)
  bytes[2] = Number((time >> 24n) & 0xffn)
  bytes[3] = Number((time >> 16n) & 0xffn)
  bytes[4] = Number((time >> 8n) & 0xffn)
  bytes[5] = Number(time & 0xffn)
  bytes[6] = (0x70 | (bytes[6] & 0x0f))
  bytes[8] = (0x80 | (bytes[8] & 0x3f))

  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const profileModel = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv7,
  },
  id: {
    type: String,
    default: function () {
      return this._id
    },
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  gender_probability: {
    type: Number,
    required: true
  },
  sample_size: {
        type: Number,
      },
  age:{
    type: Number,
    required: true
  },
  age_group:{
    type: String,
    required: true,
    enum: ['child', 'teenager', 'adult', 'senior']
  },
  country_id:{
    type: String,
    required: true,
    minlength: 2,
    maxlength: 2
  },
  country_name: {
    type: String,
    required: true
  },
  country_probability:{
    type: Number,
    required: true
  },
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
}
)

profileModel.index({ gender: 1 })
profileModel.index({ age_group: 1 })
profileModel.index({ country_id: 1 })
profileModel.index({ age: 1 })
profileModel.index({ created_at: -1 })

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileModel)
