const request = require('request-promise');
const cheerio = require('cheerio');
const Downloader = require('mt-files-downloader');
const path = require('path');
const fs = require('fs');
const handleEvents = require('./lib/_handleEvents');
const printStats = require('./lib/_printStats');
const config = require('./config');

const registerDlEvents = function(num, dl) {
	handleEvents(dl, num);
	printStats(dl, num);
};

const scrapeAlbums = async function(){
    const url = config.AUDIO_DESCOURSES_URL_TO_DOWNLOAD;
    const html = await request.get(url);
    const $ = cheerio.load(html);
    const albumURL = [];
    $('.discourses_link').each((index, element)=>{
        const url = 'http://oshoworld.com/discourses/';
        const linkText = $(element).text();
        if(linkText.includes('Download')){
            albumURL.push(url+$(element).attr('href'))
        }
    });
    return albumURL;
}

const scrapeFiles = async function(){
    const albums = await scrapeAlbums();
    
    const fileUrls = [];
    let downloadUrl;
    if(config.AUDIO_DESCOURSES_URL_TO_DOWNLOAD.includes('hindi')){
        downloadUrl = 'http://www.oshoarchive.com/ow-hindi/';
    } else{
        downloadUrl = 'http://www.oshoarchive.com/ow-english/';
    }
    for(url of albums){
        const html = await request.get(url);
        const $ = cheerio.load(html);
        $('.track_txt').each((index, element)=>{
            if($(element).text().endsWith('.mp3')){
                let fileName = $(element).text().trim();
                fileName = fileName.replace(/ /g, '_');
                fileUrls.push(downloadUrl + fileName);
            }
        })
    }
    return fileUrls;
}

const downloadFiles = async function(){
    const fileUrls = await scrapeFiles();
    if (!fs.existsSync(config.DOWNLOAD_PATH)){
        fs.mkdirSync(config.DOWNLOAD_PATH);
    }

    const downloader = new Downloader();
    for(url of fileUrls){
        const audioFolderName = path.basename(url).slice(5);
        const downloadPath = config.DOWNLOAD_PATH + audioFolderName.slice(0, audioFolderName.length-7) + '/';
        if (!fs.existsSync(downloadPath)){
            fs.mkdirSync(downloadPath);
        }
        const fileName = path.basename(url).slice(5);
        const dl = downloader.download(url, downloadPath +fileName);
        // Set retry options
        dl.setRetryOptions({
            maxRetries: 10,		// Default: 5
            retryInterval: 4000 // Default: 2000
        });

        // Set download options
        dl.setOptions({
            threadsCount: 1, // Default: 2, Set the total number of download threads
            method: 'GET', 	 // Default: GET, HTTP method
            port: 80, 	     // Default: 80, HTTP port
            timeout: 10000,   // Default: 5000, If no data is received, the download times out (milliseconds)
            range: '0-100',  // Default: 0-100, Control the part of file that needs to be downloaded.
        });
        registerDlEvents(fileName, dl);
        dl.start();
        dl.on('start', function() {
            console.log('Download started with '+ ((dl.meta.threads) ? dl.meta.threads.length : 0) +' threads.')
        });
    }
}

downloadFiles();