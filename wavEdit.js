var wav = require('./nodeIO.js');
var fs = require('fs');

var songData = wav('./wavefiles/440.wav', function(err, data){
    if( err ){
        console.error(err.message);
    }
});

var buffer = new Buffer(4);
var newFile = fs.openSync('./wavefiles/writing_to_file.wav', 'w');

var start = 0.2, end = 0.6;


// copy the starter and fmti from original

for( var i = 0; i < songData.fileSize; i+=4) {
    if (i === 4) {
        //fs.writeSync(newFile, 
    }
    fs.readSync(songData.fd, buffer, 0, 4, i);
    console.log(buffer)
    fs.writeSync(newFile, buffer, 0, 4);
}

var newDataSize = songData.fmt.byteRate*(end-start);
var newFileSize = newDataSize + 44;



fs.closeSync(newFile);

console.log(songData);
