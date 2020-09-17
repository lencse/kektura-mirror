require('dotenv').config()

const axios = require('axios')
const moment = require('moment')

const { AWS_BUCKET, AWS_REGION } = process.env
const path = moment().format('YYYY-MM-DD')

const files = ['track.gpx', 'stamps.gpx']

files.forEach((filename) => {
    test(`Verify ${filename}`, async() => {
        const res = await axios.get(`https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${path}/${filename}`)
        expect(res.status).toBe(200)
        expect(res.data.length).toBeGreaterThan(1024)
        expect(res.data).toMatch(/<gpx.*\/gpx>/s)
    })
})
