#! /usr/bin/env node

var program = require('commander');
var exec = require('child_process').exec;
var events = require('events');
var eventEmitter = new events.EventEmitter();

program.version('0.0.1');

program
  .command('clone <file> [svnUrl] [dirName]')
  .alias('co')
  .description('clone svn repository use git svn clone')
  .action(function(file, url, dirName) {
    try {
        console.log('Start to clone subversion repository...\n');
        cloneSvn(file, url, dirName);
    } catch (e) {
        console.error(e);
    }
  });

program
  .command('convert')
  .alias('ct')
  .description("Convert svn branches\tags to git's")
  .action(function(cmd, options) {
    convertSvn2Git();
  });

if (!process.argv.slice(2).length) {
    program.outputHelp();
}

program.parse(process.argv);

function cloneSvn(file, url, dirName) {
    if (file == undefined) {
        console.log("Need a file users.txt");
        return;
    }
    if (url == undefined) {
        console.log("subversion repository url is empty.");
        return;
    }
    if (dirName == undefined) {
        console.log("Project name cannot be empty.");
        return;
    }
    var cmd = "git svn clone --stdlayout --no-metadata -A"  + " " + file + " " + url + " " + dirName;
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            console.error(stderr);
            retry(dirName, 1);
        } else {
            console.log(stdout);
        }
    });
}

function retry(dirName, times) {
    var cmd = "git svn fetch";
    console.log(times + " Try again, fetch the repository...");
    exec(cmd, {cwd: process.cwd() + "/" + dirName}, function(error, stdout, stderr) {
        if (error) {
            console.error(stderr);
            retry(dirName, ++times);
        } else {
            console.log(stdout);
        }
    })
}

function convertSvn2Git() {
    var cmd1 = "git for-each-ref refs/remotes | cut -d / -f 3- | grep -v @ | while read branchname; do git branch \"$branchname\" \"refs/remotes/$branchname\"; git branch -r -d \"$branchname\"; done";
    exec(cmd1, function(error, stdout, stderr) {
        if (error) {
            console.error(stderr);
        } else {
            console.info(stdout);
            convertTags();
        }
    });
}

function convertTags() {
    var cmd_b = "git branch";
    exec(cmd_b, function(error, stdout, stderr) {
        if (error) {
            console.error(stderr);
        } else {
            console.info(stdout);
            var arr = stdout.split("\n");
            var res = [];
            for (k in arr) {
                var s = arr[k];
                if (s.indexOf("tags") != -1) {
                    res.push(s);
                }
            }
            eventEmitter.emit('convert_tag', res, 0);
        }
    });
}

function switch2Branch(b, call) {
    var cmd = "git checkout " + b;
    exec(cmd, call);
}

eventEmitter.addListener('convert_tag', callBack);

function callBack(arr, index) {
    if (index >= arr.length) {
        return;
    }
    var tag = arr[index];
    var tagName = tag.substring(tag.indexOf("tags/") + 5);
    var cmd = "git checkout " + tag;
    cmd += "\ngit tag " + tagName;
    cmd += "\ngit checkout master";
    cmd += "\ngit branch -D " + tag;
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            console.error(stderr);
        } else {
            console.info(stdout);
        }
        eventEmitter.emit('convert_tag', arr, ++index);
    });
};
