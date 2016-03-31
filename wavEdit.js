var wav = require('./nodeIO.js');
var fs = require('fs');

var songData = wav('./wavefiles/combine.wav', function(err, data){
    if( err ){
        console.error(err.message);
    }
});

var testsong = wav('./wavefiles/writing_to_file.wav', function(err, data) {
    if (err) {
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

function writeHeader(oldFile, newFile, newDataSize, newFileSize) {
    var buffer = new Buffer(4);

    for (var i=0; i<40; i+=4) {
        if (i===4) {
            fs.writeSync(newFile, getBuffer(newFileSize), 0, 4);
        } else if (i===40) {
            // Write new data size
            fs.writeSync(newFile, getBuffer(newDataSize), 0, 4);
        } else {
            // Else if we're reading in the header region or the correct data region, write same data over
            fs.readSync(songData.fd, buffer, 0, 4, i);
            fs.writeSync(newFile, buffer, 0, 4);
        }
    }
}

function splice(outName, songData, start, end, callback) {
    if (end < start || start < 0 || end < 0 || start > songData.filesize || end > songData.filesize)
        return callback({message: 'Invalid start time or end time.'});

    if (typeof(outName) !== typeof(''))
        return callback({message: 'Output filename must be a string.'});

    if (!songData)
        return callback({message: 'Song data is not found.'});

    var buffer = new Buffer(4);
    var newFile = fs.openSync(outName, 'w');
    var newDataSize = songData.fmt.byteRate*(end-start);
    var newFileSize = newDataSize + 44;

    writeHeader(songData.fd, newFile, newDataSize, newFileSize);

    var begin = songData.fmt.byteRate*start + 40,
        end = songData.fmt.byteRate*end + 40;

    for (var i=begin; i<=end; i+=4) {
        fs.readSync(songData.fd, buffer, 0, 4, i);
        fs.writeSync(newFile, buffer, 0, 4);
    }

    fs.closeSync(newFile);
}

function combine(outName, trackA, trackB, callback) {
    if (typeof(outName) !== typeof('')) {
        return callback({message: 'Output filename must be a string.'});
    }

    if (!trackA) {
        return callback({message: 'Track A is not found.'});
    } else if (!trackB) {
        return callback({message: 'Track B is not found.'});
    }

    var newFileSize = trackA.filesize + trackB.filesize - 44;
    var buffer = new Buffer(4);
    var newFile = fs.openSync(outName, 'w');

    writeHeader(trackA.fd, newFile, newFileSize-44, newFileSize);

    for (var i=40; i<=trackA.filesize; i+=4) {
        fs.readSync(trackA.fd, buffer, 0, 4, i);
        fs.writeSync(newFile, buffer, 0, 4);
    }

    for (var i=40; i<=trackB.filesize; i+=4) {
        fs.readSync(trackB.fd, buffer, 0, 4, i);
        fs.writeSync(newFile, buffer, 0, 4);
    }

    fs.closeSync(newFile);
}
