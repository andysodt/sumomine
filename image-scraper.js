const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// DISCLAIMER: This tool is for educational purposes only.
// Only use on websites where you have explicit permission to download images.
// Respect robots.txt, terms of service, and copyright laws.

async function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (educational image scraper)'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch: ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function downloadImage(imageUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = imageUrl.startsWith('https') ? https : http;

        const file = fs.createWriteStream(outputPath);

        protocol.get(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (educational image scraper)'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                fs.unlinkSync(outputPath);
                reject(new Error(`Failed to download: ${res.statusCode}`));
                return;
            }

            res.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(outputPath);
            });
        }).on('error', (err) => {
            fs.unlinkSync(outputPath);
            reject(err);
        });
    });
}

function extractImageUrls(html, baseUrl) {
    const imageUrls = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
        let imgUrl = match[1];

        // Convert relative URLs to absolute
        if (imgUrl.startsWith('//')) {
            imgUrl = 'https:' + imgUrl;
        } else if (imgUrl.startsWith('/')) {
            const base = new URL(baseUrl);
            imgUrl = `${base.protocol}//${base.host}${imgUrl}`;
        } else if (!imgUrl.startsWith('http')) {
            const base = new URL(baseUrl);
            imgUrl = `${base.protocol}//${base.host}/${imgUrl}`;
        }

        // Filter out data URIs and very small images
        if (!imgUrl.startsWith('data:') && !imgUrl.includes('1x1')) {
            imageUrls.push(imgUrl);
        }
    }

    return [...new Set(imageUrls)]; // Remove duplicates
}

async function scrapeImages(url, outputDir = './images', options = {}) {
    const {
        maxImages = 50,
        minSize = 0,
        filter = null,
        delay = 1000
    } = options;

    console.log(`Scraping images from: ${url}`);
    console.log(`Output directory: ${outputDir}`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        // Fetch HTML
        console.log('Fetching page...');
        const html = await fetchHTML(url);

        // Extract image URLs
        console.log('Extracting image URLs...');
        let imageUrls = extractImageUrls(html, url);

        // Apply filter if provided
        if (filter) {
            imageUrls = imageUrls.filter(url => url.includes(filter));
        }

        // Limit number of images
        imageUrls = imageUrls.slice(0, maxImages);

        console.log(`Found ${imageUrls.length} images to download`);

        // Download images
        let downloaded = 0;
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];

            try {
                // Generate filename from URL
                const urlPath = new URL(imageUrl).pathname;
                const filename = path.basename(urlPath) || `image_${i}.jpg`;
                const outputPath = path.join(outputDir, filename);

                console.log(`Downloading ${i + 1}/${imageUrls.length}: ${filename}`);
                await downloadImage(imageUrl, outputPath);
                downloaded++;

                // Respect rate limiting
                if (i < imageUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (err) {
                console.error(`Failed to download ${imageUrl}:`, err.message);
            }
        }

        console.log(`\nCompleted! Downloaded ${downloaded} images to ${outputDir}`);
        return downloaded;

    } catch (err) {
        console.error('Scraping failed:', err.message);
        throw err;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Image Scraper Tool
==================

DISCLAIMER: This tool is for educational purposes only.
Only use on websites where you have explicit permission to download images.
Respect robots.txt, terms of service, and copyright laws.

Usage:
  node image-scraper.js <URL> [options]

Options:
  --output <dir>      Output directory (default: ./images)
  --max <number>      Maximum number of images to download (default: 50)
  --filter <text>     Only download images whose URL contains this text
  --delay <ms>        Delay between downloads in milliseconds (default: 1000)

Examples:
  node image-scraper.js https://example.com
  node image-scraper.js https://example.com --output ./photos --max 20
  node image-scraper.js https://example.com --filter "rikishi" --delay 2000
        `);
        process.exit(0);
    }

    const url = args[0];
    const options = {
        outputDir: './images',
        maxImages: 50,
        filter: null,
        delay: 1000
    };

    // Parse command line arguments
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--output' && args[i + 1]) {
            options.outputDir = args[i + 1];
            i++;
        } else if (args[i] === '--max' && args[i + 1]) {
            options.maxImages = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--filter' && args[i + 1]) {
            options.filter = args[i + 1];
            i++;
        } else if (args[i] === '--delay' && args[i + 1]) {
            options.delay = parseInt(args[i + 1]);
            i++;
        }
    }

    scrapeImages(url, options.outputDir, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { scrapeImages, downloadImage, extractImageUrls };
