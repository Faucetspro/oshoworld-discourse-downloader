const Downloader = require('mt-files-downloader');
const chalk = require('chalk');

module.exports = function(dl, num) {
	num = num || 1;

	var timer = setInterval(function() {
		if(dl.status == 0) {
			console.log(chalk.bgRed('Download '+ num +' not started.'));
		} else if(dl.status == 1) {
			var stats = dl.getStats();
			console.log(chalk.magentaBright('Download '+ num +' is downloading:'));
			console.log(chalk.whiteBright('Download progress: '+ stats.total.completed +' %'));
			console.log(chalk.blue('Download speed: '+ Downloader.Formatters.speed(stats.present.speed)));
			console.log('Download time: '+ Downloader.Formatters.elapsedTime(stats.present.time));
			console.log('Download ETA: '+ Downloader.Formatters.remainingTime(stats.future.eta));
		} else if(dl.status == 2) {
			console.log('Download '+ num +' error... retrying');
		} else if(dl.status == 3) {
			console.log('Download '+ num +' completed !');
		} else if(dl.status == -1) {
			console.log('Download '+ num +' error : '+ dl.error);
		} else if(dl.status == -2) {
			console.log('Download '+ num +' stopped.');
		} else if(dl.status == -3) {
			console.log('Download '+ num +' destroyed.');
		}

		console.log(chalk.green('======================================================================='));

		if(dl.status === -1 || dl.status === 3 || dl.status === -3) {
			clearInterval(timer);
			timer = null;
		}
	}, 1000);
};