var wav = require('./nodeIO.js');
var fs = require('fs');

var songData = wav('./wavefiles/splicetest.wav', function(err, data){
    if( err ){
        console.error(err.message);
    }
});

function getBuffer(hexCode) {
    buffer = new Buffer(4);
    buffer[3] = hexCode >>> 24 & 0xff;
    buffer[2] = hexCode >>> 16 & 0x00ff;
    buffer[1] = hexCode >>> 8 & 0x0000ff;
    buffer[0] = hexCode >>> 0 & 0x000000ff;
    return buffer;
}

function splice(outName, songData, start, end, callback) {
    if (end < start || start < 0 || end < 0 || start > songData.filesize || end > songData.filesize) {
        return callback({message: 'Invalid start time or end time.'});
    }

    if (typeof(outName) !== typeof('')) {
        return callback({message: 'Output filename must be a string.'});
    }

    if (!songData) {
        return callback({message: 'Song data is not found.'});
    }

    var buffer = new Buffer(4);
    var newFile = fs.openSync(outName, 'w');

    var newDataSize = songData.fmt.byteRate*(end-start);
    var newFileSize = newDataSize + 44;

    // copy the starter and fmti from original
    for (var i = 0; i < songData.filesize; i+=4) {
        if (i === 4) {
            // Write new file size
            fs.writeSync(newFile, getBuffer(newFileSize), 0, 4);
        } else if (i === 40) {
            // Write new data size
            fs.writeSync(newFile, getBuffer(newDataSize), 0, 4);
        } else if (i < 40 || (i > songData.fmt.byteRate*start && i <= songData.fmt.byteRate*end)) {
            // Else if we're reading in the header region or the correct data region, write same data over
            fs.readSync(songData.fd, buffer, 0, 4, i);
            fs.writeSync(newFile, buffer, 0, 4);
        }
        
    }

    fs.closeSync(newFile);
}

splice('./wavefiles/writing_to_file.wav', songData, 2, 4, function(err) {
    if (err) {
        console.log(err.message);
    }
});

// console.log(songData);
