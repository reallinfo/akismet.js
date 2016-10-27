/**
 * Build system.
 */
'use strict';

const browserify = require('browserify');
const child = require('child_process');
const del = require('del');
const express = require('express');
const fs = require('fs');
const gulp = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const os = require('os');
const path = require('path');
const pkg = require('./package.json');

/**
 * The task settings.
 * @type {object}
 */
const config = {
  output: `${pkg.name}-${pkg.version}.zip`,
  sources: ['akismet.js', '*.json', '*.md', '*.txt', 'bin/*.js', 'lib/*.js']
};

/**
 * The build environment.
 * @type {string}
 */
const environment = 'NODE_ENV' in process.env ? process.env.NODE_ENV : 'development';

/**
 * The task plugins.
 * @type {object}
 */
const plugins = loadPlugins({
  pattern: ['gulp-*', '@*/gulp-*', 'vinyl-*'],
  replaceString: /^(gulp|vinyl)-/
});

/**
 * Runs the default tasks.
 */
gulp.task('default', ['css', 'js']);

/**
 * Checks the package dependencies.
 */
gulp.task('check', () => {
  const {david} = plugins.cedx.david;
  return gulp.src('package.json').pipe(david()).on('error', function(err) {
    console.error(err);
    this.emit('end');
  });
});

/**
 * Deletes all generated files and reset any saved state.
 */
gulp.task('clean', () =>
  del(['var/**/*', `${os.homedir()}/.forever/akismet.log`])
);

/**
 * Sends the results of the code coverage.
 */
gulp.task('coverage', ['test'], () => {
  let command = path.join('node_modules/.bin', process.platform == 'win32' ? 'codacy-coverage.cmd' : 'codacy-coverage');
  return _exec(`${command} < var/lcov.info`);
});

/**
 * Creates a distribution file for this program.
 */
gulp.task('dist', ['default'], () => gulp.src(config.sources, {base: '.'})
  .pipe(plugins.zip(config.output))
  .pipe(gulp.dest('var'))
);

/**
 * Builds the documentation.
 */
gulp.task('doc', () => {
  let command = path.join('node_modules/.bin', process.platform == 'win32' ? 'esdoc.cmd' : 'esdoc');
  return del('doc/api').then(() => _exec(`${command} -c doc/esdoc.json`));
});

/**
 * Fixes the coding standards issues.
 */
gulp.task('fix', () => gulp.src(['gulpfile.js', 'bin/*.js', 'lib/**/*.js', 'test/**/*.js', 'web/js/main.js'], {base: '.'})
  .pipe(plugins.eslint({fix: true}))
  .pipe(gulp.dest('.'))
);

/**
 * Builds the client scripts.
 */
gulp.task('js', ['js:assets', 'js:build', 'js:tests']);

gulp.task('js:assets', () => gulp.src('node_modules/mocha/mocha.js')
  .pipe(plugins.uglify())
  .pipe(gulp.dest('web/js'))
);

gulp.task('js:build', () => {
  let sources = browserify({debug: true, entries: ['./lib/index.js']})
    .transform('babelify', {presets: ['es2015']});

  let stream = sources.bundle().on('error', function(err) {
    console.error(err);
    this.emit('end');
  })
  .pipe(plugins.sourceStream('akismet.js'))
  .pipe(plugins.buffer());

  if (environment != 'development') stream.pipe(plugins.uglify());
  return stream.pipe(gulp.dest('.'));
});

gulp.task('js:tests', () => {
  let sources = browserify({debug: true, entries: ['./web/js/main.js']})
    .transform('babelify', {presets: ['es2015']});

  let stream = sources.bundle().on('error', function(err) {
    console.error(err);
    this.emit('end');
  })
  .pipe(plugins.sourceStream('tests.js'))
  .pipe(plugins.buffer());

  if (environment != 'development') stream.pipe(plugins.uglify());
  return stream.pipe(gulp.dest('web/js'));
});

/**
 * Performs static analysis of source code.
 */
gulp.task('lint', () => gulp.src(['gulpfile.js', 'bin/*.js', 'lib/**/*.js', 'test/**/*.js', 'web/js/main.js'])
  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError())
);

/**
 * Starts the Akismet server.
 */
gulp.task('serve', () => {
  if ('_server' in global) global._server.kill();
  global._server = child.fork('bin/cli.js');
  return Promise.resolve();
});

/**
 * Runs the unit tests.
 */
gulp.task('test', ['test:coverage'], () => gulp.src(['test/*.js'], {read: false})
  .pipe(plugins.mocha())
  .pipe(plugins.istanbul.writeReports({dir: 'var', reporters: ['lcovonly']}))
);

gulp.task('test:coverage', ['test:env'], () => gulp.src(['lib/**/*.js'])
  .pipe(plugins.istanbul())
  .pipe(plugins.istanbul.hookRequire())
);

gulp.task('test:env', () =>
  'AKISMET_API_KEY' in process.env ? Promise.resolve() : Promise.reject(new Error('AKISMET_API_KEY environment variable not set.'))
);

/**
 * Watches for file changes.
 */
gulp.task('watch', ['default', 'serve'], () => {
  let server = express();
  server.use(express.static(path.join(__dirname, 'web')));
  server.listen(5000, () => console.log('Web server listening on http://localhost:5000'));

  gulp.watch(['lib/**/*.js', 'test/*.js', 'web/js/main.js'], ['js:tests']);
  gulp.watch('lib/**/*.js', ['serve']);
});

/**
 * Runs a command and prints its output.
 * @param {string} command The command to run, with space-separated arguments.
 * @param {object} [options] The settings to customize how the process is spawned.
 * @return {Promise<string>} The command output when it is finally terminated.
 */
function _exec(command, options = {}) {
  return new Promise((resolve, reject) => child.exec(command, options, (err, stdout) => {
    if (err) reject(err);
    else resolve(stdout.trim());
  }));
}
