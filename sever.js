var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var app = express()
var Canvas = require('canvas')
var Image = Canvas.Image

app.use(bodyParser.json({
  limit: '2mb'
}))

app.get('/', function(req, res) {
  res.status(200).end()
})

function filterCanvas (filter, canvas, ctx) {
  if (canvas.width > 0 && canvas.height > 0) {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    filter(imageData)
    ctx.putImageData(imageData, 0, 0)
  }
}

  // filter that shifts all color information to red
function blue (pixels, args) {
  var d = pixels.data
  for (var i = 0; i < d.length; i += 4) {
    var r = d[i]
    var g = d[i + 1]
    var b = d[i + 2]
    d[i] = (r+g+b)/3        // apply average to red channel
    d[i + 1] = d[i + 0] = 0 // zero out green and blue channel
  }
  return pixels
}


 // filter that shifts all color information to red
function red (pixels, args) {
  var d = pixels.data
  for (var i = 0; i < d.length; i += 4) {
    var r = d[i]
    var g = d[i + 1]
    var b = d[i + 2]
    d[i] = (r+g+b)/3       // apply average to red channel
    d[i + 1] = d[i + 2] = 0 // zero out green and blue channel
  }
  return pixels
} 

function lens3D (buffer) {
  var img = new Image
  img.src = buffer
  var ratio = img.width / img.height
  var width = img.width
  var height = width / ratio
  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')
  var canvas2 = new Canvas(width, height)
  var ctx2 = canvas2.getContext('2d')
  var canvas3 = new Canvas(width, height)
  var ctx3 = canvas3.getContext('2d')

  ctx2.drawImage(img, 0, 0, img.width/2, img.height, 0, 0, width, height)
  filterCanvas(red, canvas2, ctx2)

  ctx3.drawImage(img, img.width/2, 0, img.width, img.height, 0, 0, width, height)
  filterCanvas(blue, canvas3, ctx3)

  ctx.drawImage(canvas2, 0, 0, width/2, height)
  ctx.drawImage(canvas3, width/2, 0, width, height)

  var buffer = canvas.toDataURL()
  return buffer
}

app.post('/service', function(req, res) {
  var buffer = dataUriToBuffer(req.body.content.data)
  var glitchImage = lens3D(buffer)

  req.body.content.data = glitchImage
  req.body.content.type = buffer.type
  res.json(req.body)
})


app.listen(8080)
console.log('server running on port: ', 8080)