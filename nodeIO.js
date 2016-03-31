var fs = require('fs');

//decodeWAVFile('8k16bitpcm.wav', function(err, data){});
/*
var a = decodeWAVFile('440.wav', function(err, data){
    if( err ){
        console.error(err.message);
    }
});
console.log(a)
*/

function handleStart( fd, songData, callback ){
    var buffer = new Buffer(4);

    // Get the RIFF
    fs.readSync(fd, buffer, 0, 4, 0); // Synchronous version
    if( buffer.toString('ascii') != 'RIFF' ) {
        return callback( {message: '(1-4) Invalid RIFF tag'}, null );
    }

    // Get the filesize
    fs.readSync(fd, buffer, 0, 4, 4);
    // Everything is big-endian so must swap
    var filesize = (buffer[0] | buffer[1] << 8 | buffer[2] << 16 | buffer[3] << 24);
    songData.filesize = filesize;

    // Get WAVE
    fs.readSync(fd, buffer, 0, 4, 8);
    if( buffer.toString('ascii') != 'WAVE' ) {
        return callback( {message: '(9-12) Invalid WAVE tag'}, null);
    }

    return callback( null, filesize );
}

function handleSubChunks( fd, songData, callback ){
    var buffer = new Buffer(4);

    // Start at 12

    for( var i=12; i < songData.filesize; i += 4){
        fs.readSync(fd, buffer, 0, 4, i);
        var chunkName = buffer.toString('ascii');

        fs.readSync(fd, buffer, 0, 4, i+4);
        var chunkLength = buffer[0] | buffer[1] << 8 | buffer[2] << 16 | buffer[3] << 24;

        songData[chunkName] = { 'length': chunkLength, 'start': i+8 }

        i += chunkLength+4;

        if( chunkName == 'data' ){
            break;
        }
    }

    if( songData['fmt '] !== undefined ){
        songData.fmt = songData['fmt '];
        songData['fmt '] = undefined;
        populateFMT(fd, songData.fmt, function(err, data){
            if(err){
                console.error(err.message);
            }
        });
    }
}

function populateFMT( fd, fmt, callback ){
    var index = fmt.start;
    var buffer = new Buffer(4);

    if( fmt.length !== 16 ){
        return callback({message:'invalid fmt length'}, null);
    }

    // Get AudioFormat
    fs.readSync(fd, buffer, 0, 2, index);
    fmt.audioFormat = buffer[0] | buffer[1] << 8;
    index += 2;

    // Get NumChannels
    fs.readSync(fd, buffer, 0, 2, index);
    fmt.numChannels = buffer[0] | buffer[1] << 8;
    index += 2;

    // get SampleRate
    fs.readSync(fd, buffer, 0, 4, index);
    fmt.sampleRate = buffer[0] | buffer[1] << 8 | buffer[2] << 16 | buffer[3] << 24;
    index += 4;

    // get ByteRate
    fs.readSync(fd, buffer, 0, 4, index);
    fmt.byteRate = buffer[0] | buffer[1] << 8 | buffer[2] << 16 | buffer[3] << 24;
    index += 4;

    // get BlockAlign
    fs.readSync(fd, buffer, 0, 2, index);
    fmt.blockAlign = buffer[0] | buffer[1] << 8;
    index += 2;

    // get BitsPerSample
    fs.readSync(fd, buffer, 0, 2, index);
    fmt.bitsPerSample = buffer[0] | buffer[1] << 8;
    index += 2;

    return callback(null, fmt);
}

module.exports = function decodeWAVFile( file, callback ){
    // Set up a 32 bit buffer object
    var songData = {};

    if( typeof(file) == typeof('') ){
        // Open the file
        var fd = fs.openSync(file, 'r');
    } else if ( typeof(file) == typeof(0) ){ // check if number
        // file is already a FILE object
        var fd = file;
    }
    if( fd == undefined ){
        console.error("Unable to open the file");
        return;
    }

    // Ensure a somewhat valid WAVE file
    handleStart( fd, songData, function(err, filesize){
        if( err ){
            console.error(err.message);
        }
    });
    
    // Grab subchunks
    handleSubChunks( fd, songData, function(err, subchunks){
        if( err ){
            console.error(err.message);
        }
    });

    songData.fd = fd;

    callback( null, songData );
    return songData;
}

