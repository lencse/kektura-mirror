#!/usr/bin/env node

require('dotenv').config()

const AWS = require('aws-sdk')
const axios = require('axios')
const { load } = require('cheerio')
const moment = require('moment')

const httpGet = async (url) => {
    const res = await axios.get(url)
    return res.data
}

const trackGpxUrl = (links) => {
    for (const idx in Object.keys(links)) {
        const { href } = links[idx].attribs
        if (idx.match(/^\d+$/) && href.match(/okt_teljes_gpx/)) {
            return href
        }
    }
    throw new Error('Not found track gpx link')
}

const main = async () => {
    const html = await httpGet('https://kektura.hu/szakaszok.html')
    const dom = load(html)
    const links = dom('a[href$=".gpx"]')

    AWS.config.update({
        region: process.env.AWS_REGION
    })

    const path = moment().format('YYYY-MM-DD')

    const tasks = [
        {
            url: `https://kektura.hu/${trackGpxUrl(links)}`,
            filename: 'track.gpx'
        }, {
            url: `http://turistautak.openstreetmap.hu/pecsetmind.php?ph=Orsz%C3%A1gos%20K%C3%A9kt%C3%BAra`,
            filename: 'stamps.gpx'
        }
    ]

    tasks.forEach(async ({url, filename}) => {
        const content = await httpGet(url)
        const uploadTask = new AWS.S3.ManagedUpload(
            {
                params: {
                    Bucket: process.env.AWS_BUCKET,
                    Key: `${path}/${filename}`,
                    Body: content,
                    ACL: 'public-read'
                }
            }
        ).promise()
        const response = await uploadTask
        console.info(response.Location, 'uploaded')
    })

}

process.on('unhandledRejection', (err) => {
    throw err
})

main()
