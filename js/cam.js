window.webagram = {
    localMediaStream: null,
    fs: null,
    error: null,
    _stop: false,
    _files: [],
    frameimages: []
};

var frames = 0;

window.webagram.gif = new GIF({
    workers: 4,
    quality: 30,
    delay: 100,
    repeat: 0
});


navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;



function errorHandler(err) {
    window.webagram.error = 1;
    var msg = 'An error occured: ';

    switch (err.code) {
    case FileError.NOT_FOUND_ERR:
        msg += 'File or directory not found';
        break;

    case FileError.NOT_READABLE_ERR:
        msg += 'File or directory not readable';
        break;

    case FileError.PATH_EXISTS_ERR:
        msg += 'File or directory already exists';
        break;

    case FileError.TYPE_MISMATCH_ERR:
        msg += 'Invalid filetype';
        break;

    default:
        msg += 'Unknown Error';
        break;
    }

    console.log(msg);
}

function stopRec() {
    window.webagram.video.pause();
    if (window.webagram.localMediaStream)
        window.webagram.localMediaStream.stop();
    window.webagram._stop = 1;
};


var initDirectory = function (fs) {
    fs.root.getDirectory('Video', {
        create: true
    }, function (dirEntry) {
        console.log('You have just created the ' + dirEntry.name + ' directory.');

        fs.root.getDirectory('Video', {}, function (dirEntry) {
            var dirReader = dirEntry.createReader();
            dirReader.readEntries(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (entry.isDirectory) {
                        console.log('Directory: ' + entry.fullPath);
                    } else if (entry.isFile) {
                        console.log('File: ' + entry.fullPath);
                        // remove comment to delete all files
                        window.webagram._files.push(entry.fullPath);
                        frames = parseInt(entry.fullPath[entry.fullPath.length - 1], 10);

                        if (frames === NaN || frames === 'NaN') {
                            frames = 0;
                        }

                        console.log('init', frames, typeof frames);

                    }
                }

            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
};

var deleteReplay = function () {
    window.webagram.fs.root.getDirectory('Video', {}, function (dirEntry) {
        var dirReader = dirEntry.createReader();
        dirReader.readEntries(function (entries) {
            if (!entries.length) alert('nothing to delete');
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.isFile) {
                    window.webagram.fs.root.getFile(entry.fullPath, {
                        create: false
                    }, function (fileEntry) {
                        fileEntry.remove(function () {
                            console.log('File successufully removed.');
                        }, errorHandler);
                    }, errorHandler);
                }
            }

        }, errorHandler);
    }, errorHandler);
};


var writeToFile = function (name, data) {

    window.webagram.fs.root.getFile('Video/' + name, {
        create: true,
        exclusive: true
    }, function (fileEntry) {
        console.log('A file ' + fileEntry.name + ' was created successfully.');
        window.webagram.fs.root.getFile('Video/' + fileEntry.name, {
            create: false
        }, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                console.log('writing to ' + 'Video/' + fileEntry.name);
                window.webagram._files.push('Video/' + fileEntry.name);
                window.URL = window.URL || window.webkitURL;
                var bb = new Blob([data], {
                    type: 'text/plain'
                });
                fileWriter.write(bb);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
};


var initFs = function (filesys) {
    window.webagram.fs = filesys;
    setTimeout(initDirectory(window.webagram.fs), 500);
    addLast();
};


var replayVideo = function (idx) {
    // reads through all the images and show them (image path stored in _files)

    stopRec(); // stop video recording
    //window.webagram.video.style.display = 'none'; // hide 
    window.webagram.replay.style.display = 'block'; // hide the video to see the recording
    idx = parseInt(idx, 10) || 0;


    if (window.webagram._files[idx] === undefined) {
        alert('nothing to play');
        return;
    }

    var img = window.webagram.replay;

    window.webagram.fs.root.getFile(window.webagram._files[idx], {}, function (fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                img.src = this.result;

                if (++idx < window.webagram._files.length) {
                    setTimeout(function () {
                        replayVideo(idx);
                    }, 200);
                }
            };
            reader.readAsText(file);
        }, errorHandler);
    }, errorHandler);
};

function timeStamp() {
    // Create a date object with the current time
    var now = new Date();

    // Create an array with the current month, day and time
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // Determine AM or PM suffix based on the hour
    var suffix = (time[0] < 12) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return date.join("-") + " " + time.join("-") + " " + suffix;
}


// e.g readFile('/Video/lastvideo')
var readFile = function (filename) {
    window.webagram.fs.root.getFile(filename, {}, function (fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                window.webagram.addImage(this.result);

            };
            //reader.readAsText(file);
            reader.readAsDataURL(file);
        }, errorHandler);
    }, errorHandler);
};

function fallback(e) {
    alert('User Media not supported in your browser');
}


window.webagram.gif.on('finished', function (blob) {

    var file = URL.createObjectURL(blob);
    writeToFile('lastvideo', blob);

    var myImage = document.createElement('img');
    myImage.src = file;
    window.webagram.finalgif.appendChild(myImage);

});

function makeGif() {
    window.webagram.gif.render();
}

function draw(v, bc, w, h) {

    bc.drawImage(v, 0, 0, w, h);
    var stringData = window.webagram.canvas.toDataURL();

    window.webagram.gif.addFrame(window.webagram.canvas, {
        copy: true,
        delay: 100
    });

    if (window.webagram.fs !== null) {
        console.log('drawcall', frames);
        writeToFile('frames' + frames++, stringData);
    }
    if (!window.webagram._stop) {
        //200
        setTimeout(function () {
            draw(v, bc, w, h);
        }, 100); // the timeout here decides video rec framerate
    }
}


function success(stream) {
    window.webagram.localMediaStream = stream;
    window.webagram.video.src = window.webkitURL.createObjectURL(stream);

    var back = window.webagram.canvas;
    var backcontext = back.getContext('2d');

    cw = 360;
    ch = 240;
    back.width = cw;
    back.height = ch;
    draw(window.webagram.video, backcontext, cw, ch);

}

function recordVideo() {
    webagram.video.src = '';
    if (!navigator.getUserMedia) {
        fallback();
    } else {
        navigator.getUserMedia({
            video: true
        }, success, fallback);
    }

}

function addLast() {
    readFile('/Video/lastvideo');
}


window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(window.TEMPORARY, 10 * 1024 * 1024, initFs, errorHandler);


window.webagram.addImage = function (src) {
    var img = document.createElement('img');
    img.src = src;
    window.webagram.activity.appendChild(img);
}



$(function () {

    window.webagram.video = document.querySelector('video');
    window.webagram.canvas = document.querySelector('canvas');
    window.webagram.finalgif = document.getElementById('finalgif');
    window.webagram.replay = document.getElementById('replay-screen');
    window.webagram.activity = document.getElementById('activity');

});