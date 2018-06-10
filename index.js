const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const exif = require('fast-exif');
const { DateTime } = require('luxon');
const { exec } = require('child_process');
const ExifTool = require('exiftool-kit')
const exiftool = new ExifTool()
const config = require('./config.json')

console.log(config)

const log = (photo, message) => {
	if(false) console.log(photo, '  #####  ' ,message)
};

var watcher = chokidar.watch(config.importFolder, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  awaitWriteFinish: {
	  stabilityThreshold: 10000
  }
});

watcher.on('add', filepath => {
	log(filepath,'start processing');
	if(filepath.indexOf('SynoEAStream')>=0 || filepath.indexOf('@eaDir')>=0) {
		return false;
	}

	if(path.extname(filepath).toLowerCase() == '.jpg') {
		log(filepath,'its a photo');
		exif.read(filepath).then(data => {
			log(filepath,'read exif');
			var datetime = (data) ? new Date((data.exif) ? data.exif.DateTimeOriginal : null) :  null;
			if(datetime == null || datetime.getFullYear() == 1970 || isNaN(datetime.getFullYear())) {
				log(filepath,'no valid exif date found. use file times instead');
				fs.stat(filepath, (a,stats) => {
					var times = [
						new Date(stats.atime).getTime(),
						new Date(stats.mtime).getTime(),
						new Date(stats.ctime).getTime(),
						new Date(stats.birthtime).getTime()
					]
					times.sort();
					copyFileByDate(filepath, new Date(times.shift()));

				})
			} else {
				copyFileByDate(filepath, datetime);
			}
		}).catch(err => {
			throw err;
		});
	} else {
		//no image, move to different folder
		log(filepath,'not a photo, move to no-photo folder.');
		fs.rename(filepath, config.invalidFolder+path.basename(filepath), (err) => {
		  if (err) throw err;
		})
	}
});

var copyFileByDate = (filepath, datetime) => {
	log(filepath,'start copy');
	var dir = config.outputFolder + datetime.getFullYear() + '/' + DateTime.fromJSDate(datetime).toISODate()
	if(!fs.existsSync(config.outputFolder + datetime.getFullYear())) {
		log(filepath,'create year folder: "' + datetime.getFullYear() + '"');
		fs.mkdirSync(config.outputFolder + datetime.getFullYear());
		exec('synoindex -A '+config.outputFolder + datetime.getFullYear(), (err, stdout, stderr) => {
			if (err) throw err;
			log(filepath,'index updated');
		});
	}
	if(!fs.existsSync(dir)) {
		log(filepath,'create day folder: "' + datetime.getFullYear() + '/' + DateTime.fromJSDate(datetime).toISODate() + '"');
		fs.mkdirSync(dir);
		exec('synoindex -A '+dir, (err, stdout, stderr) => {
			if (err) throw err;
			log(filepath,'index updated');
		});
	}
	fs.rename(filepath, dir+'/'+path.basename(filepath), (err) => {
		if (err) throw err;
		log(filepath,'sorted photo "'+path.basename(filepath)+'" successfully.');

		var tags = filepath.replace(config.importFolder,'').replace(path.basename(filepath),'').replace('/','')
		if(tags) {
			log(filepath,'write tags: ' + tags);
			exiftool.setTags({
				source: dir+'/'+path.basename(filepath),
				tags: [
					{ tag: 'iptc:keywords', value: tags }
				]
			})
		}

		exec('synoindex -a '+dir+'/'+path.basename(filepath), (err, stdout, stderr) => {
		  if (err) throw err;
		  log(filepath,'index updated');
		});
	})
}
